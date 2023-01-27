import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert'
import os from 'node:os'
import glob from 'fast-glob'
import compressing from 'compressing'
import { HttpClient } from 'urllib'
import updater from 'npm-updater'
import mkdirp from 'mkdirp'
import inquirer from 'inquirer'
import { isText } from 'istextorbinary'
import mustache from 'mustache'

import { logWrapper } from './logs.js'
import { exec, importCommonjs } from './helps.js'

class Helo {
  constructor(options) {
    this.name = 'helo-cli'
    this.registry = 'https://registry.yarnpkg.com'
    this.mirror = 'https://registry.npmmirror.com/'
    this.cwd = process.cwd()
    this.options = options
    this.force = options.force
    this.update = options.update
    this.prompt = inquirer.createPromptModule()
    this.configPkg = {
      name: '@helo-boilerplate/config',
      registry: '',
    }
    this.fileMapping = {
      '_.gitignore': '.gitignore',
      '_package.json': 'package.json',
      '_.eslintrc': '.eslintrc',
      '_.eslintignore': '.eslintignore',
      '_.npmignore': '.npmignore',
    }
    this.httpClient = new HttpClient()
    this.errlog = logWrapper(this.name, 'red')
    this.log = logWrapper(this.name, 'blue')
    this.warnlog = logWrapper(this.name, 'yellow')
  }

  get tempDirPath() {
    // return path.resolve(this.cwd, 'temp')
    return path.resolve(os.tmpdir(), this.name)
  }

  checkVersion() {
    const { update = true } = this.options
    if (update) {
      const pkg = importCommonjs('../package.json')
      return updater({
        package: pkg,
        registry: this.registry,
        level: 'minor',
      })
    }
  }

  async generate(dir) {
    assert.ok(
      typeof dir === 'string' && dir.length > 0,
      '`dir` must be non-empty string'
    )
    const fullpath = path.resolve(this.cwd, dir)
    this.destDirName = dir
    this.destDirPath = fullpath

    const type = this.options.type
    await this.checkVersion()

    // prompt boilerplates
    const boilerplates = await this.fetchBoilerplateMapping()

    if (!boilerplates) {
      this.errlog('build-in bilerplate is missing')
      return
    }
    let boilerplate = null
    if (type) {
      boilerplate = boilerplates.find(
        ({ name }) => name.trim().replace(/\s/g, '-') === type
      )
      if (!boilerplate) {
        this.warnlog(
          `You input --type='${type}' was not found, we suggest you pick the type from build-in templates`
        )
      }
    }

    // choose boilerplate
    boilerplate = boilerplate
      ? boilerplate
      : await this.pickBoilerplate(boilerplates)
    // make directory
    await this.makeTargetDirectory(fullpath)
    if (boilerplate.package) {
      const boilerplatePkg = boilerplate.package
      const boilerplatePkgPath = await this.downloadBoilerplate(boilerplatePkg)
      this.processFiles(boilerplatePkgPath, boilerplate.name)
      return
    }
    this.errlog('bilerplate.package is not exist')
  }

  matchBoilerplate(type, boilerplates) {
    return boilerplates
  }

  async processFiles(boilerplatePkgPath, boilerplateName) {
    const { prompts } = await import(boilerplatePkgPath + '/index.js')
    if (!Array.isArray(prompts)) {
      this.errlog(`boilerplate ${boilerplateName} had no 'prompts'`)
      process.exit(0)
    }

    // collect all files and directories
    const boilerplateSourcePath = path.resolve(
      boilerplatePkgPath,
      'boilerplate'
    )
    this.boilerplateSourcePath = boilerplateSourcePath

    const { files, dirs } = await this.collectFiles(boilerplateSourcePath)

    // make directory first
    dirs.forEach((d) => mkdirp.sync(path.join(this.destDirPath, d)))

    // tranfer files from temp dir to target dir
    await this.transferFiles(files, prompts)

    // install husky
    await this.husky()

    // print usage
    await this.usage()
  }

  async husky() {
    mkdirp(path.resolve(this.destDirPath, '.git'))
    this.log(
      '\n' +
        (await exec('npx husky-init --registry=' + this.mirror, {
          cwd: this.destDirPath,
        }))
    )
    this.log(
      await exec(
        'npx husky add .husky/commit-msg \'npx --no -- commitlint --edit "$1"\'',
        {
          cwd: this.destDirPath,
        }
      )
    )
  }

  async transferFiles(files, prompts) {
    // promps: [{ key: "name", question: "question" }, { key: "name", question: "question" }]
    const questions = prompts.map((item) => ({
      name: item.key,
      message: item.question,
      type: 'input',
      default: item.key === 'name' ? this.destDirName : '',
    }))
    const answers = await this.prompt(questions)
    const promises = files.map(async (f) => {
      const { base: basename, dir: dirname } = path.parse(f)
      const name = this.fileMapping[basename] || basename
      const from = path.join(this.boilerplateSourcePath, f)
      const to = path.join(this.destDirPath, dirname, name)
      const content = await fsp.readFile(from, 'utf-8')
      if (isText(from)) {
        return fsp.writeFile(to, mustache.render(content, answers)).then(() => {
          this.log(`write ${to}`)
        })
      }
      return fsp.writeFile(to, content).then(() => this.log(`write ${to}`))
    })
    return Promise.all(promises)
  }

  async collectFiles(boilerplatePath) {
    const dirs = []
    const files = []
    const all = await glob('**/*', {
      concurrency: os.cpus().length - 1,
      cwd: boilerplatePath,
      followSymbolicLinks: true,
      absolute: false,
      dot: true,
      onlyFiles: false,
      markDirectories: true,
    })
    all.forEach((f) => (f.endsWith('/') ? dirs.push(f) : files.push(f)))
    return { files, dirs }
  }

  usage() {
    this.log(`
      - cd ${this.destDirName}
      - npm install
      - npm start / npm run dev / npm test
    `)
  }

  async downloadBoilerplate(pkgname) {
    const { dist } = await this.getPackage(pkgname)
    assert.ok(typeof dist === 'object', `${pkgname} did't has dist`)
    const { tarball } = dist
    assert.ok(typeof tarball === 'string', `${pkgname} did't has dist.tarball`)
    this.log(`downloading ${tarball}`)
    const saveDir = this.tempDirPath
    await fsp.rm(saveDir, {
      force: true,
      recursive: true,
    })
    const response = await this.request(tarball, {
      streaming: true,
      followRedirect: true,
    })
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
