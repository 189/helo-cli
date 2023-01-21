const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert')

const { logWrapper } = require('./logs')

class Helo {
  constructor(options) {
    this.name = 'helo-cli'
    this.registry = 'https://registry.yarnpkg.com'
    this.cwd = process.cwd()
    this.options = options
    this.configPkg = {
      name: '@helo-boilerplate/config',
      registry: '',
    }
    this.errlog = logWrapper(this.name, true)
  }

  async generate(dir, options) {
    assert.ok(
      typeof dir === 'string' && dir.length > 0,
      '`dir` must be non-empty string'
    )
    const fullpath = path.resolve(this.cwd, dir)
    await this.makeDir(fullpath, options)
  }

  makeDir(fullpath, force) {
    console.log('dne')
  }

  getPkgRegistry() {
    return this.registry
  }
}

module.exports = Helo
