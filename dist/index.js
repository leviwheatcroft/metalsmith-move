'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (operations, options) {
  // only options to deal with are date & slug functions
  let defaults = {
    date: getDate,
    slug: getSlug
  };
  options = (0, _lodash.extend)({}, defaults, options);

  return (files, metalsmith, done) => {
    // delete operations should be done last, so map & sort in an array
    let ops = (0, _lodash.map)(operations, (dest, src) => {
      return {
        src,
        dest,
        root: _path2.default.join(metalsmith._directory, metalsmith._source)
      };
    });
    ops = (0, _lodash.sortBy)(ops, op => op.dest === false);

    (0, _lodash.each)(ops, op => {
      let srcPaths = filterFiles(files, op);
      // if this operation is just ignoring files, we can do that & return here
      if (op.dest === false) {
        (0, _lodash.each)(srcPaths, srcPath => (0, _lodash.unset)(files, srcPath));
        return;
      }

      // otherwise we do the interpolation
      (0, _lodash.each)(srcPaths, srcPath => {
        let destPath;
        destPath = op.dest.replace(/\{([^\}]+)\}/g, (match, token) => {
          // all the `path` things
          let parsed = _path2.default.parse(srcPath);
          if (parsed.hasOwnProperty(token)) {
            return parsed[token];
          }
          if (token === 'relative') {
            return _path2.default.relative(op.src, parsed.dir);
          }
          // check if the token is something from meta
          if (files[srcPath].hasOwnProperty(token)) {
            return options.slug(files[srcPath][token]);
          }
          // moment formats
          if (!/[^MDY\-_\.\/]/.exec(token)) {
            let date = (0, _moment2.default)(options.date(files[srcPath]));
            if (!date.isValid()) throw new Error('bad date - see readme');
            return date.format(token);
          }
        });

        // create new file in files
        files[destPath] = files[srcPath];
        // ditch the old one
        delete files[srcPath];
        // debug operation
        dbg(srcPath + ' > ' + destPath);
      });
    });
    done();
  };
};

var _lodash = require('lodash');

var _multimatch = require('multimatch');

var _multimatch2 = _interopRequireDefault(_multimatch);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _slug = require('slug');

var _slug2 = _interopRequireDefault(_slug);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let dbg = (0, _debug2.default)('index');

/**
 * getPlugin
 *
 * this fn is exported as the module, designed to be called by `metalsmith#use`
 *
 * ```
 * .use(move(
 *   {
 *     'blog': ':YYYY/:MMMM/:title'
 *   },
 *   {
 *     date: (meta) => '2016-10-26',
 *     slug: (str)  => str.replace(/\s/g, '_')
 *   }
 *  ))
 * ```
 *
 * @param {Object} operations src dest key value
 * @param {Object} options
 * @param {Function} options.date - date parsing fn
 * @param {Function} options.slug - slug parsing fn
 */


/**
 * getDate
 *
 * @param {Object} meta file meta from metalsmith
 */
let getDate = meta => {
  return meta.date | meta.stats.ctime;
};

/**
 * getSlug
 *
 * @param {String} str string from which to generate slug
 */
let getSlug = str => {
  return (0, _slug2.default)(str);
};

/**
 * filterFiles
 *
 * @param {Object} files - as passed into plugins from metalsmith
 * @param {Object} op - a single operation for move
 */
let filterFiles = (files, op) => {
  let isDir = false;

  // using a try / catch here avoids making the whole deal async
  try {
    isDir = _fs2.default.statSync(_path2.default.join(op.root, op.src)).isDirectory();
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
  // add a `**/*` mask if the src specifies a directory
  let src = isDir ? op.src + _path2.default.sep + '**' + _path2.default.sep + '*' : op.src;

  return (0, _multimatch2.default)((0, _lodash.keys)(files), src);
};