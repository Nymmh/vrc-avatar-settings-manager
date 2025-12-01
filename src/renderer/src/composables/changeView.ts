import { appStorage } from './appStorage'

export function handleChangeView(view: string): void {
  const appStore = appStorage()

  if (!appStore.value.avatarId && view === 'Main') {
    appStore.value.currentView = 'Waiting'
    return
  }

  appStore.value.currentView = view
}
