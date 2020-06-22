const test = require('../perf-lane')
const assert = require('assert')
const { createReports } = require('../report')

test.options.maxRuns = 1

test('createReports', (p) => {
  const plots = []
  const plotFn = (rows, name, x, y, env) => plots.push({
    name, x, y, env
  })
  const runs = [
    { i: 0, env: 'a', name: 'n1', test: 't1', n: 1, run: '1', tps: 1 },
    { i: 1, env: 'a', name: 'n1', test: 't2', n: 2, run: '1', tps: 2 },
  ]
  createReports(() => runs, plotFn, () => {})()

  assert.deepEqual(plots.filter(r => r.y === 'tps'),
    [
      {env: 'a', name: 'n1', x: 'n', y: 'tps'}
  ])
})
