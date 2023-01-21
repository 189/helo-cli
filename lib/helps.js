const leven = require('./leven')

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

module.exports = {
  similar,
}
