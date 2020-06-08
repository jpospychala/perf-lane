const test = require('../perf-lane')
const assert = require('assert')

test.options.maxRuns = 1

const order = []

test.before((p) => {
  order.push('before')
})

test.after((p) => {
  assert.deepEqual(order, [
    'before',
    'beforeEach',
    'test 1',
    'afterEach',
    'beforeEach',
    'test 2',
    'afterEach',
  ])
})

test.beforeEach((p) => {
  order.push('beforeEach')
})

test.afterEach((p) => {
  order.push('afterEach')
})

test('test one', (p) => {
  order.push('test 1')
})

test('test two', (p) => {
  order.push('test 2')
})