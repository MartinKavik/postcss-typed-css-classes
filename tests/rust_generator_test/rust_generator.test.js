var fs = require('fs')
var path = require('path')
var plugin = require('../..')
var postcss = require('postcss')
var eol = require('eol')

var GENERATOR_NAME = 'rust'

it('generate ' + GENERATOR_NAME.toUpperCase(), function () {
  // GIVEN
  var opts = {
    output_filepath: path.resolve(
      __dirname, GENERATOR_NAME + '_generator.basic.generated_output'
    ),
    generator: GENERATOR_NAME,
    filter: function () { return true }
  }

  var inputCss = fs.readFileSync(
    path.resolve(__dirname, '../input_data/basic_input_data.css'), 'utf8'
  )

  // WHEN
  return postcss([plugin(opts)])
    .process(inputCss, { from: undefined }).then(function (result) {
      // WHAT
      var generatedCode = fs.readFileSync(
        path.resolve(
          __dirname, GENERATOR_NAME + '_generator.basic.generated_output'
        ), 'utf8'
      )
      var expectedCode = fs.readFileSync(
        path.resolve(
          __dirname, GENERATOR_NAME + '_generator.basic.expected_output'
        ), 'utf8'
      )
      expect(eol.auto(generatedCode)).toEqual(eol.auto(expectedCode))

      expect(result.css).toEqual(inputCss)
      expect(result.warnings()).toHaveLength(0)
    })
})
