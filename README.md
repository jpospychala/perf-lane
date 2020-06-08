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
'fibonacci_1' for n=1 takes 0-1ms p(95)=0ms tps=6047821 (33426305 runs)
'fibonacci_1' for n=10 takes 0-1ms p(95)=0ms tps=662118 (7886492 runs)
'fibonacci_1' for n=30 takes 16-29ms p(95)=16ms tps=54 (813 runs)
'fibonacci_1' for n=40 takes 2139-2686ms p(95)=2139ms tps=0 (30 runs)
'fibonacci_2' for n=1 takes 0-42ms p(95)=0ms tps=4348218 (26845900 runs)
'fibonacci_2' for n=10 takes 0-3ms p(95)=0ms tps=607587 (7010943 runs)
'fibonacci_2' for n=30 takes 0-32ms p(95)=0ms tps=267876 (3516945 runs)
'fibonacci_2' for n=40 takes 0-22ms p(95)=0ms tps=231451 (3123432 runs)
```