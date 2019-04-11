# PostCSS Typed Css Classes [![Build Status][ci-img]][ci]

[PostCSS] plugin that generates typed entities from CSS classes for chosen programming language.

[postcss]: https://github.com/postcss/postcss
[ci-img]: https://travis-ci.org/MartinKavik/postcss-typed-css-classes.svg
[ci]: https://travis-ci.org/MartinKavik/postcss-typed-css-classes

## Usage

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

See [PostCSS] docs for examples for your environment.

@TODO:

- better readme
