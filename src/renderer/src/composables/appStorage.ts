import { ref } from 'vue'

interface AppStorage {
  currentView: string
  dataTableRefresh: boolean
  avatarId: string
  avatarFoundFile: boolean
}

const storage = ref<AppStorage>({
  currentView: 'Waiting',
  dataTableRefresh: false,
  avatarId: '',
  avatarFoundFile: false
})

export function appStorage(): typeof storage {
  return storage
}
