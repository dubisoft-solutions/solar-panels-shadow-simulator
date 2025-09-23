import { Position3D } from '@/types/common'
import { PlatformSpecs } from '@/services/PanelSpacingService'

export interface InstallationPosition {
  areaId: string
  position: Position3D
  rotation: [number, number, number]
}

export interface Installation3DConfiguration {
  id: string
  position: Position3D
  rotation: [number, number, number]
  configuration: {
    rowConfigurations: Array<{
      columns: number
      connectorLength?: number
    }>
    platformSpecs: PlatformSpecs
  }
}

export interface Layout3DConfiguration {
  installations: Installation3DConfiguration[]
}