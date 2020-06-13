'use strict'

const { basename } = require('path')
const loggers = require('./loggers')
const report = require('./report')

const defaults = {
  transactionsPerTest: 1,
  minSecs: 15,
  maxSecs: 60,
  minRuns: 30,
  maxRuns: Infinity,
  logger: loggers.fileLog,
  report,
  format: 'svg',
  outFile: `results/runs/${Date.now()}.ndjson`,
  envName: process.env.TEST_ENV || process.env.HOSTNAME || 'unknown'
}

let state

async function run(path) {
  test.options = { ...defaults }
  state  = {
    beforeEach: () => {},
    afterEach: () => {},
    before: () => {},
    after: () => {},
    n: [[1]],
    tests: [],
  }

  require(path)

  await state.before()
  for (let [testName, fn, type] of state.tests) {
    for (let n of state.n) {
      const testState = {
        name: basename(path).split('.')[0],
        test: testName,
        n: n[0],
        expected: n[1],
      }
      await runTest(state, testState, fn, type)
    }
  }
  await state.after()
}

async function runTest(state, testState, testFn, type) {
  const runs = []
  let i = 0
  let total = 0

  while (
      ((total < test.options.minSecs*1000) || (i < test.options.minRuns))
      && ((total < test.options.maxSecs*1000) & (i < test.options.maxRuns))
  ) {
    i++
    await state.beforeEach(testState)
    const time = await runAndMeasure(testFn, testState, type)
    await state.afterEach(testState)
    runs.push(time)
    total += time
  }

  runs.sort((a,b) => a - b)
  const fractionDigits = test.options.transactionsPerTest === 1 ? 0 : 4
  const result = {
    name: testState.name,
    test: testState.test,
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

async function __report() {
  await report('./', test.options.format)
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
test.run = run
test.__report = __report

module.exports = test
