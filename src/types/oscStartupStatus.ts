export interface OSCStartupStatus {
  state: 'starting' | 'retrying' | 'waiting-vrchat' | 'waiting-osc' | 'failed' | 'ready'
  attempt: number
  message: string
  vrchatCheckSkipped?: boolean
}
