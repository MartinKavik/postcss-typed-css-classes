let postcss = require('postcss')
let fs = require('fs')
let selectorParser = require('postcss-selector-parser')

// --------------- GENERATORS ------------------
// can't lazyload because of preconfigured linters from PostCSS plugin template
let rustGeneratorModule = require('./generators/rust_generator')
let jsonGeneratorModule = require('./generators/json_generator')

/** Exchange generator name from plugin opts for generator instance
 *
 * @param {string} generatorName generator name
 * @returns {function} generator
 */
function getDefaultGenerator (generatorName) {
  generatorName = generatorName.toLowerCase()
  switch (generatorName) {
    case 'rust':
      return rustGeneratorModule.generate
    case 'json':
      return jsonGeneratorModule.generate
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
  opts = opts || {}

  let outputFilepath = validateAndReturnOutputFilepath(opts.output_filepath)
  let generator = validateAndReturnGenerator(opts.generator)
  let filter = validateAndReturnFilter(opts.filter)

  return function (root) {
    let parsedClasses = getAndFilterParsedClasses(root, filter)
    let aggregatedParsedClasses = aggregateParsedClasses(parsedClasses)
    let generatedCode = generator(aggregatedParsedClasses)

    if (typeof generatedCode === 'string') {
      // NOTE: there are *Sync functions because of simplicity in es5
      if (fs.existsSync(outputFilepath)) {
        let oldGeneratedCode = fs.readFileSync(outputFilepath, 'utf8')
        if (oldGeneratedCode === generatedCode) {
          return
        }
      }
      fs.writeFileSync(outputFilepath, generatedCode)
    }
  }
})
// ------------------ //MAIN ------------------------

// ------------------- VALIDATORS ----------------------
/** User has to set output_filepath in opts
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

/** User has to set output_filepath in opts
 *
 * generator example: `"rust"`
 * generator example 2: `function() {}`
 * generator example 3: ``(classes) => `Classes: ${classes.length}``
 *
 * @param {string | function} optsGenerator generator from options
 * @returns {function} generator
 */
function validateAndReturnGenerator (optsGenerator) {
  if (!optsGenerator) {
    throw new Error(ERROR_PREFIX + 'You have to set opts.generator!')
  }

  if (typeof optsGenerator === 'string') {
    return getDefaultGenerator(optsGenerator)
  } else if (typeof optsGenerator === 'function') {
    return optsGenerator
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
 * @return {bool} include class in output
 */
function validateAndReturnFilter (filter) {
  if (!filter) {
    throw new Error(ERROR_PREFIX + 'You have to set opts.filter!')
  }
  if (typeof filter === 'function') {
    return filter
  } else {
    throw new Error(
      ERROR_PREFIX + 'opts.filter has to be function!'
    )
  }
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
function getAndFilterParsedClasses (root, filter) {
  let parsedClasses = []
  root.walkRules(rule => {
    let parsedClassesFromRule = getParsedClassesFromRule(rule)
    Array.prototype.push.apply(parsedClasses, parsedClassesFromRule)

    // filter classes for css output
    parsedClassesFromRule.forEach(class_ => {
      if (!filter(class_.name)) {
        rule.remove()
      }
    })
  })
  return parsedClasses
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

  let parsedClasses = classNames.map(className => {
    return {
      name: className,
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
