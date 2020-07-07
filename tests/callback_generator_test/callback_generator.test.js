let fs = require('fs')
let path = require('path')
let postcss = require('postcss')
let eol = require('eol')
let os = require('os')

let plugin = require('../..')

let GENERATOR_NAME = 'callback'

function callbackGenerator (classes) {
  return 'Number of classes: ' + classes.length + os.EOL
}

it('generate ' + GENERATOR_NAME.toUpperCase(), async () => {
  // GIVEN
  let opts = {
    output_filepath: path.resolve(
      __dirname, GENERATOR_NAME + '_generator.basic.generated_output'
    ),
    generator: callbackGenerator,
    filter: () => { return true }
  }

  let inputCss = fs.readFileSync(
    path.resolve(__dirname, '../input_data/basic_input_data.css'), 'utf8'
  )

  // WHEN
  let result1 = await postcss([plugin(opts)])
    .process(inputCss, { from: undefined })
  // WHAT
  let generatedCode = fs.readFileSync(
    path.resolve(
      __dirname, GENERATOR_NAME + '_generator.basic.generated_output'
    ), 'utf8'
  )
  let expectedCode = fs.readFileSync(
    path.resolve(
      __dirname, GENERATOR_NAME + '_generator.basic.expected_output'
    ), 'utf8'
  )
  expect(eol.auto(generatedCode)).toEqual(eol.auto(expectedCode))
  expect(result1.css).toEqual(inputCss)
  expect(result1.warnings()).toHaveLength(0)
})
