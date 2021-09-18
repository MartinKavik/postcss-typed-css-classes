/* eslint-disable max-len */
let fs = require('fs')
let path = require('path')
let postcss = require('postcss')
let eol = require('eol')

let plugin = require('../..')

let GENERATOR_NAME = 'rust'

beforeAll(() => {
  process.chdir('./tests/rust_generator_test')
  if (!fs.existsSync(path.resolve(__dirname, 'src'))) {
    // Do something
    fs.mkdir(path.join(__dirname, 'src'), err => {
      if (err) {
        return console.error(err)
      }
      return console.log('Directory created successfully!')
    })
  }
})

beforeEach(() => {
  if (fs.existsSync(path.resolve(__dirname, 'src', 'css_classes.rs'))) {
    fs.unlinkSync(path.resolve(__dirname, 'src', 'css_classes.rs'))
  }
})

afterAll(() => {
  if (fs.existsSync(path.resolve(__dirname, 'src', 'css_classes.rs'))) {
    fs.unlinkSync(path.resolve(__dirname, 'src', 'css_classes.rs'))
  }
})

it(`generates ${ GENERATOR_NAME.toUpperCase() } file using defaults`, async () => {
  // GIVEN
  let opts = {
    generator: GENERATOR_NAME
  }

  let inputCss = fs.readFileSync(
    path.resolve(__dirname, '../input_data/basic_input_data.css'),
    'utf8'
  )

  // WHEN
  let result1 = await postcss([plugin(opts)]).process(inputCss, {
    from: undefined
  })

  let generatedCode = fs.readFileSync(
    path.resolve(__dirname, 'src', 'css_classes.rs'),
    'utf8'
  )

  let expectedCode = fs.readFileSync(
    path.resolve(
      __dirname,
      GENERATOR_NAME + '_generator.basic.expected_output'
    ),
    'utf8'
  )

  expect(eol.auto(generatedCode)).toEqual(eol.auto(expectedCode))
  expect(result1.css).toEqual(inputCss)
  expect(result1.warnings()).toHaveLength(0)
})

it(`generates ${ GENERATOR_NAME.toUpperCase() } file with options`, async () => {
  // GIVEN
  let opts = {
    generator: GENERATOR_NAME,
    purge: false,
    content: [
      {
        path: ['src/**/*.rs'],
        regex: /C\.[\d_a-z]+/g,
        mapper: class_ => class_.substring(2),
        escape: false
      }
    ]
  }

  let inputCss = fs.readFileSync(
    path.resolve(__dirname, '../input_data/basic_input_data.css'),
    'utf8'
  )

  // WHEN
  let result1 = await postcss([plugin(opts)]).process(inputCss, {
    from: undefined
  })

  let generatedCode = fs.readFileSync(
    path.resolve(__dirname, 'src', 'css_classes.rs'),
    'utf8'
  )

  let expectedCode = fs.readFileSync(
    path.resolve(
      __dirname,
      GENERATOR_NAME + '_generator.basic.expected_output'
    ),
    'utf8'
  )

  expect(eol.auto(generatedCode)).toEqual(eol.auto(expectedCode))
  expect(result1.css).toEqual(inputCss)
  expect(result1.warnings()).toHaveLength(0)
})

it(`generates purged ${ GENERATOR_NAME.toUpperCase() } file with extended opt`, async () => {
  // GIVEN
  let opts = {
    generator: GENERATOR_NAME,
    purge: true,
    content: [
      {
        path: 'src/**/*.rs'
      },
      {
        path: ['src/index.hbs'],
        regex: /class\s*=\s*["'|][^"'|]+["'|]/g,
        mapper: className => {
          return className
            .match(/class\s*=\s*["'|]([^"'|]+)["'|]/)[1]
            .match(/\S+/g)
        },
        escape: true
      }
    ]
  }

  let inputCss = fs.readFileSync(
    path.resolve(__dirname, '../input_data/basic_input_data.css'),
    'utf8'
  )

  let expectedCss = fs.readFileSync(
    path.resolve(__dirname, '../expected_data/purge_expected_data_ext.css'),
    'utf8'
  )

  let result1 = await postcss([plugin(opts)]).process(inputCss, {
    from: undefined
  })

  expect(eol.auto(result1.css)).toEqual(eol.auto(expectedCss))
  expect(result1.warnings()).toHaveLength(0)
})

it(`generates ${ GENERATOR_NAME.toUpperCase() } file with string path`, async () => {
  // GIVEN
  let opts = {
    generator: GENERATOR_NAME,
    content: 'src/**/*.rs',
    purge: false
  }

  let inputCss = fs.readFileSync(
    path.resolve(__dirname, '../input_data/basic_input_data.css'),
    'utf8'
  )
  // WHEN
  let result1 = await postcss([plugin(opts)]).process(inputCss, {
    from: undefined
  })

  let generatedCode = fs.readFileSync(
    path.resolve(__dirname, 'src', 'css_classes.rs'),
    'utf8'
  )

  let expectedCode = fs.readFileSync(
    path.resolve(
      __dirname,
      GENERATOR_NAME + '_generator.basic.expected_output'
    ),
    'utf8'
  )

  expect(eol.auto(generatedCode)).toEqual(eol.auto(expectedCode))
  expect(result1.css).toEqual(inputCss)
  expect(result1.warnings()).toHaveLength(0)
})

it(`generates purged ${ GENERATOR_NAME.toUpperCase() } file`, async () => {
  // GIVEN
  let opts = {
    generator: GENERATOR_NAME,
    purge: true
  }

  let inputCss = fs.readFileSync(
    path.resolve(__dirname, '../input_data/basic_input_data.css'),
    'utf8'
  )

  let expectedCss = fs.readFileSync(
    path.resolve(__dirname, '../expected_data/purge_expected_data.css'),
    'utf8'
  )

  // WHEN
  let result1 = await postcss([plugin(opts)]).process(inputCss, {
    from: undefined
  })

  expect(eol.auto(result1.css)).toEqual(eol.auto(expectedCss))
  expect(result1.warnings()).toHaveLength(0)
})
