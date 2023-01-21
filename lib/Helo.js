const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert')
const mkdirp = require('mkdirp')
const rimraf = require('rimraf')
const inquirer = require('inquirer')

const { logWrapper } = require('./logs')

class Helo {
  constructor(options) {
    this.name = 'helo-cli'
    this.registry = 'https://registry.yarnpkg.com'
    this.cwd = process.cwd()
    this.options = options
    this.force = options.force
    this.update = options.update
    this.prompt = inquirer.createPromptModule()
    this.configPkg = {
      name: '@helo-boilerplate/config',
      registry: '',
    }
    this.errlog = logWrapper(this.name, 'red')
    this.log = logWrapper(this.name, 'blue')
    this.warnlog = logWrapper(this.name, 'yellow')
  }

  async generate(dir) {
    assert.ok(
      typeof dir === 'string' && dir.length > 0,
      '`dir` must be non-empty string'
    )
    const fullpath = path.resolve(this.cwd, dir)
    await this.makeTargetDirectory(fullpath)
  }

  async makeTargetDirectory(fullpath) {
    // directory exist
    if (fs.existsSync(fullpath)) {
      const stat = fs.statSync(fullpath)
      // ask for overide all direcotry
      if (stat.isDirectory()) {
        if (!this.force) {
          const anwser = await this.prompt({
            type: 'confirm',
            name: 'ok',
            message: `${fullpath} is exist, confirm overide?`,
          })
          if (!anwser.ok) {
            this.errlog('process.exist due to you answer is No')
            process.exit(0)
          }
        }
      }
      fs.rmSync(fullpath, { force: true, recursive: true })
    }
    // direcotry not exist, just create it
    mkdirp(fullpath)
    return true
  }

  getPkgRegistry() {
    return this.registry
  }
}

module.exports = Helo
