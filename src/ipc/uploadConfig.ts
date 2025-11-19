import { Logger } from 'electron-log'
import { uploadConfig } from '../services/uploadConfig'

export async function uploadConfigIPC(log: Logger, loadedJson, OSC_CLIENT): Promise<boolean> {
  const upload = await uploadConfig(loadedJson, OSC_CLIENT)

  if (upload) {
    log.info('Upload successful')
    return true
  } else {
    log.error('Upload failed')
    return false
  }
}
