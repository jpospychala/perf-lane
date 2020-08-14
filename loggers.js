const fs = require('fs')

function fileLog(result, options) {
  if (result.event === 'test.progress') {
    process.stdout.write(`\r'${result.name} ${result.test}' for n=${result.n}: ${result.runs}/${options.minRuns}-${options.maxRuns} runs, ${(result.total/1000).toFixed(2)}/${options.minSecs}-${options.maxSecs} secs`)
  }
  if (result.event === 'test.complete') {
    process.stdout.write(`\r'${result.name} ${result.test}' for n=${result.n} takes ${result.min}-${result.max}ms p(95)=${result.min}ms tps=${result.tps} (${result.runs} runs)\n`)
    try { fs.mkdirSync(path.dirname(options.outFile), { recursive: true }); } catch (ex) {}
    fs.appendFileSync(options.outFile, JSON.stringify(result)+'\n')
  }
}

module.exports = {
  fileLog
}
