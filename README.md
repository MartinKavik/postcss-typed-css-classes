# PostCSS Typed Css Classes [![Build Status][ci-img]][ci]

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

@TODO

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

## Contributing / Add A New Generator

@TODO
