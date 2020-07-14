# Change Log

This project adheres to [Semantic Versioning](http://semver.org/).

[UNRELEASED]

[0.2.2]

- Remove comments from struct and dedup

[0.2.1]

- BugFix: Prevent Purge from removing valid selectors

[0.2.0]

- remove empty atRules when purging
- updated rust generator with the following:
  - set default for `output_filepath`
  - added `purge` option
  - added `content` option with the following options with defaults:
    - `path`
    - `regex`
    - `mapper`
    - `escape`

[0.1.8]

- Fix Bug: Valid classes excluded - [ref: Issue #9](https://github.com/MartinKavik/postcss-typed-css-classes/issues/9)

[0.1.7]

- update rust_generator escapeClassName to include `@`

[0.1.6]

- Updated dependencies
- Added scripts `lint` and `lint:fix`
- Adapted to new PostCSS linters

[0.1.5]

- Updated dependencies

[0.1.4]

- Updated dependencies
- Rust generator - remove lifetime if there are no classes
- Added RELEASE_CHECKLIST.md

[0.1.3]

- Updated dependencies, Node 6 not supported (breaking)

[0.1.2]

- Rust generator - generate `static` instead of `const`, `'static` removed
- Npm badge in README.md

[0.1.1]

- Fixed guide for adding generator in README.md
- Don't save generated code if there are no changes

[0.1.0]

- Initial version
