import leven from './leven.js'
import { createRequire } from 'module'

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

export { similar }
