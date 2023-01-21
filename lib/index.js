const { Command } = require('commander')
const { similar } = require('./helps')
const Helo = require('./Helo')
const pkg = require('../package.json')
const { red, yellow } = require('./logs')

const program = new Command()

program
  .name('helo')
  .description('CLI to automatically create app with specified template')
  .version(pkg.version)

program
  .command('init')
  .argument('<dir>')
  .usage('demo --type rollup-lib-ts')
  .description('create project in specify directory')
  .option('-t, --type <template>', 'choose a project type')
  .option(
    '-f, --force',
    "overide the specified directory event if it is't empty"
  )
  .action((dir, option) => {
    new Helo().generate(dir, option)
  })

program.on('command:*', ([cmd]) => {
  program.outputHelp()
  const similarText = similar(cmd, program.commands)
  const sugestionText = similarText
    ? `Did you mean ${yellow(similarText)} ?`
    : ''
  console.log()
  red(`Unknown command ${yellow(cmd)},` + sugestionText, true)
  console.log()
  process.exit(0)
})

program.parse(process.argv)
