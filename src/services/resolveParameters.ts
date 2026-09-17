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
const suffix = (name: string): string => name.replace(VF_PREFIX_REGEX, '')

export function resolveParameters(
  saved: valuedParamsInterface[],
  config: OscConfig
): valuedParamsInterface[] {
  if (!Array.isArray(saved) || !Array.isArray(config.parameters)) {
    throw new Error('Invalid parameter configuration')
  }

  const targets = config.parameters.filter((p) => !isExcluded(p.name, true))
  const used = new Set<string>()
  const addresses = new Set<string>()
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
    if (used.has(target.name) || addresses.has(input.address)) {
      throw new Error(`Multiple saved parameters resolve to: ${target.name}`)
    }
    used.add(target.name)
    addresses.add(input.address)
    resolved.push({
      name: target.name,
      nameFormat: 'exact',
      value: typeof entry.value === 'boolean' ? Number(entry.value) : entry.value,
      type: input.type === 'Float' ? 'f' : 'i',
      address: input.address
    })
  }
  return resolved
}
