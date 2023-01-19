import * as commander from 'commander'
import Cli from './cli'

const { program } = commander

program
  .command('init <dir>', 'create project in specify directory')
  .alias('i')
  .option('-t, --type', 'Choose a project type')
  .option(
    '-f, --force',
    'Overide content when specified directory is not empty'
  )
  .action(function (dir: string, option: any) {
    return new Cli().create(dir, option)
  })

console.log(process.argv)
program.parse(process.argv)
