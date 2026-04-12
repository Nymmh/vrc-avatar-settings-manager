import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function isVRChatRunning(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq VRChat.exe" /NH')

    return stdout.toLowerCase().includes('vrchat.exe')
  } catch {
    // Assume VRC is not running
    return false
  }
}
