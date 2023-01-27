import cp from 'node:child_process'
import { createRequire } from 'module'

import leven from './leven.js'

function similar(unknownCommand, commands) {
  const availableCommands = commands.map((cmd) => cmd._name)

  let suggestion

  availableCommands.forEach((cmd) => {
    const isBestMatch =
      leven(cmd, unknownCommand) < leven(suggestion || '', unknownCommand)
    if (leven(cmd, unknownCommand) < 3 && isBestMatch) {
      suggestion = cmd
    }
  })
  return suggestion
}

export const importCommonjs = (relative) => {
  return createRequire(import.meta.url)(relative)
}

export const exec = (command, option) => {
  return new Promise((resolve, rej) => {
    cp.exec(command, option, (err, data) => {
      if (err) {
        rej(err)
        return
      }
      resolve(data)
    })
  })
}

export { similar }
