/**
 * TipLink webhook handler
 * Processes events from TipLink service
 */

import log from 'electron-log/main'
import { TiplinkEvent } from './webhookConfig'

export class TiplinkHandler {
  private messageCount = 0
  private lastEventTime = Date.now()
  private deduplicationMap = new Map<string, number>()
  private readonly DEDUP_WINDOW_MS = 1000 // Deduplicate within 1 second

  constructor(
    private onEvent: (event: TiplinkEvent) => Promise<void> | void,
    private logger = log
  ) {}

  /**
   * Handle incoming TipLink event
   */
  async handleEvent(data: unknown): Promise<void> {
    try {
      // Validate event structure
      const event = this.validateEvent(data)

      // Update metadata
      this.lastEventTime = Date.now()
      event.timestamp = event.timestamp || Date.now()

      // Check for duplicates
      const eventKey = `${event.userId}-${event.action}-${JSON.stringify(event.value)}`
      const lastSeenTime = this.deduplicationMap.get(eventKey)

      if (lastSeenTime && Date.now() - lastSeenTime < this.DEDUP_WINDOW_MS) {
        this.logger.debug(`[TipLink] Duplicate event ignored: ${eventKey}`)
        return
      }

      // Record event
      this.deduplicationMap.set(eventKey, Date.now())
      this.messageCount++

      // Log the event
      this.logger.info(
        `[TipLink] ${event.action.toUpperCase()} from ${event.userId}`,
        event.value ? `(${JSON.stringify(event.value)})` : ''
      )

      // Process through callback
      await this.onEvent(event)

      // Cleanup old dedup entries to prevent memory leak
      this.cleanupDedup()
    } catch (error) {
      this.logger.error('[TipLink] Error handling event:', error)
      throw error
    }
  }

  /**
   * Get handler statistics
   */
  getStats() {
    return {
      messageCount: this.messageCount,
      lastEventTime: this.lastEventTime,
      timelapsed: Date.now() - this.lastEventTime
    }
  }

  /**
   * Validate TipLink event structure
   */
  private validateEvent(data: unknown): TiplinkEvent {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Invalid TipLink event: not an object')
    }

    const event = data as Record<string, unknown>

    if (typeof event.userId !== 'string' || !event.userId.trim()) {
      throw new Error('Invalid TipLink event: missing or invalid userId')
    }

    if (typeof event.action !== 'string' || !event.action.trim()) {
      throw new Error('Invalid TipLink event: missing or invalid action')
    }

    return {
      userId: event.userId,
      action: event.action,
      value: event.value,
      message: typeof event.message === 'string' ? event.message : undefined,
      metadata:
        typeof event.metadata === 'object'
          ? (event.metadata as Record<string, unknown>)
          : undefined,
      timestamp: typeof event.timestamp === 'number' ? event.timestamp : undefined
    }
  }

  /**
   * Cleanup old deduplication entries
   */
  private cleanupDedup(): void {
    const now = Date.now()
    for (const [key, timestamp] of this.deduplicationMap.entries()) {
      if (now - timestamp > this.DEDUP_WINDOW_MS * 3) {
        this.deduplicationMap.delete(key)
      }
    }
  }
}
