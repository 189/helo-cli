import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert'
import os from 'node:os'
import compressing from 'compressing'
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

  get tempDir() {
    const name = this.name
    return path.resolve(this.cwd, 'temp')
    // return path.resolve(os.tempDir(), name)
  }

  async generate(dir) {
    assert.ok(
      typeof dir === 'string' && dir.length > 0,
      '`dir` must be non-empty string'
    )
    const fullpath = path.resolve(this.cwd, dir)

    // make directory
    await this.makeTargetDirectory(fullpath)
    // prompt boilerplates
    const boilerplates = await this.fetchBoilerplateMapping()

    // choose boilerplate
    const boilerplate = await this.pickBoilerplate(boilerplates)
    if (boilerplate.package) {
      const boilerplatePkg = boilerplate.package
      const templateDir = await this.downloadBoilerplate(boilerplatePkg)
      this.processFiles(templateDir, fullpath)
      return
    }
    this.errlog('bilerplate.package is not exist')
  }

  async processFiles(templateDir, savePath) {
    const { questions } = await import(templateDir)
  }

  async downloadBoilerplate(pkgname) {
    const { dist } = await this.getPackage(pkgname)
    assert.ok(typeof dist === 'object', `${pkgname} did't has dist`)
    const { tarball } = dist
    assert.ok(typeof tarball === 'string', `${pkgname} did't has dist.tarball`)
    this.log(`downloading ${tarball}`)
    const saveDir = this.tempDir
    await fsp.rm(saveDir, {
      force: true,
      recursive: true,
    })
    const response = await this.request(tarball, {
      streaming: true,
      followRedirect: true,
    })
    console.log(response.res, saveDir)
    await compressing.tgz.uncompress(response.res, saveDir)
    this.log(`extract to ${saveDir}`)
    return path.join(saveDir, '/package')
  }

  async pickBoilerplate(boilerplate) {
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
    return answer.boilerplate
  }

  async makeTargetDirectory(fullpath) {
    const dirname = path.basename(fullpath)
    // directory exist
    if (fs.existsSync(fullpath)) {
      // const stat = fs.statSync(fullpath)
      // ask for overide all direcotry
      // if (stat.isDirectory()) {
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
      } else {
        this.warnlog(
          `${dirname} is not empty, overide it automatically due to --force`
        )
      }
      // }
      fs.rmSync(fullpath, { force: true, recursive: true })
    }
    // direcotry not exist, just create it
    mkdirp(fullpath)
    return true
  }

  async fetchBoilerplateMapping() {
    const pkgInfo = await this.getPackage(this.configPkg.name)
    const { boilerplate } = pkgInfo
    return boilerplate
  }

  async getPackage(pkgName) {
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
