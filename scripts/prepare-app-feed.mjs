/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import yaml from 'js-yaml'

const repository = 'Nymmh/vrc-avatar-settings-manager'
const stableAppTag = /^(app-v|v)((?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*))$/

export async function prepareAppFeed({
  release,
  metadataDirectory,
  outputDirectory,
  allowLegacyTag = false
}) {
  const match = stableAppTag.exec(release.tag_name)
  if (!match || (match[1] !== 'app-v' && !allowLegacyTag)) {
    throw new Error('Expected an App release tag: app-v<major.minor.patch>.')
  }
  const version = match[2]
  if (release.draft !== false || release.prerelease !== false) {
    throw new Error('The App feed requires a published stable release.')
  }
  if (!Array.isArray(release.assets)) throw new Error('Release assets are missing.')

  const releaseBase = `https://github.com/${repository}/releases/download/${release.tag_name}/`
  function releaseAsset(value) {
    if (typeof value !== 'string' || !value) throw new Error('Missing release asset URL.')
    const url = new URL(value, releaseBase).href
    const matches = release.assets.filter(
      (asset) =>
        asset.browser_download_url === url &&
        asset.browser_download_url === releaseBase + encodeURIComponent(asset.name) &&
        asset.state === 'uploaded'
    )
    if (matches.length !== 1) throw new Error(`Not an uploaded asset of this App release: ${value}`)
    return matches[0]
  }
  function rewriteFile(file) {
    if (!file || typeof file.sha512 !== 'string' || !/^[A-Za-z0-9+/]{86}==$/.test(file.sha512)) {
      throw new Error('Update files must have a valid SHA-512 checksum.')
    }
    const asset = releaseAsset(file.url)
    if (!Number.isSafeInteger(file.size) || file.size <= 0 || file.size !== asset.size) {
      throw new Error(`Update size does not match the release asset: ${asset.name}`)
    }
    return { ...file, url: asset.browser_download_url }
  }

  const names = (await readdir(metadataDirectory)).filter((name) =>
    /^latest(?:-[a-z0-9]+)*\.yml$/.test(name)
  )
  if (!names.includes('latest.yml')) throw new Error('The Windows latest.yml metadata is required.')
  const feeds = []
  for (const name of names) {
    releaseAsset(name)
    const metadata = yaml.load(await readFile(path.join(metadataDirectory, name), 'utf8'))
    if (metadata?.version !== version)
      throw new Error(`Metadata version does not match ${release.tag_name}: ${name}`)
    if (!Array.isArray(metadata.files) || metadata.files.length === 0) {
      throw new Error(`Update files are missing: ${name}`)
    }
    metadata.files = metadata.files.map(rewriteFile)
    if (metadata.path != null) {
      metadata.path = releaseAsset(metadata.path).browser_download_url
      const legacyFile = metadata.files.find((file) => file.url === metadata.path)
      if (!legacyFile || legacyFile.sha512 !== metadata.sha512) {
        throw new Error(`Legacy path and SHA-512 must match an update file: ${name}`)
      }
    }
    if (metadata.packages != null) {
      for (const [arch, entry] of Object.entries(metadata.packages)) {
        const rewritten = rewriteFile({ ...entry, url: entry.path })
        metadata.packages[arch] = { ...entry, path: rewritten.url }
      }
    }
    feeds.push([name, yaml.dump(metadata, { lineWidth: -1 })])
  }

  await mkdir(path.dirname(path.resolve(outputDirectory)), { recursive: true })
  await mkdir(outputDirectory)
  const feedDirectory = path.join(outputDirectory, 'updates/app')
  await mkdir(feedDirectory, { recursive: true })
  await writeFile(path.join(outputDirectory, '.nojekyll'), '')
  for (const [name, contents] of feeds) {
    await writeFile(path.join(feedDirectory, name), contents)
  }
  return feeds.map(([name]) => name)
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [releasePath, metadataDirectory, outputDirectory, option] = process.argv.slice(2)
  if (
    !releasePath ||
    !metadataDirectory ||
    !outputDirectory ||
    process.argv.length > 6 ||
    (option && option !== '--bootstrap-legacy')
  ) {
    throw new Error(
      'Usage: node scripts/prepare-app-feed.mjs <release.json> <metadata-directory> <new-site-directory> [--bootstrap-legacy]'
    )
  }
  const release = JSON.parse(await readFile(releasePath, 'utf8'))
  const files = await prepareAppFeed({
    release,
    metadataDirectory,
    outputDirectory,
    allowLegacyTag: option === '--bootstrap-legacy'
  })
  console.log(`Prepared ${release.tag_name}: ${files.join(', ')} in ${outputDirectory}`)
}
