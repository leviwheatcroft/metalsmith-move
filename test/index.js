let Metalsmith    = require('metalsmith')
let assert        = require('assert')
let move          = require('../lib')
require('mocha-jshint')({
  paths: [
    'lib/index.js'
  ]
})


describe('metalsmith-move', () => {
  it('should be able to interpolate tokens', (done) => {
    Metalsmith('test/fixtures')
    .use(move({
      'one.html': ':title:extname',
      'sub': ':relative/:filename'
    }))
    .build((err, files) => {
      if (err) return done(err)
      assert.ok(files['page-one-title.html'])
      assert.ok(files['dir/deep.html'])
      done()
    })
  })
  it('should be able to flatten directory structure', (done) => {
    Metalsmith('test/fixtures')
    .use(move({
      '**/*': ':filename'
    }))
    .build((err, files) => {
      if (err) return done(err)
      assert.ok(files['deep.html'])
      done()
    })
  })
  it('should allow patched date fn', (done) => {
    Metalsmith('test/fixtures')
    .use(move(
      { 'one.html': ':YYYY/:filename' },
      { date: () => '2020-10-15' }
    ))
    .build((err, files) => {
      if (err) return done(err)
      assert.ok(files['2020/one.html'])
      done()
    })
  })
})


