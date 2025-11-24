import crypto from 'crypto'

export function generateUqid(sample: string): string {
  const timestamp = Date.now()
  return crypto.createHash('sha256').update(`${sample}${timestamp}`).digest('hex').substring(0, 22)
}
