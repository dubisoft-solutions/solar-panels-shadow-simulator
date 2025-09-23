'use client'

import { Platform } from './Platform'
import { CoordinateTransformationService } from '@/services/CoordinateTransformationService'
import { PanelOrientation, PanelSpacingService } from '@/services/PanelSpacingService'
import { PANEL_SPECS, LANDSCAPE_PLATFORM_SPECS, VISUAL_SETTINGS } from '@/config/solarPanelInstallationSettings'

interface RowConfiguration {
  columns: number
  connectorLength?: number
}

interface RoofSolarInstallationProps {
  configuration?: {
    // Legacy support
    rows?: number
    columns?: number
    connectorLength?: number
    orientation?: PanelOrientation
    // New per-row configuration
    rowConfigurations?: RowConfiguration[]
  }
}

export default function RoofSolarInstallation({
  configuration = { rows: 6, columns: 1, connectorLength: LANDSCAPE_PLATFORM_SPECS.defaultConnectorLength, orientation: 'landscape' },
}: RoofSolarInstallationProps) {
  const panels = []
  const connectors = []

  const orientation = configuration.orientation || 'landscape'
  const defaultConnectorLength = configuration.connectorLength || LANDSCAPE_PLATFORM_SPECS.defaultConnectorLength

  // Determine if using new row-based configuration or legacy configuration
  let rowConfigs: RowConfiguration[]
  if (configuration.rowConfigurations) {
    rowConfigs = configuration.rowConfigurations
  } else {
    // Convert legacy configuration to row-based format
    const rows = configuration.rows || 6
    const columns = configuration.columns || 1
    rowConfigs = Array(rows).fill(null).map(() => ({
      columns,
      connectorLength: defaultConnectorLength
    }))
  }

  let currentZPosition = 0

  for (let rowIndex = 0; rowIndex < rowConfigs.length; rowIndex++) {
    const rowConfig = rowConfigs[rowIndex]
    const rowConnectorLength = rowConfig.connectorLength || defaultConnectorLength

    const spacing = PanelSpacingService.calculateSpacing(
      PANEL_SPECS,
      LANDSCAPE_PLATFORM_SPECS,
      rowConnectorLength,
      orientation
    )

    const platformDimensions = {
      width: spacing.singleColWidth,
      height: spacing.platformThickness,
      depth: spacing.projectedDepth
    }

    // Create panels for this row
    for (let col = 0; col < rowConfig.columns; col++) {
      const edgePosition = {
        x: col * spacing.singleColWidth,
        y: 0,
        z: currentZPosition
      }

      panels.push(
        <Platform
          key={`panel-${rowIndex}-${col}-${orientation}-${rowConnectorLength}`}
          position={CoordinateTransformationService.edgeToThreeJs(edgePosition, platformDimensions)}
          dimensions={{
            length: platformDimensions.width,
            width: platformDimensions.depth,
            thickness: platformDimensions.height,
            panelMountOffset: spacing.panelMountOffset
          }}
          orientation={orientation}
          includePanel={true}
        />
      )
    }

    // Add connector after this row if it has a connectorLength specified
    if (rowConfig.connectorLength) {
      const connectorStart = currentZPosition + spacing.projectedDepth
      const connectorEnd = currentZPosition + rowConnectorLength
      const connectorZ = (connectorStart + connectorEnd) / 2

      const connectorDimensions = {
        width: 0.08,
        height: spacing.platformThickness,
        depth: rowConnectorLength - spacing.projectedDepth
      }

      // Left connector
      const leftEdgePosition = {
        x: 0,
        y: 0,
        z: connectorZ - connectorDimensions.depth / 2
      }
      connectors.push(
        <mesh
          key={`connector-${rowIndex}-left`}
          castShadow
          receiveShadow
          position={CoordinateTransformationService.edgeToThreeJs(leftEdgePosition, connectorDimensions)}
        >
          <boxGeometry args={[connectorDimensions.width, connectorDimensions.height, connectorDimensions.depth]} />
          <meshLambertMaterial color={VISUAL_SETTINGS.connectorColor} />
        </mesh>
      )

      // Right connector
      const rightEdgePosition = {
        x: spacing.singleColWidth * rowConfig.columns - connectorDimensions.width,
        y: 0,
        z: connectorZ - connectorDimensions.depth / 2
      }
      connectors.push(
        <mesh
          key={`connector-${rowIndex}-right`}
          castShadow
          receiveShadow
          position={CoordinateTransformationService.edgeToThreeJs(rightEdgePosition, connectorDimensions)}
        >
          <boxGeometry args={[connectorDimensions.width, connectorDimensions.height, connectorDimensions.depth]} />
          <meshLambertMaterial color={VISUAL_SETTINGS.connectorColor} />
        </mesh>
      )
    }

    // Move to next row position (use spacing for this row if no connector, or full connector length if connector exists)
    currentZPosition += rowConfig.connectorLength ? rowConnectorLength : spacing.projectedDepth
  }
  return <group>{[...panels, ...connectors]}</group>
}