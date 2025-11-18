import { Bundle, Client } from 'node-osc'
import { avatarConfigType } from '../types/avatarConfigType'

export async function uploadConfig(
  loadedJson: avatarConfigType,
  OSC_CLIENT: Client
): Promise<boolean> {
  try {
    if (loadedJson?.animationParameters && loadedJson?.animationParameters?.length) {
      const formattedParams: {
        address: string
        args: [
          {
            type: string | undefined
            value: number
          }
        ]
      }[] = []
      for (const ap of loadedJson.animationParameters) {
        if (ap.name && ap.value != undefined) {
          formattedParams.push({
            address: `/avatar/parameters/${ap.name}`,
            args: [
              {
                type: ap.type,
                value: ap.value
              }
            ]
          })
        }
      }

      await OSC_CLIENT.send(new Bundle(...formattedParams))

      return true
    } else {
      return false
    }
  } catch (e) {
    console.log(e)
    return false
  }
}
