'use strict'
const _           = require('lodash')
const multimatch  = require('multimatch')
const fs          = require('fs')
const path        = require('path')
const moment      = require('moment')
const slug        = require('slug')
const debug       = require('debug')('move')

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
let getPlugin = function(operations, options) {

  // only options to deal with are date & slug functions
  let defaults = {
    date: getDate,
    slug: getSlug
  }
  options = _.extend({}, defaults, options)

  return (files, metalsmith, done) => {
    // delete operations should be done last, so map & sort in an array
    let ops = _.map(operations, (dest, src) => {
      return {
        src,
        dest,
        root: path.join(metalsmith._directory, metalsmith._source)
      }
    })
    ops = _.sortBy(ops, (op) => (op.dest === false))

    _.each(ops, (op) => {
      let srcPaths = filterFiles(files, op)

      // if this operation is just ignoring files, we can do that & return here
      if (op.dest === false) {
        _.each(srcPaths, (srcPath) => _.unset(files, srcPath))
        return
      }

      // otherwise we do the interpolation
      _.each(srcPaths, (srcPath) => {
        let destPath
        destPath = op.dest.replace(/\:([a-z0-9]+)/gi, (match, token) => {
          // all the `path` things
          if (token === 'filename') {
            return path.basename(srcPath)
          }
          if (token === 'extname') {
            return path.extname(srcPath)
          }
          if (token === 'basename') {
            return path.basename(srcPath, path.extname(srcPath))
          }
          if (token === 'dirname') {
            return path.dirname(srcPath)
          }
          if (token === 'relative') {
            return path.relative(op.src, path.dirname(srcPath))
          }
          // moment formats
          if (!/[^MDY]/.exec(token)) {
            let date = moment(options.date(files[srcPath]))
            if (!date.isValid()) throw new Error('bad date - see readme')
            return date.format(token)
          }
          // check if the token is something from meta
          if (files[srcPath].hasOwnProperty(token)) {
            return options.slug(files[srcPath][token])
          }
        })

        // create new file in files
        files[destPath] = files[srcPath]
        // ditch the old one
        delete files[srcPath]
        // debug operation
        debug(srcPath + ' > ' + destPath)
      })
    })
    done()
  }
}

/**
 * getDate
 *
 * @param {Object} meta file meta from metalsmith
 */
let getDate = (meta) => {
  return (meta.date | meta.stats.ctime)
}

/**
 * getSlug
 *
 * @param {String} str string from which to generate slug
 */
let getSlug = (str) => {
  return slug(str)
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

  return multimatch(_.keys(files), src)
}

// export
module.exports = getPlugin
