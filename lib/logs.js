import chalk from 'chalk'

const logger = {}
const logTypes = ['red', 'yellow', 'blue']

logTypes.forEach((m) => {
  logger[m + 'Text'] = (msg, verbose = false) => {
    msg = chalk[m](msg)
    verbose && console.log(msg)
    return msg
  }
})

export const loggers = logger
export const logWrapper = function (name, type = 'yellow') {
  if (!logTypes.includes(type)) {
    console.warn('no log type: ' + type)
    return () => {}
  }
  return function log() {
    const args = Array.prototype.slice.call(arguments)
    args[0] = chalk[type](`[${name}] `) + args[0]
    console.log.apply(console, args)
  }
}
