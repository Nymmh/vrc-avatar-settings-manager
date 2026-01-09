export function fromBase91(str: string): Buffer {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,-./:;<=>?@[]^_`{|}~"'
  const result: number[] = []
  let dbq = 0
  let dn = 0
  let dv = -1

  for (let i = 0; i < str.length; i++) {
    const c = chars.indexOf(str[i])
    if (c === -1) continue

    if (dv < 0) {
      dv = c
    } else {
      dv += c * 91
      dbq |= dv << dn
      dn += (dv & 8191) > 88 ? 13 : 14

      do {
        result.push(dbq & 255)
        dbq >>= 8
        dn -= 8
      } while (dn > 7)

      dv = -1
    }
  }

  if (dv >= 0) {
    result.push((dbq | (dv << dn)) & 255)
  }

  return Buffer.from(result)
}
