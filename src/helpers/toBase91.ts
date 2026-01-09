export function toBase91(buffer: Buffer): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,-./:;<=>?@[]^_`{|}~"'
  let result = ''
  let ebq = 0
  let en = 0

  for (let i = 0; i < buffer.length; i++) {
    ebq |= buffer[i] << en
    en += 8
    if (en > 13) {
      let ev = ebq & 8191
      if (ev > 88) {
        ebq >>= 13
        en -= 13
      } else {
        ev = ebq & 16383
        ebq >>= 14
        en -= 14
      }
      result += chars[ev % 91] + chars[Math.floor(ev / 91)]
    }
  }

  if (en > 0) {
    result += chars[ebq % 91]
    if (en > 7 || ebq > 90) {
      result += chars[Math.floor(ebq / 91)]
    }
  }

  return result
}
