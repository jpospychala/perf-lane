const fs = require('fs')

function consoleLog(result) {
  console.log(`'${result.name}' for n=${result.n} takes ${result.min}-${result.max}ms p(95)=${result.min}ms tps=${result.tps} (${result.runs} runs)`)
}

function fileLog(result, options) {
  try { fs.mkdirSync(path.dirname(options.outFile), { recursive: true }); } catch (ex) {}
  fs.appendFileSync(options.outFile, JSON.stringify(result)+'\n')
}

module.exports = {
  consoleLog,
  fileLog
}
