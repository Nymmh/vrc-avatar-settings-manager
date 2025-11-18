import { avatarConfigType } from '../types/avatarConfigType'

export function getLoadDataName(data: avatarConfigType): string {
  return data.name
}
