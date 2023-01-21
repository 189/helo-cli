const chalk = require('chalk')

;['red', 'yellow'].forEach((m) => {
  exports[m] = (msg, verbose = false) => {
    msg = chalk[m](msg)
    verbose && console.log(msg)
    return msg
  }
})
