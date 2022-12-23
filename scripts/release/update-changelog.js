/* eslint-disable no-console */
/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/no-var-requires */
const { exec } = require('child_process')
const path = require('path')
const fs = require('fs')

const commitRegex =
  /^([0-9]+\s[a-zA-Z]+\s[0-9]+\s)([a-zA-Z0-9]{40})\s([A-Z]{2,3}-[0-9]+)\s\|\s(feat|fix|test|docs|chore|ci):(.*)$/
const httpsReg = /^https:\/\/(.+).git$/
const gitReg = /^git@(.+):(.+).git$/
const minorVersionReg = /^([0-9].){2}0$/

// eslint-disable-next-line import/no-dynamic-require
const pkg = require(path.join(process.cwd(), 'package.json'))
let errMsg = ''
errMsg += '+-------------------------------------------+\n'
errMsg += '| There was an error creating the changelog |\n'
errMsg += '+-------------------------------------------+\n'

let changelogOutput = ''
let repoUrl = ''
let compareTagsUrl = ''
const jiraUrl = 'https://payrix.atlassian.net'
let pkgVers = ''
let prevTag = ''
const file = './CHANGELOG.md'

function formatCommit(commit) {
  let output = `${commit.commitMsg}`
  output += ` ([#${commit.commitHash.substring(0, 8)}](${repoUrl}/commit/${
    commit.commitHash
  }))`
  output += ` ([${commit.ticket}](${jiraUrl}/browse/${commit.ticket}))`

  return output
}

function getRepoUrl() {
  return new Promise((resolve, reject) => {
    exec('git remote get-url --all origin', (err, stdout) => {
      if (err) {
        return reject(err)
      }

      const output = stdout.split('\n')[0]
      if (httpsReg.test(output)) {
        const found = output.match(httpsReg)
        repoUrl = `https://${found[1]}`
      }

      if (gitReg.test(output)) {
        const found = output.match(gitReg)
        repoUrl = `https://${found[1]}/${found[2]}`
      }

      resolve()
    })
  })
}

function prepareTags() {
  return new Promise((resolve, reject) => {
    exec("git tag | grep '^[0-1]'| sort -rV | head -n 2", (err, stdout) => {
      if (err) {
        return reject(err)
      }

      const tags = stdout.split('\n')
      if (tags.length < 2) {
        return reject(new Error('previous tags were deleted.'))
      }

      pkgVers = pkg.version
      // eslint-disable-next-line prefer-destructuring
      prevTag = tags[1]

      const data = fs.readFileSync(file).toString()
      const tmp = '^(#){1,2}\\s\\[version\\]'
      const regex = new RegExp(tmp.replace(/version/, pkgVers), 'gm')
      if (regex.test(data)) {
        return reject(
          new Error(
            `the changelog already contains the current version: ${pkgVers}`
          )
        )
      }

      compareTagsUrl = `${repoUrl}/compare/${prevTag}...${pkgVers}`

      resolve()
    })
  })
}

function prepareOutput() {
  return new Promise((resolve) => {
    if (!minorVersionReg.test(pkgVers)) {
      changelogOutput += '#'
    }

    changelogOutput += `## [${pkg.version}](${compareTagsUrl})`
    changelogOutput += ` (${new Date()
      .toLocaleDateString()
      .replace(/\//g, '-')})`

    resolve()
  })
}

function getCommits() {
  return new Promise((resolve, reject) => {
    exec(
      `git log ${prevTag}..${pkgVers} --date=format:"%d %B %Y" --pretty=format:"%cd %H %s"`,
      (err, commits) => {
        if (err) {
          return reject(err)
        }

        const output = commits
          .split('\n')
          .filter((value) => commitRegex.test(value))
          .map((item) => {
            const found = item.match(commitRegex)
            return {
              commitDate: found[1],
              commitHash: found[2],
              ticket: found[3],
              type: found[4],
              commitMsg: found[5],
            }
          })
        resolve(output)
      }
    )
  })
}

function getNewFeatures(items) {
  return new Promise((resolve) => {
    const features = items.filter((feat) => feat.type === 'feat')
    if (features.length) {
      changelogOutput += '\n#### Features\n'
      features.forEach((feat) => {
        changelogOutput += `\n${formatCommit(feat)}\n`
      })
    }
    resolve(items)
  })
}

function getFixes(items) {
  return new Promise((resolve) => {
    const fixes = items.filter((fix) => fix.type === 'fix')
    if (fixes.length) {
      changelogOutput += '\n#### Bug Fixes\n'
      fixes.forEach((fix) => {
        changelogOutput += `\n${formatCommit(fix)}\n`
      })
    }
    resolve(items)
  })
}

function updateFile() {
  return new Promise((resolve, reject) => {
    const data = fs.readFileSync(file).toString().split('\n')
    data.splice(5, 0, `${changelogOutput}\n`)
    const text = data.join('\n')

    fs.writeFile(file, text, (err) => {
      if (err) {
        return reject(err)
      }
    })

    resolve()
  })
}

getRepoUrl()
  .then(prepareTags)
  .then(prepareOutput)
  .then(getCommits)
  .then(getNewFeatures)
  .then(getFixes)
  .then(updateFile)
  .then(() => console.log(changelogOutput))
  .catch((err) => {
    console.error('\x1b[31m%s\x1b[0m', errMsg)
    console.error('\x1b[31m%s\x1b[0m\n', err)

    process.exit(1)
  })
