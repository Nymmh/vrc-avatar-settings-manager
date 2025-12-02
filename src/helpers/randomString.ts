export function randomString(length: number = 22): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''

  for (let i = 0; i < length; i++) {
    result += characters[(Math.random() * 62) | 0]
  }

  return result
}
