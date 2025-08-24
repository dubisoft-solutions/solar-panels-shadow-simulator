'use client'

import { Platform } from './Platform'
import { CoordinateTransformationService } from '@/services/CoordinateTransformationService'
import { PanelSpacingService } from '@/services/PanelSpacingService'
import { PANEL_SPECS, LANDSCAPE_PLATFORM_SPECS, VISUAL_SETTINGS } from '@/config/solarPanelInstallationSettings'

interface RoofSolarInstallationProps {
  configuration?: {
    rows?: number
    columns?: number
    connectorLength?: number
  }
}

export default function RoofSolarInstallation({ 
  configuration = { rows: 6, columns: 1, connectorLength: LANDSCAPE_PLATFORM_SPECS.defaultConnectorLength }
}: RoofSolarInstallationProps) {
  const panels = []
  
  const rows = configuration.rows || 6
  const columns = configuration.columns || 1
  const connectorLength = configuration.connectorLength || LANDSCAPE_PLATFORM_SPECS.defaultConnectorLength
  
  const spacing = PanelSpacingService.calculateSpacing(
    PANEL_SPECS, 
    LANDSCAPE_PLATFORM_SPECS, 
    connectorLength, 
    'landscape'
  )
  
  const panelSpacing = spacing.rowSpacing
  
  const platformDimensions = {
    width: PANEL_SPECS.length,
    height: 0.05,
    depth: PANEL_SPECS.width
  }
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const edgePosition = {
        x: col * PANEL_SPECS.length,
        y: 0,
        z: row * panelSpacing
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
          includePanel={true}
        />
      )
    }
  }
  
  const connectors = []
  for (let i = 0; i < rows - 1; i++) {
    const connectorStart = i * panelSpacing + spacing.projectedDepth
    const connectorEnd = (i + 1) * panelSpacing
    const connectorZ = (connectorStart + connectorEnd) / 2
    
    const connectorDimensions = {
      width: 0.08,
      height: 0.03,
      depth: spacing.airGap
    }
    
    const leftEdgePosition = {
      x: PANEL_SPECS.length * 0.2 - connectorDimensions.width / 2,
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
      x: PANEL_SPECS.length * 0.8 - connectorDimensions.width / 2,
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