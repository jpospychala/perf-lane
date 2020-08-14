'use strict'

const { basename } = require('path')
const loggers = require('./loggers')
const { report } = require('./report')

const defaults = {
  transactionsPerTest: 1,
  minSecs: 15,
  maxSecs: 60,
  minRuns: 30,
  maxRuns: 1000,
  logger: loggers.fileLog,
  report,
  format: 'svg',
  outFile: `perf-lane/runs/${new Date().toISOString()}.ndjson`,
  envName: process.env.TEST_ENV || process.env.HOSTNAME || 'unknown'
}

let state

async function run(path) {
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
      ((Math.max(total, i/10) < test.options.minSecs*1000) || (i < test.options.minRuns))
      && ((Math.max(total, i/10) < test.options.maxSecs*1000) && (i < test.options.maxRuns))
  ) {
    i++
    testState.i = i
    let time
    try {
      await state.beforeEach(testState)
      time = await runAndMeasure(testFn, testState, type)
      await state.afterEach(testState)
    } catch (ex) {
      console.log(ex)
      return
    } finally {
      runs.push(time)
      total += time
      test.options.logger({
        event: 'test.progress',
        name: testState.name,
        test: testState.test,
        n: testState.n,
        runs: i,
        total,
      }, test.options)
    }
  }

  runs.sort((a,b) => a - b)
  const result = {
    event: 'test.complete',
    name: testState.name,
    test: testState.test,
    n: testState.n,
    runs: i,
    env: test.options.envName,
    min: runs[0],
    max: runs[runs.length - 1],
    p95: runs[Math.floor(runs.length * 0.95)],
    tps: Math.round(test.options.transactionsPerTest * runs.length * 1000/total),
  }
  test.options.logger(result, test.options)
}

async function runAndMeasure(fn, testState, type) {
  if (type === 'async') {
    return await new Promise((resolve, reject) => {
      let runNow = Date.now()
      fn({ ...testState,
        start: (fn) => {
          runNow = Date.now()
          fn()
        },
        end: () => {
          const runAfter = Date.now()
          resolve(runAfter - runNow)
        }
      })
    })
  } else {
    let runNow = Date.now()
    const before = async (fn) => {
      const ret = await fn()
      runNow = Date.now()
      return ret
    }
    const ret = fn({ ...testState, before })
    let runAfter = Date.now()
    if (ret && ret.then) {
      await ret
      runAfter = Date.now()
    }
    return runAfter - runNow
  }
}

async function __report() {
  await report({
    dir: './',
    output: test.options.format
  })
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
test.options = { ...defaults }

module.exports = test
