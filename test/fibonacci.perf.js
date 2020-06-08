const test = require('../perf-lane')
const assert = require('assert')

test.options.logger = test.loggers.consoleLog

test.for_n([
  [1, 1],
  [10, 55],
  [30, 832040],
  [40, 102334155]
])

test('fibonacci_1', (p) => {
  function fibonacci_1(n) {
    return n < 1  ? 0
         : n <= 2 ? 1
         : fibonacci_1(n - 1) + fibonacci_1(n - 2)
  }

  let actual = fibonacci_1(p.n)
  assert.equal(actual, p.expected, `fibonacci(${p.n})`)
})

test('fibonacci_2', (p) => {
  const cache = [0, 1, 1]
  function fibonacci_2(n) {
    cache[n] = cache[n] || fibonacci_2(n - 1) + fibonacci_2(n - 2)
    return cache[n]
  }

  let actual = fibonacci_2(p.n)
  assert.equal(actual, p.expected, `fibonacci(${p.n})`)
})
