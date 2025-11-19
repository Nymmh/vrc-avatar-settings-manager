<script setup lang="ts">
import { onMounted, ref, toRaw } from 'vue'

import Button from './components/Button.vue'
import Footer from './components/Footer.vue'
import Waiting from './components/Waiting.vue'

const avatarId = ref<string>('')
const avatarFoundFile = ref<boolean>(false)
const showAvatarFoundFileMsg = ref<boolean>(false)
const avatarConfig = ref<any>({})
const fileSaved = ref<boolean>(false)
const showFileSaved = ref<boolean>(false)
const loadedConfigName = ref<string>('')
const uploadStatus = ref<boolean>(false)
const showUploadStatus = ref<boolean>(false)

const resetVars = (): void => {
  showFileSaved.value = false
  loadedConfigName.value = ''
  uploadStatus.value = false
  showUploadStatus.value = false
}

const getAvatarId = (): void => {
  avatarId.value = ''

  window.avatarApi.avatarId((data) => {
    resetVars()
    avatarId.value = data.id
  })
}

const aviFileUpdate = (): void => {
  avatarFoundFile.value = false
  showAvatarFoundFileMsg.value = false
  resetVars()

  window.avatarApi.foundAvatarFile((data) => {
    avatarFoundFile.value = data.success
    showAvatarFoundFileMsg.value = true
  })
}

const aviConfig = (): void => {
  window.avatarApi.avatarConfig((data) => {
    resetVars()
    avatarConfig.value = data
  })
}

const handleSave = async (): Promise<void> => {
  resetVars()

  const res = await window.avatarApi.saveConfig(toRaw(avatarConfig.value.data))
  fileSaved.value = !!(res && res.success)
  showFileSaved.value = true
}

const handleLoad = async (): Promise<void> => {
  resetVars()
  const res = await window.avatarApi.loadConfig()

  loadedConfigName.value = res.name
}

const handleUpload = async (): Promise<void> => {
  resetVars()

  const res = await window.avatarApi.uploadConfig()

  uploadStatus.value = !!(res && res.success)
  showUploadStatus.value = true
}

onMounted(() => {
  avatarId.value = ''
  avatarFoundFile.value = false
  showAvatarFoundFileMsg.value = false
  resetVars()
  getAvatarId()
  aviFileUpdate()
  aviConfig()
})
</script>

<template>
  <div class="main">
    <Waiting v-if="!avatarId" />
    <div v-else>
      <div class="main__avatar-data">
        <p
          v-if="showAvatarFoundFileMsg"
          :class="[
            'main__avatar-found',
            avatarFoundFile
              ? 'main__avatar-found--success success'
              : 'main__avatar-found--failed failed'
          ]"
        >
          {{ avatarFoundFile ? 'Found avatar data' : 'Could not find avatar data' }}
        </p>
        <p class="main__avatar-id">
          Avatar ID: <span class="main__avatar-id__id">{{ avatarId }}</span>
        </p>
        <p v-if="avatarConfig?.data && avatarConfig?.data?.name" class="main__avatar-name">
          Name: <span class="main__avatar-name__name">{{ avatarConfig.data.name }}</span>
        </p>
      </div>
      <div class="main__buttons">
        <Button label="Save Config" @click="handleSave()" />
        <div v-if="showFileSaved" class="main__file-saved">
          <p
            :class="
              fileSaved ? 'main__file-saved--success success' : 'main__filed-saved--failed failed'
            "
          >
            {{ fileSaved ? 'File Saved' : 'File failed To Save' }}
          </p>
        </div>
        <Button label="Load Config" @click="handleLoad()" />
        <p v-if="loadedConfigName" class="main__loaded-config">
          Loaded config: <span class="main__loaded-config__file">{{ loadedConfigName }}</span>
        </p>
        <Button v-if="loadedConfigName" label="Upload" @click="handleUpload()" />
        <p v-if="showUploadStatus && loadedConfigName" class="main__upload-status">
          Upload Status:
          <span
            :class="[
              'main__upload-status__status',
              uploadStatus
                ? 'main__upload-status__status--success'
                : 'main__upload-status__status--failed',
              uploadStatus ? 'success' : 'failed'
            ]"
          >
            {{ uploadStatus ? 'Success' : 'Failed' }}
          </span>
        </p>
      </div>
    </div>
  </div>
  <Footer />
</template>

<style lang="scss">
@use './styles/global.scss';

.main {
  align-items: center;
  display: flex;
  flex-flow: column;
  gap: 16px;
  height: 94%;
  justify-content: center;

  &__avatar-data {
    align-items: center;
    border-bottom: 1px solid var(--color--primary-a3);
    display: flex;
    flex-flow: column;
    gap: 16px;
    justify-content: center;
    padding-bottom: 16px;
    width: 100%;
  }

  &__avatar-id {
    &__id {
      font-weight: bold;
    }
  }

  &__avatar-name {
    &__name {
      font-weight: bold;
    }
  }

  &__buttons {
    align-items: center;
    display: flex;
    flex-flow: column;
    gap: 16px;
    justify-content: center;
    width: 100%;
  }

  &__loaded-config {
    &__file {
      font-weight: bold;
    }
  }

  &__upload-status {
    &__status {
      font-weight: bold;
    }
  }
}
</style>
