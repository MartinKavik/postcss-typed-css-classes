let fs = require('fs')
let path = require('path')
let postcss = require('postcss')
let eol = require('eol')

let plugin = require('../..')

let GENERATOR_NAME = 'rust'

it('generate ' + GENERATOR_NAME.toUpperCase(), async () => {
  // GIVEN
  let opts = {
    output_filepath: path.resolve(
      __dirname, GENERATOR_NAME + '_generator.basic.generated_output'
    ),
    generator: GENERATOR_NAME,
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

it('generate empty ' + GENERATOR_NAME.toUpperCase(), async () => {
  // GIVEN
  let opts = {
    output_filepath: path.resolve(
      __dirname, GENERATOR_NAME + '_generator.empty.generated_output'
    ),
    generator: GENERATOR_NAME,
    filter: () => { return true }
  }

  let inputCss = fs.readFileSync(
    path.resolve(__dirname, '../input_data/empty_input_data.css'), 'utf8'
  )

  // WHEN
  let result1 = await postcss([plugin(opts)])
    .process(inputCss, { from: undefined })
  // WHAT
  let generatedCode = fs.readFileSync(
    path.resolve(
      __dirname, GENERATOR_NAME + '_generator.empty.generated_output'
    ), 'utf8'
  )
  let expectedCode = fs.readFileSync(
    path.resolve(
      __dirname, GENERATOR_NAME + '_generator.empty.expected_output'
    ), 'utf8'
  )
  expect(eol.auto(generatedCode)).toEqual(eol.auto(expectedCode))
  expect(result1.css).toEqual(inputCss)
  expect(result1.warnings()).toHaveLength(0)
})

it('generate number ' + GENERATOR_NAME.toUpperCase(), async () => {
  // GIVEN
  let opts = {
    output_filepath: path.resolve(
      __dirname, GENERATOR_NAME + '_generator.number.generated_output'
    ),
    generator: GENERATOR_NAME,
    filter: () => { return true }
  }

  let inputCss = fs.readFileSync(
    path.resolve(__dirname, '../input_data/number_input_data.css'), 'utf8'
  )

  // WHEN
  let result1 = await postcss([plugin(opts)])
    .process(inputCss, { from: undefined })
  // WHAT
  let generatedCode = fs.readFileSync(
    path.resolve(
      __dirname, GENERATOR_NAME + '_generator.number.generated_output'
    ), 'utf8'
  )
  let expectedCode = fs.readFileSync(
    path.resolve(
      __dirname, GENERATOR_NAME + '_generator.number.expected_output'
    ), 'utf8'
  )
  expect(eol.auto(generatedCode)).toEqual(eol.auto(expectedCode))
  expect(result1.css).toEqual(inputCss)
  expect(result1.warnings()).toHaveLength(0)
})
