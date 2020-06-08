'use strict'

const loggers = require('./loggers')

const defaults = {
  transactionsPerTest: 1,
  minSecs: 15,
  maxSecs: 60,
  minRuns: 30,
  maxRuns: Infinity,
  logger: loggers.fileLog,
  outFile: `results/runs/${Date.now()}.ndjson`,
  envName: process.env.TEST_ENV || process.env.HOSTNAME || 'unknown'
}

let state

// invoked on every new test file
function __test_start() {
  test.options = {...defaults}
  state  = {
    beforeEach: () => {},
    afterEach: () => {},
    before: () => {},
    after: () => {},
    n: [[1]],
    tests: [],
  }
}

async function __run_tests() {
  // TODO run tests and measure and report
  await state.before()
  for (let [name, fn, type] of state.tests) {
    for (let n of state.n) {
      const testState = {
        name,
        n: n[0],
        expected: n[1],
      }
      await runTest(testState, fn, type)
    }
  }
  await state.after()
}

async function runTest(testState, fn, type) {
  await state.beforeEach()

  const stats = await repeatUntil(
    testState,
    (i) => runAndMeasure(fn, testState, type))
  await state.afterEach()
}

async function repeatUntil(testState, asyncFn) {
  const runs = []
  const start = Date.now()
  let i = 0
  let total = 0

  while (
      ((Date.now() - start < test.options.minSecs*1000) || (i < test.options.minRuns))
      && ((Date.now() - start < test.options.maxSecs*1000) & (i < test.options.maxRuns))
  ) {
    const time = await asyncFn(i++)
    runs.push(time)
    total += time
  }

  runs.sort((a,b) => a - b)
  const fractionDigits = test.options.transactionsPerTest === 1 ? 0 : 4
  const result = {
    name: testState.name,
    n: testState.n,
    runs: i,
    env: test.options.envName,
    min: (runs[0] / test.options.transactionsPerTest).toFixed(fractionDigits),
    max: (runs[runs.length - 1] / test.options.transactionsPerTest).toFixed(fractionDigits),
    p95: (runs[Math.floor(runs.length * 0.95)] / test.options.transactionsPerTest).toFixed(fractionDigits),
    tps: Math.round(test.options.transactionsPerTest * runs.length*1000/total),
  }
  test.options.logger(result, test.options)
}

async function runAndMeasure(fn, testState, type) {
  if (type === 'async') {
    return await new Promise((resolve, reject) => {
      const runNow = Date.now()
      fn({ ...testState, end: () => {
        const runAfter = Date.now()
        resolve(runAfter - runNow)
      } })
    })
  } else {
    const runNow = Date.now()
    const ret = fn(testState)
    let runAfter = Date.now()
    if (ret && ret.then) {
      await ret
      runAfter = Date.now()
    }
    return runAfter - runNow
  }
}

function test(name, fn) {
  state.tests.push([name, fn])
}

function prop(propName) {
  return (fn) => state[propName] = fn
}

test.before = prop('before')
test.beforeEach = prop('beforeEach')
test.after = prop('after')
test.afterEach = prop('afterEach')
test.async = (name, fn) => {
  state.tests.push([name, fn, 'async'])
}
test.for_n = prop('n')
test.loggers = loggers
test.__test_start = __test_start
test.__run_tests = __run_tests

module.exports = test
