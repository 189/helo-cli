import * as commander from 'commander'
import * as actions from './actions'

import PKG from '../package.json'

const { program } = commander
program.version(PKG.version)

program
  .command('list')
  .alias('ls')
  .description('List all the registries')
  .action(actions.onList)

program.parse(process.argv)

if (process.argv.length === 2) {
  program.outputHelp()
}
