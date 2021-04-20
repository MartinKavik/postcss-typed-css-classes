const postcss = require('postcss')
const fs = require('fs')
const selectorParser = require('postcss-selector-parser')
const fg = require('fast-glob')

// --------------- GENERATORS ------------------
// can't lazyload because of preconfigured linters from PostCSS plugin template
const rustGeneratorModule = require('./generators/rust_generator')
const jsonGeneratorModule = require('./generators/json_generator')

/** Exchange generator name from plugin opts for generator instance
 *
 * @param {string} generatorName generator name
 * @returns {object} generatorModule
 */
function getDefaultGeneratorModule (generatorName) {
  generatorName = generatorName.toLowerCase()
  switch (generatorName) {
    case 'rust':
      return rustGeneratorModule
    case 'json':
      return jsonGeneratorModule
    default:
      throw new Error(ERROR_PREFIX +
        'default generator ' + generatorName + ' doesn\'t exist!'
      )
  }
}

// --------------- //GENERATORS ------------------

// ------------------- MAIN ----------------------
const ERROR_PREFIX = 'POSTCSS_TYPED_CSS_CLASSES: '

module.exports = postcss.plugin('postcss-typed-css-classes', opts => {
  let gerneratorModule = validateAndReturnGeneratorModule(opts &&
    opts.generator)
  let {
    generate: generator,
    escapeClassName = className => className,
    defaults = {},
    output_filepath: outputFilePath,
    content,
    filter,
    purge = false
  } = Object.assign(gerneratorModule, opts || {})

  let validOutputFilepath =
    validateAndReturnOutputFilepath(outputFilePath || defaults.output_filepath)
  let validContent =
    validateAndReturnContent(content || defaults.content,
      defaults.content && defaults.content[0])
  let validFilter = validateAndReturnFilter(filter)
  let validPurge = validateAndReturnPurge(purge)

  return function (root) {
    let parsedClasses =
      validFilter ? getAndFilterParsedClassesWithFilter(root,
        validFilter) : getAndFilterParsedClassesWithOpts(root,
        escapeClassName, validOutputFilepath, validContent, validPurge, escape)

    let aggregatedParsedClasses = aggregateParsedClasses(parsedClasses)
    let generatedCode = generator(aggregatedParsedClasses)

    if (typeof generatedCode === 'string') {
      // NOTE: there are *Sync functions because of simplicity in es5
      if (fs.existsSync(validOutputFilepath)) {
        let oldGeneratedCode = fs.readFileSync(validOutputFilepath, 'utf8')
        if (oldGeneratedCode === generatedCode) {
          return
        }
      }
      fs.writeFileSync(validOutputFilepath, generatedCode)
    }
  }
})
// ------------------ //MAIN ------------------------

// ------------------- VALIDATORS ----------------------
/** User has to set output_filepath in opts if no default
 *
 * output_filepath example: `path.resolve(__dirname, 'css_classes.rust')`
 *
 * @param {string} optsOutputFilepath output_filepath from options
 * @return {string} outputFilePath
 */
function validateAndReturnOutputFilepath (optsOutputFilepath) {
  if (!optsOutputFilepath) {
    throw new Error(ERROR_PREFIX + 'You have to set opts.output_filepath!')
  }
  return optsOutputFilepath
}

/** User has to set generator in opts
 *
 * generator example: `"rust"`
 * generator example 2: `function() {}`
 * generator example 3: ``(classes) => `Classes: ${classes.length}``
 *
 * @param {string | function} optsGenerator generator from options
 * @returns {Object} generatorModule
 */
function validateAndReturnGeneratorModule (optsGenerator) {
  if (!optsGenerator) {
    throw new Error(ERROR_PREFIX + 'You have to set opts.generator!')
  }

  if (typeof optsGenerator === 'string') {
    return getDefaultGeneratorModule(optsGenerator)
  } else if (typeof optsGenerator === 'function') {
    return { generate: optsGenerator, default: {} }
  } else {
    throw new Error(
      ERROR_PREFIX + 'opts.generator has to be string or a function!'
    )
  }
}

/** User has to set filter in opts
 *
 * filter example: `function() { return true }`
 * filter example 2: `(class_) => class_ !== "not_this_class"`
 *
 * @param {function} filter filter function
 * @return {function | undefined} filter function
 */
function validateAndReturnFilter (filter) {
  if (!filter) {
    return filter
  }
  if (typeof filter === 'function') {
    return filter
  } else {
    throw new Error(
      ERROR_PREFIX + 'opts.filter has to be function!'
    )
  }
}

/** User can set optional purge in opts
 *
 * purge example: `true`
 * purge example 2: `false`
 *
 * @param {boolean} [purge=false] purge from opts
 * @return {boolean} purge
 */
function validateAndReturnPurge (purge) {
  return !!purge
}

/** User can set content in opts if default not set
 *
 * content example: `'./src/**\/*'`
 * content example 2: `[{}]`
 *
 * @param {string | array} content from opts
 * @return {array} content array
 */
function validateAndReturnContent (content, defaultContent = {}) {
  if (!content) {
    return defaultContent
  }
  // If a string was passed to content, then use as path and take the defaults
  if (typeof content === 'string') {
    return [Object.assign({}, defaultContent, { path: [content] })]
  }
  if (Array.isArray(content)) {
    return content.map(opts => {
      let {
        path,
        regex,
        mapper = className => className,
        escape
      } = Object.assign({}, defaultContent, opts)
      if (!path) {
        throw new Error(
          ERROR_PREFIX + 'You have to set opts.content path to string or array!'
        )
      }
      if (typeof path === 'string') {
        return Object.assign({}, defaultContent, {
          path: [path],
          regex,
          mapper,
          escape
        })
      }
      if (Array.isArray(path)) {
        if (typeof mapper !== 'function') {
          throw new Error(
            ERROR_PREFIX + 'opts.content mapper must be a function!'
          )
        }
        return Object.assign({}, defaultContent, {
          path,
          regex,
          mapper,
          escape
        })
      }
      throw new Error(
        ERROR_PREFIX + 'opts.content path needs to be a string or array!'
      )
    })
  }
  throw new Error(
    ERROR_PREFIX + 'opts.content needs to be a string or array!'
  )
}
// ------------------- //VALIDATORS ----------------------

/** Get classes and their metadata from css file, start from PostCSS root
 * And filter css classes (it mutates input (resp. output) css)
 *
 * Example
 * Input:
  @media (min-width: 576px) {
    .container {
      max-width: 576px;
    }
  }
 *
 * Output:
 *
    {
        "name": "container",
        "properties": [
            {
                "property": "max-width: 576px",
                "mediaQuery": "@media (min-width: 576px)"
            },
        ]
    }
 *
 * @param {postcss.Root} root css root
 * @param {function} filter filter function
 * @returns {array} parsedClasses
 */
function getAndFilterParsedClassesWithFilter (root, filter) {
  let parsedClasses = []
  root.walkRules(rule => {
    let parsedClassesFromRule = getParsedClassesFromRule(rule)
    Array.prototype.push.apply(parsedClasses, parsedClassesFromRule)

    // filter classes for css output
    parsedClassesFromRule.forEach(class_ => {
      if (!filter(class_.name)) {
        if (rule.selectors.length < 2) {
          rule.remove()
        } else {
          // just remove the class selector
          let regex = RegExp(`\\b${ class_.name }\\b`)
          let selectors = rule.selectors
            .filter(selector => !regex.test(selector))
          if (selectors.length === 0) {
            rule.remove()
          } else {
            rule.selector = selectors.join(',')
          }
        }
      }
    })
  })
  return parsedClasses
}

/** Get classes and their metadata from css file, start from PostCSS root
 * And filter css classes (it mutates input (resp. output) css)
 *
 * Example
 * Input:
  @media (min-width: 576px) {
    .container {
      max-width: 576px;
    }
  }
 *
 * Output:
 *
    {
        "name": "container",
        "properties": [
            {
                "property": "max-width: 576px",
                "mediaQuery": "@media (min-width: 576px)"
            },
        ]
    }
*
* @param {postcss.Root} root css root
* @param {function} escapeClassName function from module
* @param {string} output_filepath from opts
* @param {array} content from opts
* @param {boolean} purge from opts
* @param {boolean} escape from opts
* @returns {array} parsedClasses
*/
function getAndFilterParsedClassesWithOpts (root, escapeClassName,
  outputFilepath, content, purge, escape) {
  let parsedClasses = []
  let usedCssClasses = new Set()
  if (purge) {
    content.forEach(({ path, regex, mapper }) => {
      let files = fg.sync(path, { ignore: [outputFilepath] })
      files.forEach(filePath => {
        let fileContent = fs.readFileSync(filePath, 'utf8')
        // example of a used class in Rust code is `C.mb_16`

        let usedCssClassesInFile = fileContent.match(regex) || []

        usedCssClassesInFile
          // remove prefix `C.`
          .map(mapper).flat()
          // add class to set
          .forEach(class_ => usedCssClasses.add(
            escape ? escapeClassName(class_) : class_)
          )
      })
    })
  }
  root.walkRules(rule => {
    let parsedClassesFromRule = getParsedClassesFromRule(rule)
    Array.prototype.push.apply(parsedClasses, parsedClassesFromRule)
    // rule.remove()
    if (purge) {
      // filter classes for css output
      parsedClassesFromRule.forEach(class_ => {
        if (!usedCssClasses.has(escapeClassName(class_.name))) {
          // just remove the class selector
          let regex = RegExp(`\\b${ escapeRegExp(class_.name) }\\b`)
          let selectors = rule.selectors
            .filter(selector => !regex.test(selector))
          if (selectors.length === 0) {
            rule.remove()
          } else {
            rule.selector = selectors.join(',')
          }
        }
      })
    }
  })
  // remove empty atRules
  if (purge) {
    root.walkAtRules(atRule => {
      let { nodes, params } = atRule
      if ((nodes && !nodes.length) ||
        (!nodes && !params) || (!params && !nodes.length)) {
        atRule.remove()
      }
    })
  }

  return parsedClasses
}

function escapeRegExp (string) {
  return string.replace(/[$()*+.:?[\\\]^{|}]/g, '\\\\$&')
}

/** Aggregate classes by name
 *
 * Example
 * Input:
 [
    {
        "name": "container",
        "properties": [
            {
                "property": "max-width: 576px",
                "mediaQuery": "@media (min-width: 576px)"
            },
        ]
    }
    {
        "name": "container",
        "properties": [
            {
                "property": "max-width: 768px",
                "mediaQuery": "@media (min-width: 768px)"
            }
        ]
    }
]
 *
 * Output:
  {
        "name": "container",
        "properties": [
            {
                "property": "max-width: 576px",
                "mediaQuery": "@media (min-width: 576px)"
            },
            {
                "property": "max-width: 768px",
                "mediaQuery": "@media (min-width: 768px)"
            }
        ]
    }
 *
 * @param {array} parsedClasses parsedClasses
 * @returns {array} aggregatedParsedClasses
 */
function aggregateParsedClasses (parsedClasses) {
  let aggregatedParsedClasses = []
  parsedClasses.forEach(parsedClass => {
    let index = findAggregatedParsedClassIndex(
      aggregatedParsedClasses,
      parsedClass.name
    )

    if (index !== null) {
      Array.prototype.push.apply(
        aggregatedParsedClasses[index].properties,
        parsedClass.properties
      )
    } else {
      aggregatedParsedClasses.push(parsedClass)
    }
  })
  return aggregatedParsedClasses
}

// ------------------ HELPERS ------------------------

/** Old school .findIndex()
 *
 * @param {array} aggregatedParsedClasses aggregatedParsedClasses
 * @param {string} parsedClassName parsedClassName
 * @returns {number | null} index
 */
function findAggregatedParsedClassIndex (
  aggregatedParsedClasses, parsedClassName
) {
  for (let [i, element] of aggregatedParsedClasses.entries()) {
    if (element.name === parsedClassName) {
      return i
    }
  }
  return null
}

/** Get class names and metadata from PostCSS rule
 *
 * @param {postcss.Rule} rule css rule
 * @returns {array} parsedClasses
 */
function getParsedClassesFromRule (rule) {
  let classNames = getClassNamesFromRule(rule)
  let properties = getPropertiesFromRule(rule)
  let mediaQuery = getMediaQueryFromRule(rule)

  let parsedClasses = classNames.map(prefix => {
    return {
      name: prefix,
      properties: properties.map(property => {
        return {
          property,
          mediaQuery
        }
      })
    }
  })
  return parsedClasses
}

/** Get media query from PostCSS rule
 *
 * @param {postcss.Rule} rule css rule
 * @returns {string | null} parent media query
 */
function getMediaQueryFromRule (rule) {
  if (rule.parent.type === 'atrule' && rule.parent.name === 'media') {
    return '@' + rule.parent.name + ' ' + rule.parent.params
  } else {
    return null
  }
}

/** Get class properties from PostCSS rule
 *
 * @param {postcss.Rule} rule css rule
 * @returns {array} rule properties
 */
function getPropertiesFromRule (rule) {
  let properties = []

  rule.walkDecls(declaration => {
    properties.push(declaration.toString())
  })
  return properties
}

/** Get class names from PostCSS rule
 *
 * @param {postcss.Rule} rule css rule
 * @returns {array} class names
 */
function getClassNamesFromRule (rule) {
  let classNames = []

  selectorParser(selectors => {
    selectors.walkClasses(classNode => {
      classNames.push(classNode.value)
    })
  }).processSync(rule)

  return classNames
}
// ------------------ //HELPERS ------------------------
