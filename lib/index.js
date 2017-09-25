import {
  each,
  unset,
  keys
} from 'lodash'
import {
  interpolate
} from 'metalsmith-interpolate'
import multimatch from 'multimatch'
import fs from 'fs'
import path from 'path'
import debug from 'debug'

let dbg = debug('metalsmith-move')

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
export default function move (operations) {
  return (files, metalsmith, done) => {
    let ops = Object.keys(operations).map((src) => {
      return {
        src,
        dest: operations[src],
        root: path.join(metalsmith._directory, metalsmith._source)
      }
    })
    // delete operations should be done last, so map & sort in an array
    ops.sort((a, b) => b.dest === false ? -1 : 1)

    each(ops, (op) => {
      let srcPaths = filterFiles(files, op)
      // if this operation is just ignoring files, we can do that & return here
      if (op.dest === false) {
        each(srcPaths, (srcPath) => unset(files, srcPath))
        return
      }
      each(srcPaths, (srcPath) => {
        let destPath
        let relative
        relative = path.parse(path.relative(op.src, srcPath)).dir
        destPath = interpolate(op.dest, srcPath, files, {relative})
        destPath = path.normalize('./' + destPath)
        files[destPath] = files[srcPath]
        // setting `path` param is a common convention, useful for collections,
        // tags, et cetera. If that param has been set, and it matches the
        // previous path, update it to the new path.
        if (files[destPath].path === srcPath) {
          files[destPath].path = destPath
        }
        delete files[srcPath]
        dbg(srcPath + ' > ' + destPath)
      })
    })
    done()
  }
}

/**
 * filterFiles
 *
 * @param {Object} files - as passed into plugins from metalsmith
 * @param {Object} op - a single operation for move
 */
let filterFiles = (files, op) => {
  let isDir = false

  // using a try / catch here avoids making the whole deal async
  try {
    isDir = fs.statSync(path.join(op.root, op.src)).isDirectory()
  } catch (err) {
    if (err.code !== 'ENOENT') throw err
  }
  // add a `**/*` mask if the src specifies a directory
  let src = isDir ? op.src + path.sep + '**' + path.sep + '*' : op.src

  return multimatch(keys(files), src)
}
