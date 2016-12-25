import Metalsmith from 'metalsmith'
import assert from 'assert'
import move from '../lib'
import lint from 'mocha-eslint'

lint(['lib/index.js'])

describe('metalsmith-move', () => {
  it('should be able to interpolate tokens', (done) => {
    Metalsmith('test/fixtures')
    .use(move({
      'one.html': '{YYYY}/{-title}{ext}',
      'sub': '{relative}/{base}'
    }))
    .build((err, files) => {
      if (err) return done(err)
      assert.ok(files['2016/page-one-title.html'])
      assert.ok(files['dir/deep.html'])
      done()
    })
  })
  it('should be able to flatten directory structure', (done) => {
    Metalsmith('test/fixtures')
    .use(move({
      '**/*': '{base}'
    }))
    .build((err, files) => {
      if (err) return done(err)
      assert.ok(files['deep.html'])
      done()
    })
  })
  it('should ignore files as required', (done) => {
    Metalsmith('test/fixtures')
    .use(move(
      { 'one.html': false }
    ))
    .build((err, files) => {
      if (err) return done(err)
      assert.equal(files['one.html'], undefined)
      done()
    })
  })
})
