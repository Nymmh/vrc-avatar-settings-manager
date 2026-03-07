import { ref } from 'vue'

interface AppStorage {
  currentView: string
  dataTableRefresh: boolean
  avatarId: string
  avatarFoundFile: boolean
  lowPerformanceMode: boolean
}

const APP_STORAGE_KEY = 'app-storage-snapshot'

const baseStorage: AppStorage = {
  currentView: 'Waiting',
  dataTableRefresh: false,
  avatarId: '',
  avatarFoundFile: false,
  lowPerformanceMode: false
}

const getStorage = (): AppStorage => {
  if (typeof window === 'undefined') {
    return { ...baseStorage }
  }

  try {
    const raw = window.sessionStorage.getItem(APP_STORAGE_KEY)
    if (!raw) {
      return { ...baseStorage }
    }

    window.sessionStorage.removeItem(APP_STORAGE_KEY)
    const parsed = JSON.parse(raw) as Partial<AppStorage>

    return {
      ...baseStorage,
      ...parsed
    }
  } catch {
    return { ...baseStorage }
  }
}

const storage = ref<AppStorage>(getStorage())

export function saveAppStorageSnapshot(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.sessionStorage.setItem(APP_STORAGE_KEY, JSON.stringify(storage.value))
  } catch {
    return
  }
}

export function appStorage(): typeof storage {
  return storage
}
