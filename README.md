# metalsmith-move

![nodei.co](https://nodei.co/npm/metalsmith-move.png?downloads=true&downloadRank=true&stars=true)

![npm](https://img.shields.io/npm/v/metalsmith-move.svg)

![github-issues](https://img.shields.io/github/issues/leviwheatcroft/metalsmith-move.svg)

![stars](https://img.shields.io/github/stars/leviwheatcroft/metalsmith-move.svg)

![forks](https://img.shields.io/github/forks/leviwheatcroft/metalsmith-move.svg)

[metalsmith](metalsmith.io) plugin to edit file paths


## install

`npm i --save metalsmith-move`

## usage

The plugin accepts a single argument in the form `{src: format, ...}` like so:

```javascript
metalsmith.use(move({
  'articles': '{-title}{ext}',
  'pages': '{relative}/{base}'
}))
```

this call would move paths like this:

```
articles/one.html           >   article-one-title.html
articles/two.html           >   article-two-title.html
pages/about/projects.html   >   about/projects.html
```

`src` can be any multimatch mask. `format` can be any
[metalsmith-interpolate](https://github.com/leviwheatcroft/metalsmith-interpolate) format string.

## tokens

__ standard tokens __
Anything from [metalsmith-interpolate](https://github.com/leviwheatcroft/metalsmith-interpolate) is available, check that package for
details but for quick reference:

 * path tokens like: root, dir, name, base, ext
 * meta tokens like: title, author, or anything else in your front matter
 * date tokens like: {YY/MM/DD} (any moment format)
 * put a `-` or `_` infront of the token to slugify like `{-title}`

__ relative path __
This package provides a `{relative}` token, as shown in the example above this
token provides the relative path from the specified src directory. This token
is only available where `src` specifies a directory as shown in the examples
above.

## options

There's not really any options :-/

## Author

Levi Wheatcroft <levi@wht.cr>

## Contributing

Contributions welcome; Please submit all pull requests against the master
branch.

## License

 - **MIT** : http://opensource.org/licenses/MIT
