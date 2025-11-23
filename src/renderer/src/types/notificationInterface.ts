export interface NotificationInterface {
  type: 'success' | 'error' | 'info' | 'warn'
  title: string
  text?: string
}
