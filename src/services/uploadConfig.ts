import { Bundle, Client } from 'node-osc'
import { avatarConfigType } from '../types/avatarConfigType'

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

export async function uploadConfig(
  loadedJson: avatarConfigType,
  OSC_CLIENT: Client
): Promise<boolean> {
  try {
    if (loadedJson?.animationParameters && loadedJson?.animationParameters?.length) {
      const formattedParams = loadedJson.animationParameters
        .filter((ap) => ap.name && ap.value !== undefined)
        .map((ap) => ({
          address: `/avatar/parameters/${ap.name}`,
          args: [
            {
              type: ap.type,
              value: ap.value
            }
          ]
        }))

      const chunks = chunkArray(formattedParams, 15)

      for (const chunk of chunks) {
        await OSC_CLIENT.send(new Bundle(...chunk))
      }
      return true
    } else {
      return false
    }
  } catch (e) {
    console.log(e)
    return false
  }
}
