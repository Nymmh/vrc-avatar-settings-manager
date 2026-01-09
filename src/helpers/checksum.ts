import crypto from 'crypto'

export function checksum(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex').slice(0, 6).toUpperCase()
}
