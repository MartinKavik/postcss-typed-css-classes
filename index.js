var postcss = require('postcss')
var fs = require('fs')
var selectorParser = require('postcss-selector-parser')

// --------------- GENERATORS ------------------
// can't lazyload because of preconfigured linters from PostCSS plugin template
var rustGeneratorModule = require('./generators/rust_generator')
var jsonGeneratorModule = require('./generators/json_generator')

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
var ERROR_PREFIX = 'POSTCSS_TYPED_CSS_CLASSES: '

module.exports = postcss.plugin('postcss-typed-css-classes', function (opts) {
  opts = opts || {}

  var outputFilepath = validateAndReturnOutputFilepath(opts.output_filepath)
  var generator = validateAndReturnGenerator(opts.generator)

  return function (root) {
    var parsedClasses = getParsedClasses(root)
    var aggregatedParsedClasses = aggregateParsedClasses(parsedClasses)
    var generatedCode = generator(aggregatedParsedClasses)
    fs.writeFileSync(outputFilepath, generatedCode)
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
// ------------------- //VALIDATORS ----------------------

/** Get classes and their metadata from css file, start from PostCSS root
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
 * @returns {array} parsedClasses
 */
function getParsedClasses (root) {
  var parsedClasses = []
  root.walkRules(function (rule) {
    Array.prototype.push.apply(parsedClasses, getParsedClassesFromRule(rule))
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
  var aggregatedParsedClasses = []
  parsedClasses.forEach(function (parsedClass) {
    var index = findAggregatedParsedClassIndex(
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
  for (var i = 0; i < aggregatedParsedClasses.length; i++) {
    if (aggregatedParsedClasses[i].name === parsedClassName) {
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
  var classNames = getClassNamesFromRule(rule)
  var properties = getPropertiesFromRule(rule)
  var mediaQuery = getMediaQueryFromRule(rule)

  var parsedClasses = classNames.map(function (className) {
    return {
      name: className,
      properties: properties.map(function (property) {
        return {
          property: property,
          mediaQuery: mediaQuery
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
  var properties = []

  rule.walkDecls(function (declaration) {
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
  var classNames = []

  selectorParser(function (selectors) {
    selectors.walkClasses(function (classNode) {
      classNames.push(classNode.value)
    })
  }).processSync(rule)

  return classNames
}
// ------------------ //HELPERS ------------------------
