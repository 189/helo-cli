# helo-cli

CLI to automatically create app with specified template.

## Install

```
$ npm install @helo-cli/helo -g
```

## Usage

Create a app following select options

```
$ helo init <your_project_name>

? please pick up a boilerplate (Use arrow keys)
  ──────────────
❯ ts (typescript app boilerplate, pack with rollup)
  js (simple js app)

```

```
$ helo -h

CLI to automatically create app with specified template

Options:
  -V, --version         output the version number
  -h, --help            display help for command

Commands:
  init [options] <dir>  create project in specify directory
  help [command]        display help for command

```

```
$ helo init -h
Usage: helo init demo --type lib-ts

create project in specified directory

Options:
  -t, --type <template>  choose a project type
  -u, --update           update cli latest
  -f, --force            overide the specified directory event if it is't empty
  -h, --help             display help for command
```
