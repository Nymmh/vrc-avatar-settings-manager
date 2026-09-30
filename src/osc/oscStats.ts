let received = 0
let sent = 0

export function recordOscReceived(): void {
  received++
}

export function recordOscSent(count: number): void {
  sent += count
}

export function getOscStats(): { received: number; sent: number } {
  return { received, sent }
}
