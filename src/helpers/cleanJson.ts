const BOM_REGEX = /^\uFEFF/
const JUNK_REGEX = /^[^{\[]+/

export function cleanJson(data: string): string {
  return data.replace(BOM_REGEX, '').replace(JUNK_REGEX, '').trim()
}
