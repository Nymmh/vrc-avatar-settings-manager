import type { Logger } from 'electron-log'
import { isExcluded, VF_PREFIX_REGEX } from '../helpers/excludedParameters'

export interface OscParameter {
  name: string
  input?: { address: string; type: string }
  output?: { address: string; type: string }
}

export interface OscConfig {
  id?: string
  parameters: OscParameter[]
}

const legacyName = (name: string): string => name.replace(/ +/g, '_').replace(/_+/g, '_')
const suffix = (name: string): string => {
  while (VF_PREFIX_REGEX.test(name)) {
    name = name.replace(VF_PREFIX_REGEX, '')
  }
  return name
}

export function resolveParameters(
  saved: valuedParamsInterface[],
  config: OscConfig,
  log: Pick<Logger, 'warn'> = console
): valuedParamsInterface[] {
  if (!Array.isArray(saved) || !Array.isArray(config.parameters)) {
    throw new Error('Invalid parameter configuration')
  }

  const targets = config.parameters.filter((p) => !isExcluded(p.name, true))
  type ResolvedEntry = { sourceName: string; parameter: valuedParamsInterface }
  const used = new Map<string, ResolvedEntry>()
  const addresses = new Map<string, ResolvedEntry>()
  const resolved: valuedParamsInterface[] = []

  for (const entry of saved) {
    if (!entry || typeof entry.name !== 'string') {
      throw new Error('Invalid saved parameter')
    }
    if (isExcluded(entry.name, true)) continue
    const hasValue = entry.value !== undefined
    const name = entry.name
    const exact = entry.nameFormat === 'exact'
    let matches = exact ? targets.filter((p) => p.name === name) : []
    if (matches.length === 0) {
      matches = targets.filter((p) =>
        exact ? suffix(p.name) === suffix(name) : legacyName(p.name) === legacyName(name)
      )
    }
    if (!exact && matches.length === 0) {
      matches = targets.filter((p) => legacyName(suffix(p.name)) === legacyName(suffix(name)))
    }
    if (matches.length !== 1) {
      if (!hasValue) continue
      throw new Error(`${matches.length ? 'Ambiguous' : 'Missing'} parameter mapping: ${name}`)
    }

    const target = matches[0]
    const input = target.input
    if (!input?.address?.startsWith('/') || !['Float', 'Int', 'Bool'].includes(input.type)) {
      if (!hasValue) continue
      throw new Error(`Parameter is not writable: ${target.name}`)
    }
    const value = typeof entry.value === 'boolean' ? Number(entry.value) : entry.value
    const previous = used.get(target.name)
    if (previous) {
      if (
        hasValue &&
        (previous.parameter.value === undefined ||
          (name === target.name && previous.sourceName !== target.name))
      ) {
        previous.parameter.value = value
        previous.sourceName = name
      }
      continue
    }
    const addressMatch = addresses.get(input.address)
    if (addressMatch) {
      log.warn(
        `Multiple saved parameters resolve to: ${target.name} (${input.address}): ` +
          `${JSON.stringify(addressMatch.sourceName)}=${JSON.stringify(addressMatch.parameter.value)} and ` +
          `${JSON.stringify(name)}=${JSON.stringify(value)}. Keeping the first mapping.`
      )
      continue
    }
    const parameter: valuedParamsInterface = {
      name: target.name,
      nameFormat: 'exact',
      value,
      type: input.type === 'Float' ? 'f' : 'i',
      address: input.address
    }
    const source = { sourceName: name, parameter }
    used.set(target.name, source)
    addresses.set(input.address, source)
    resolved.push(parameter)
  }
  return resolved
}
