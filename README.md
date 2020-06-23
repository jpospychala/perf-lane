# perf-lane

Performance testing harness for Node.js

Main features:

- performance test as code, resembling unit tests
- compare performance for different input sizes

```js
const test = require('perf-lane')
const assert = require('assert')

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

```

```bash
$ perf-lane fibonacci.perf.js
'fibonacci fibonacci_1' for n=1 takes 0-1ms p(95)=0ms tps=6521739 (150000 runs)
'fibonacci fibonacci_1' for n=10 takes 0-1ms p(95)=0ms tps=852273 (150000 runs)
'fibonacci fibonacci_1' for n=30 takes 15-22ms p(95)=15ms tps=65 (978 runs)
'fibonacci fibonacci_1' for n=40 takes 1864-1951ms p(95)=1864ms tps=1 (30 runs)
'fibonacci fibonacci_2' for n=1 takes 0-1ms p(95)=0ms tps=3061224 (150000 runs)
'fibonacci fibonacci_2' for n=10 takes 0-1ms p(95)=0ms tps=688073 (150000 runs)
'fibonacci fibonacci_2' for n=30 takes 0-2ms p(95)=0ms tps=327511 (150000 runs)
'fibonacci fibonacci_2' for n=40 takes 0-1ms p(95)=0ms tps=274725 (150000 runs)
```

![prefetch max](perf-lane/fibonacci_tps_n_unknown.svg)

![prefetch max](perf-lane/fibonacci_min_n_unknown.svg)

![prefetch max](perf-lane/fibonacci_max_n_unknown.svg)

![prefetch max](perf-lane/fibonacci_p95_n_unknown.svg)