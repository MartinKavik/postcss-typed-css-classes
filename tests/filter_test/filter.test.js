let fs = require('fs')
let path = require('path')
let postcss = require('postcss')
let eol = require('eol')

let plugin = require('../..')

function filter (className) {
  switch (className) {
    case '-mx-6':
    case 'container':
    case 'w-3/5':
    case 'md:hover:bg-blue':
    case 'uk-child-width-1-1@xl':
    case 'fa':
      return false
    case 'fas':
      return true
    default:
      return true
  }
}

it('filter classes and don\'t emit output file', async () => {
  // GIVEN
  let opts = {
    output_filepath: path.resolve(
      __dirname, 'dummy.basic.generated_output'
    ),
    generator: () => { },
    filter
  }

  let inputCss = fs.readFileSync(
    path.resolve(__dirname, '../input_data/basic_input_data.css'), 'utf8'
  )

  // WHEN
  let result1 = await postcss([plugin(opts)])
    .process(inputCss, { from: undefined })
  // WHAT
  let outputExists = fs.existsSync(
    path.resolve(
      __dirname, 'dummy.basic.generated_output'
    )
  )
  expect(outputExists).toEqual(false)
  let expectedCss = fs.readFileSync(
    path.resolve(
      __dirname, 'filter.basic.expected.css'
    ), 'utf8'
  )
  expect(eol.auto(result1.css)).toEqual(eol.auto(expectedCss))
  expect(result1.warnings()).toHaveLength(0)
})
