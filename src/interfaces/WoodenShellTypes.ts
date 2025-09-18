import { ReactElement } from 'react'

export interface Position3D {
  x: number
  y: number
  z: number
}

export interface Dimensions3D {
  width: number
  height: number
  depth: number
}

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