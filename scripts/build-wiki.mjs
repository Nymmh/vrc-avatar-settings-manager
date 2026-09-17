/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { existsSync, statSync } from 'node:fs'
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const wikiUrl = 'https://github.com/Nymmh/vrc-avatar-settings-manager/wiki'
const assetUrl = 'https://raw.githubusercontent.com/wiki/Nymmh/vrc-avatar-settings-manager/assets'
const pages = [
  ['README.md', 'Home', 'Home'],
  ['README/FAQ.md', 'FAQ', 'FAQ'],
  ['README/detailed-export-import.md', 'Detailed-Export-&-Import-Guide', 'Export & Import Guide'],
  ['README/build-from-source.md', 'Build-From-Source', 'Build From Source'],
  ['README/change-log.md', 'Change-Log', 'Change Log'],
  ['README/avatar-list.md', 'Avatar-List', 'Avatar List'],
  ['README/eula.md', 'EULA', 'EULA'],
  ['README/privacy-policy.md', 'Privacy-Policy', 'Privacy Policy']
]

export async function buildWiki(sourceRoot, outputDirectory) {
  const root = path.resolve(sourceRoot)
  const output = path.resolve(outputDirectory)
  const assets = path.join(root, 'README/assets')
  if (existsSync(output)) throw new Error('Output directory already exists; use a fresh directory.')
  if (output.startsWith(assets + path.sep)) {
    throw new Error('Output directory must be outside README/assets.')
  }

  const pageNames = new Map(pages.map(([source, name]) => [path.resolve(root, source), name]))
  const rendered = []
  for (const [source, name] of pages) {
    const content = await readFile(path.join(root, source), 'utf8')
    const converted = content.replace(/\]\(([^\s)]+)\)/g, (match, destination) => {
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(destination)) return match
      const [file, fragment] = destination.split(/#(.*)/s)
      const target = path.resolve(root, path.dirname(source), decodeURIComponent(file))
      const suffix = fragment === undefined ? '' : `#${fragment}`
      if (pageNames.has(target)) {
        return `](${wikiUrl}/${encodeURIComponent(pageNames.get(target))}${suffix})`
      }
      if (target.startsWith(assets + path.sep)) {
        if (!existsSync(target) || !statSync(target).isFile()) {
          throw new Error(`Missing image in ${source}: ${destination}`)
        }
        const relative = path
          .relative(assets, target)
          .split(path.sep)
          .map(encodeURIComponent)
          .join('/')
        return `](${assetUrl}/${relative}${suffix})`
      }
      throw new Error(`Unmapped local link in ${source}: ${destination}`)
    })
    rendered.push([`${name}.md`, converted])
  }

  rendered.push(['Terms.md', rendered.find(([name]) => name === 'EULA.md')[1]])
  rendered.push([
    '_Sidebar.md',
    pages
      .map(([, name, label]) => `- [${label}](${wikiUrl}/${encodeURIComponent(name)})`)
      .join('\n') + '\n'
  ])

  await mkdir(output, { recursive: true })
  await cp(assets, path.join(output, 'assets'), { recursive: true })
  for (const [name, content] of rendered) {
    await writeFile(path.join(output, name), content)
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const output = process.argv[2]
  if (!output || process.argv.length !== 3) {
    console.error('Usage: node scripts/build-wiki.mjs <new-output-directory>')
    process.exitCode = 1
  } else {
    try {
      await buildWiki(fileURLToPath(new URL('../', import.meta.url)), output)
      console.log(`Wiki pages and assets built in ${path.resolve(output)}`)
    } catch (error) {
      console.error(error.message)
      process.exitCode = 1
    }
  }
}
