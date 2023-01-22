import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert'
import { HttpClient } from 'urllib'
import mkdirp from 'mkdirp'
import inquirer from 'inquirer'

import { logWrapper } from './logs.js'

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
    this.httpClient = new HttpClient()
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
    // make directory
    await this.makeTargetDirectory(fullpath)
    // prompt boilerplate
    const boilerplate = await this.fetchBoilerplateMapping()
    // choose boilerplate
    await this.chooseBoilerplate(boilerplate)
  }

  async chooseBoilerplate(boilerplate) {
    const choices = boilerplate.map((b) => ({
      name: `${b.name} (${b.description})`,
      value: b,
    }))
    choices.unshift(new inquirer.Separator())
    const answer = await this.prompt({
      type: 'list',
      name: 'boilerplate',
      message: 'please pick up a boilerplate',
      choices: choices,
    })
    console.log(answer.boilerplate)
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

  async fetchBoilerplateMapping() {
    const pkgInfo = await this.getPackageInfo(this.configPkg.name)
    const { boilerplate } = pkgInfo
    return boilerplate
  }

  async getPackageInfo(pkgName) {
    this.log(`fetching npm info of ${pkgName}`)
    const url = `${this.registry}/${pkgName}/latest`
    const result = await this.request(url, {
      dataType: 'json',
      followRedirect: true,
      maxRedirects: 5,
      timeout: 5000,
    })
    assert(
      result.status === 200,
      `npm info ${pkgName} got error: ${result.status}, ${result.data.reason}`
    )
    return result.data
  }

  getPkgRegistry() {
    return this.registry
  }

  async request(url, options) {
    return this.httpClient.request(url, options)
  }
}

export default Helo
