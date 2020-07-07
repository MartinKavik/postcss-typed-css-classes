let os = require('os')

module.exports = {
  generate
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

// - pretty-print JSON with 4 spaces indentation
// - with a new line at the end of a file
// - see EXAMPLE CODE:
//     `/tests/json_generator_test/json_generator.basic.expected_output`
function generate (classes) {
  return JSON.stringify(classes, undefined, 4) + os.EOL
}
