import { ReactElement } from 'react'
import { Position3D, Dimensions3D } from '@/types/common'

export interface WoodenShellConfiguration {
  position: Position3D
  shellDimensions: Dimensions3D
  beamSize: number
  panlatSpecs: {
    width: number
    depth: number
  }
  padding: {
    sides: number
    front: number
    top: number
  }
}

export interface WoodenShellProps {
  configuration: WoodenShellConfiguration
  materials?: {
    mainBeam?: ReactElement
    panlatH?: ReactElement
    panlatV?: ReactElement
  }
}