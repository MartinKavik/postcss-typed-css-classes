# PostCSS Typed Css Classes [![npm version](https://badge.fury.io/js/postcss-typed-css-classes.svg)](https://badge.fury.io/js/postcss-typed-css-classes)

[PostCSS] plugin that **generates** typed entities from CSS classes for chosen programming language.
You can also use it to **filter** CSS classes to reduce output size for faster application launch.

[postcss]: https://github.com/postcss/postcss
[ci-img]: https://travis-ci.org/MartinKavik/postcss-typed-css-classes.svg
[ci]: https://travis-ci.org/MartinKavik/postcss-typed-css-classes

## Why

I like [atomic css](https://css-tricks.com/lets-define-exactly-atomic-css/) libraries like TailwindCSS or Tachyons. I also like statically typed languages like Rust or Elm where compiler is your best friend and teacher.

So this plugin is trying to solve these **problems**:

1. How to force a compiler to check if used CSS class is valid (resp. given class exists in included stylesheet)?
1. I don't remember all classes - autocomplete with a class description would be nice.
1. How to reduce size of stylesheet?

**Solutions**:

1. Generate a file with source code in chosen language that mirrors your stylesheet and use it instead of plain `string` class names.
1. Your IDE should autocomplete classes from generated file. You can use CSS attributes as a class description.
1. Filter out classes from stylesheet that you didn't use. (Just search your source files for used classes.)

## Used In Projects:

_Do you use it? Create PR!_

- Webpack template for Rust web-apps with TailwindCSS and Typescript
  - https://github.com/MartinKavik/seed-quickstart-webpack

## Install

```sh
yarn add postcss-typed-css-classes --dev
```

## Basic Usage

```js
postcss([
  require("postcss-typed-css-classes")({
    output_filepath: path.resolve(__dirname, "css_classes.rs"),
    generator: "rust",
    filter: function() {
      return true;
    }
  })
]);
```

See [Seed Quickstart Webpack](https://github.com/MartinKavik/seed-quickstart-webpack) for using with Webpack and TailwindCSS.

See [PostCSS] docs for examples for your environment.

## Options

- ### output_filepath

  - a file path with filename and extension
  - generated code will be saved into this location
  - required
  - examples:
    - `path.resolve(__dirname, 'css_classes.rust')`

- ### generator

  - can be:
    - **a)** name of a built-in generator
      - only valid values are `"rust"` and `"json"` at the time of writing
        - see [rust_generator.js](/generators/rust_generator.js) and [json_generator.js](/generators/json_generator.js)
    - **b)** function with one parameter `classes`
      - it should return `string`
      - generated file will not be created when function doesn't return `string`
  - required
  - examples:
    - `"rust"`
    - `function() {}`
    - `` (classes) => `Classes: ${classes.length}` ``
  - `classes` example:

  ```json
  [
    {
      "name": "container",
      "properties": [
        {
          "property": "max-width: 576px",
          "mediaQuery": "@media (min-width: 576px)"
        }
      ]
    }
  ]
  ```

- ### filter
  - a function with one parameter `class_` that will be called when a CSS class is found in your stylesheet
  - required
  - examples:
    - `function() { return true }`
    - `(class_) => class_ !== "not-this-class"`

## Contributing - How To Add A New Built-In Generator

> NOTE:
> Plugin is based on official [postcss-plugin-boilerplate](https://github.com/postcss/postcss-plugin-boilerplate).
> So it uses old JS and very strict linter, but I think that code is clean enough and commented => it shouldn't be problem for a small project like this and we don't have to solve problems with building pipelines.

1. Fork this repo
1. Run `yarn` in project root
1. Choose a name for a generator - we'll use `csharp` for this guide
1. Duplicate file `/generators/json_generator.js` and rename it to `csharp_generator.js`
1. Open `csharp_generator.js` and change:

<!-- prettier-ignore -->
```js
// - pretty-print JSON with 4 spaces indentation
// - with a new line at the end of a file
// - see EXAMPLE CODE:
//     `/tests/json_generator_test/json_generator.basic.expected_output`
function generate (classes) {
  return JSON.stringify(classes, undefined, 4) + os.EOL
}
```

to

<!-- prettier-ignore -->
```js
// - generate C# class
// - see EXAMPLE CODE:
//     `/tests/csharp_generator_test/csharp_generator.basic.expected_output`
function generate (classes) {
  return "..I'm a c# class with " + classes.length + ' fields..' + os.EOL
}
```

7. Open `/index.js`
1. Insert line

<!-- prettier-ignore -->
```js
var csharpGeneratorModule = require('./generators/csharp_generator')
```

below the line

<!-- prettier-ignore -->
```js
var jsonGeneratorModule = require('./generators/json_generator')
```

9. Insert case

<!-- prettier-ignore -->
```js
case 'csharp':
    return csharpGeneratorModule.generate
```

into function `getDefaultGenerator`

10. Duplicate folder `/tests/json_generator_test` and rename it to `csharp_generator_test`
1. Rename `/tests/csharp_generator_test/json_generator.basic.expected_output` to `csharp_generator.basic.expected_output`
1. Change content of `csharp_generator.basic.expected_output` to
   <!-- prettier-ignore -->

```
..I'm a c# class with 6 fields..

```

(new line at the end is necessary)

13. Rename `/tests/csharp_generator_test/json_generator.test.js` to `csharp_generator.test.js`
1. Open `csharp_generator.test.js` and change `GENERATOR_NAME` from `json` to `csharp`
1. Run `yarn test` in the project root
1. Update [README.md](/README.md) if necessary
1. Update [CHANGELOG.md](CHANGELOG.md)
1. Create pull request to this repo (squash commits and rebase if necessary)
