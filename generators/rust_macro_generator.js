let os = require('os')

const defaults = {
  output_filepath: 'src/css_classes.rs',
}

module.exports = {
  generate,
  defaults
}

/*
 * Example classes:
  [
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
  ]
*/

// - create rust macro called TC
// - see EXAMPLE CODE:
//     `/tests/rust_macro_generator_test/rust_macro_generator.basic.expected_output`
function generate (classes) {
  return (
      'macro_rules! C {' +
      generateRepeatedEntry() +
      classes.map(generateMacroEntry).join('') +
      '}'
  )
}

function generateRepeatedEntry() {
return `
    ($class0:tt, $($class:tt),+) => {
        [$class0, $(C!($class),)*]
    };
`
}

function generateMacroEntry (class_) {
    return (
        '    ("' + class_.name + '") => {' +
        os.EOL +
        '        "' + class_.name + '"' +
        os.EOL + 
        '    };' +
        os.EOL
    )
}
