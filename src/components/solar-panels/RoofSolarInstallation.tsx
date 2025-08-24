'use client'

import { Platform } from './Platform'
import { CoordinateTransformationService } from '@/services/CoordinateTransformationService'
import { PanelOrientation, PanelSpacingService } from '@/services/PanelSpacingService'
import { PANEL_SPECS, LANDSCAPE_PLATFORM_SPECS, VISUAL_SETTINGS } from '@/config/solarPanelInstallationSettings'

interface RoofSolarInstallationProps {
  configuration?: {
    rows?: number
    columns?: number
    connectorLength?: number
    orientation?: PanelOrientation
  }
}

export default function RoofSolarInstallation({ 
  configuration = { rows: 6, columns: 1, connectorLength: LANDSCAPE_PLATFORM_SPECS.defaultConnectorLength, orientation: 'landscape' },
}: RoofSolarInstallationProps) {
  const panels = []
  
  const rows = configuration.rows || 6
  const columns = configuration.columns || 1
  const connectorLength = configuration.connectorLength || LANDSCAPE_PLATFORM_SPECS.defaultConnectorLength
  const orientation = configuration.orientation || 'landscape'

  const spacing = PanelSpacingService.calculateSpacing(
    PANEL_SPECS, 
    LANDSCAPE_PLATFORM_SPECS, 
    connectorLength, 
    orientation
  )
  
  const platformDimensions = {
    width: spacing.singleColWidth,
    height: spacing.platformThickness,
    depth: spacing.projectedDepth
  }
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const edgePosition = {
        x: col * spacing.singleColWidth,
        y: 0,
        z: row * spacing.rowSpacing
      }
      
      panels.push(
        <Platform
          key={`panel-${row}-${col}`}
          position={CoordinateTransformationService.edgeToThreeJs(edgePosition, platformDimensions)}
          dimensions={{
            length: platformDimensions.width,
            width: platformDimensions.depth,
            thickness: platformDimensions.height
          }}
          orientation={orientation}
          includePanel={true}
        />
      )
    }
  }
  
  const connectors = []
  for (let i = 0; i < rows - 1; i++) {
    const connectorStart = i * spacing.rowSpacing + spacing.platformLength
    const connectorEnd = (i + 1) * spacing.rowSpacing
    const connectorZ = (connectorStart + connectorEnd) / 2
    
    const connectorDimensions = {
      width: 0.08,
      height: spacing.platformThickness,
      depth: spacing.airGap
    }
    
    const leftEdgePosition = {
      x: 0,
      y: 0,
      z: connectorZ - connectorDimensions.depth / 2
    }
    connectors.push(
      <mesh
        key={`connector-${i}-left`}
        castShadow 
        receiveShadow 
        position={CoordinateTransformationService.edgeToThreeJs(leftEdgePosition, connectorDimensions)}
      >
        <boxGeometry args={[connectorDimensions.width, connectorDimensions.height, connectorDimensions.depth]} />
        <meshLambertMaterial color={VISUAL_SETTINGS.connectorColor} />
      </mesh>
    )
    
    const rightEdgePosition = {
      x: spacing.singleColWidth * columns - connectorDimensions.width,
      y: 0,
      z: connectorZ - connectorDimensions.depth / 2
    }
    connectors.push(
      <mesh
        key={`connector-${i}-right`}
        castShadow 
        receiveShadow 
        position={CoordinateTransformationService.edgeToThreeJs(rightEdgePosition, connectorDimensions)}
      >
        <boxGeometry args={[connectorDimensions.width, connectorDimensions.height, connectorDimensions.depth]} />
        <meshLambertMaterial color={VISUAL_SETTINGS.connectorColor} />
      </mesh>
    )
  }
  
  return <group>{[...panels, ...connectors]}</group>
}