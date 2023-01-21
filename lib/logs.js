const chalk = require('chalk')

;['red', 'yellow'].forEach((m) => {
  exports[m + 'Text'] = (msg, verbose = false) => {
    msg = chalk[m](msg)
    verbose && console.log(msg)
    return msg
  }
})

exports.logWrapper = function (name, error) {
  return function log() {
    const args = Array.prototype.slice.call(arguments)
    args[0] = chalk[error ? 'red' : 'blue'](`[${name}] `) + args[0]
    console.log.apply(console, args)
  }
}
