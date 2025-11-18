import { uploadConfig } from '../services/uploadConfig'

export async function uploadConfigIPC(loadedJson, OSC_CLIENT): Promise<boolean> {
  const upload = await uploadConfig(loadedJson, OSC_CLIENT)

  if (!upload) {
    return false
  } else return true
}
