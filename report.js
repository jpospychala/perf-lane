const fs = require('fs')
const R = require('ramda')
const { execSync } = require('child_process')

module.exports = {
  report: createReports(readResultsDir, gnuplot),
  createReports,
}

function createReports(runsFn, plotFn) {
  return async function (options) {
    const runs = runsFn(options)
    const envs = uniq(r => r.env, runs)
    const names = uniq(r => r.name, runs)
    yaxes = ['tps', 'min', 'max', 'p95']
    xaxes = ['n']

    envs.forEach(env =>
      names.forEach(name =>
        xaxes.forEach(x => {
          const rows = runs.filter(R.whereEq({ env, name }))
          yaxes.forEach(y => {
            if (rows.length > 0) {
              plotFn(rows, name, x, y, env, options)
            }
          })
        })
      )
    )
  }
}

function readResultsDir({ dir }) {
  return fs.readdirSync(`${dir}perf-lane/runs`)
  .reduce((acc, run) => acc.concat(
      fs.readFileSync(`${dir}/perf-lane/runs/${run}`).toString().split('\n')
      .filter(l => !!l)
      .map(l => {
        try {
          return { ...JSON.parse(l), run }
        } catch (ex) {
          throw new Error(`${run}/${l}: ${ex}`);
        }
      })
    )
  , [])
}

function gnuplot(rows, name, x, y, suffix, { dir, output }) {
  const explain = (term) => ({
    'tps': 'transactions per second [n]',
    'p95': '95 perentile [ms]',
    'min': 'min [ms]',
    'max': 'max [ms]',
  }[term] || term)

  const p = pivot(rows, 'test', x, y)

  const style =  (p.length === 2 /* header + 1 row */) ? 'bars' : 'lines'

  const seriesCount = p[0].length

  const styles = {
    'bars': {
      title: `${name} ${explain(y)}`,
      series: () => [...new Array(seriesCount).keys()].map(i =>
        `'tmp.dat' using ${i+2} title columnhead(${i+1})`).join(','),
      gpstyles: `set style data histogram
set style histogram cluster gap 1
set style fill solid border -1
set xtics format ""
`
    },
    'lines': {
      title: `${explain(y)} of ${name} to ${explain(x)}`,
      series: () => [...new Array(seriesCount).keys()].map(i => {
        const linestyle = p[0].length < 8 ? 'lines' : 'linespoints'
        return `'tmp.dat' using 1:${i+2} with ${linestyle} title columnhead(${i+1})`
        }).join(','),
      gpstyles: `
set xlabel "${explain(x)}"`
    }
  }

  const { title, gpstyles, series } = styles[style]

  try { fs.mkdirSync('perf-lane', { recursive: true }); } catch (ex) {}
  const fileName = [name.replace(/[ \/]/g, '_'), y, x, suffix].join('_')+`.${output}`
  const filePath = `${dir}/perf-lane/${fileName}`
  fs.writeFileSync(`${dir}/tmp.dat`, table(p))
  fs.writeFileSync(`${dir}/plot.pg`, `
reset
set terminal ${output} size 800,400 background rgb 'white'
set output "${filePath}"

set title "${title}"
set lmargin 9
set rmargin 30
set key outside
${gpstyles}
set ylabel "${explain(y)}"
plot ${series()}
`)
  execSync(`gnuplot ${dir}/plot.pg`)
  fs.unlinkSync(`${dir}/tmp.dat`)
  fs.unlinkSync(`${dir}/plot.pg`)
}

function pivot(input, colsCol, rowsCol, valCol) {
  const table = {}
  const colNames = []
  input.forEach(row => {
    const colName = row[colsCol]
    const rowName = row[rowsCol]
    const val = row[valCol]

    table[rowName] = table[rowName] || {}
    if (! colNames.includes(colName)) {
      colNames.push(colName)
    }
    table[rowName][colName] = val
  })
  const rowNames = Object.keys(table)
  const rows = rowNames.map(rowName => [rowName, ...colNames.map(col => table[rowName].hasOwnProperty(col) ? table[rowName][col] : '-')])
  return [colNames.map(c => `"${c}"`), ...rows]
}

function table(input) {
  return input.map(row => row.join(' ')).join('\n')
}

function uniq(fn, list) {
  return list.reduce((acc, elem) => acc.includes(fn(elem)) ? acc : acc.concat(fn(elem)), [])
}
