'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = move;

var _lodash = require('lodash');

var _metalsmithInterpolate = require('metalsmith-interpolate');

var _multimatch = require('multimatch');

var _multimatch2 = _interopRequireDefault(_multimatch);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let dbg = (0, _debug2.default)('metalsmith-move');

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
function move(operations) {
  return (files, metalsmith, done) => {
    let ops = Object.keys(operations).map(src => {
      return {
        src: src,
        dest: operations[src],
        root: _path2.default.join(metalsmith._directory, metalsmith._source)
      };
    });
    // delete operations should be done last, so map & sort in an array
    ops.sort((a, b) => b.dest === false ? -1 : 1);

    (0, _lodash.each)(ops, op => {
      let srcPaths = filterFiles(files, op);
      // if this operation is just ignoring files, we can do that & return here
      if (op.dest === false) {
        (0, _lodash.each)(srcPaths, srcPath => (0, _lodash.unset)(files, srcPath));
        return;
      }
      (0, _lodash.each)(srcPaths, srcPath => {
        let destPath;
        let relative;
        relative = _path2.default.parse(_path2.default.relative(op.src, srcPath)).dir;
        destPath = (0, _metalsmithInterpolate.interpolate)(op.dest, srcPath, files, { relative: relative });
        destPath = _path2.default.normalize('./' + destPath);
        files[destPath] = files[srcPath];
        // setting `path` param is a common convention, useful for collections,
        // tags, et cetera. If that param has been set, and it matches the
        // previous path, update it to the new path.
        if (files[destPath].path === srcPath) {
          files[destPath].path = destPath;
        }
        delete files[srcPath];
        dbg(srcPath + ' > ' + destPath);
      });
    });
    done();
  };
}

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