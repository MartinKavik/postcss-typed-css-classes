var fs = require('fs')
var path = require('path')
var plugin = require('../..')
var postcss = require('postcss')
var eol = require('eol')

function filter (className) {
  switch (className) {
    case '-mx-6':
    case 'container':
    case 'w-3/5':
    case 'md:hover:bg-blue':
    case 'uk-child-width-1-1@xl':
      return false
    default:
      return true
  }
}

it('filter classes and don\'t emit output file', function () {
  // GIVEN
  var opts = {
    output_filepath: path.resolve(
      __dirname, 'dummy.basic.generated_output'
    ),
    generator: function () { },
    filter: filter
  }

  var inputCss = fs.readFileSync(
    path.resolve(__dirname, '../input_data/basic_input_data.css'), 'utf8'
  )

  // WHEN
  return postcss([plugin(opts)])
    .process(inputCss, { from: undefined }).then(function (result) {
      // WHAT
      var outputExists = fs.existsSync(
        path.resolve(
          __dirname, 'dummy.basic.generated_output'
        )
      )
      expect(outputExists).toEqual(false)

      var expectedCss = fs.readFileSync(
        path.resolve(
          __dirname, 'filter.basic.expected.css'
        ), 'utf8'
      )
      expect(eol.auto(result.css)).toEqual(eol.auto(expectedCss))
      expect(result.warnings()).toHaveLength(0)
    })
})
