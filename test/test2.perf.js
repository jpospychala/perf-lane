const test = require('../perf-lane')
const assert = require('assert')

test.options.maxRuns = 1

test('sync', (p) => {
  assert.equal(1, 1, '1 equals 2')
})

test('with promise', (p) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log('test 2')
      resolve()
    }, 500)
  })
)

test.async('async with end callback', (p) => {
  setTimeout(() => {
    console.log('test 3')
    p.end()
  }, 500)
})
