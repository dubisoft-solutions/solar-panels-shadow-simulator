'use client'

import { PanelOrientation, PanelSpacingService } from '@/services/PanelSpacingService'
import { SmartSolarCell } from './SmartSolarCell'
import { PANEL_SPECS, VISUAL_SETTINGS } from '@/config/solarPanelInstallationSettings'

interface SolarPanelCellsProps {
  specs: typeof PANEL_SPECS,
  orientation: PanelOrientation
}

export function SolarPanelCells({ specs, orientation }: SolarPanelCellsProps) {
  const panelDimensions = PanelSpacingService.getPanelDimensions(specs, orientation)
  
  const gridDimensions = orientation === 'landscape'
    ? { columns: specs.cellColumns, rows: specs.cellRows }
    : { columns: specs.cellRows, rows: specs.cellColumns }
  
  const cellWidth = panelDimensions.length / gridDimensions.columns
  const cellHeight = panelDimensions.width / gridDimensions.rows
  const cellThickness = 0.005
  
  const cells = []

  for (let row = 0; row < gridDimensions.rows; row++) {
    for (let col = 0; col < gridDimensions.columns; col++) {
      let stringIndex = 0
      
      if (orientation === 'landscape') {
        // 6 rows total: 0-1 = string 0, 2-3 = string 1, 4-5 = string 2
        if (row >= 4) stringIndex = 2
        else if (row >= 2) stringIndex = 1
        else stringIndex = 0
      } else {
        // Portrait: 6 columns total: 0-1 = string 0, 2-3 = string 1, 4-5 = string 2
        if (col >= 4) stringIndex = 2
        else if (col >= 2) stringIndex = 1
        else stringIndex = 0
      }
      
      const x = (col * cellWidth) - (panelDimensions.length / 2) + (cellWidth / 2)
      const y = specs.thickness / 2 + cellThickness + 0.002
      const z = (row * cellHeight) - (panelDimensions.width / 2) + (cellHeight / 2)
      
      cells.push(
        <SmartSolarCell
          key={`cell-${row}-${col}`}
          cellId={`cell-${row}-${col}`}
          position={[x, y, z]}
          geometry={[cellWidth * 0.95, cellThickness, cellHeight * 0.95]}
          baseColor={VISUAL_SETTINGS.stringColors[stringIndex] || VISUAL_SETTINGS.cellColor}
        />
      )
    }
  }
  
  // Add string dividers between the 3 strings
  if (orientation === 'landscape') {
    // Landscape: horizontal dividers between rows (2 dividers for 3 strings)
    const stringRowCounts = [2, 2, 2]
    let currentRow = 0
    
    for (let i = 0; i < specs.stringCount - 1; i++) {
      currentRow += stringRowCounts[i]
      const z = (currentRow * cellHeight) - (panelDimensions.width / 2)
      cells.push(
        <mesh
          key={`string-divider-${i}`}
          position={[0, specs.thickness / 2 + cellThickness, z]}
        >
          <boxGeometry args={[panelDimensions.length, cellThickness, 0.002]} />
          <meshLambertMaterial color="#ffffff" />
        </mesh>
      )
    }
  } else {
    // Portrait: vertical dividers between columns (2 dividers for 3 strings)  
    const stringColCounts = [2, 2, 2] // 2 + 2 + 2 = 6 columns
    let currentCol = 0
    
    for (let i = 0; i < specs.stringCount - 1; i++) {
      currentCol += stringColCounts[i]
      const x = (currentCol * cellWidth) - (panelDimensions.length / 2)
      cells.push(
        <mesh
          key={`string-divider-${i}`}
          position={[x, specs.thickness / 2 + cellThickness, 0]}
        >
          <boxGeometry args={[0.002, cellThickness, panelDimensions.width]} />
          <meshLambertMaterial color="#ffffff" />
        </mesh>
      )
    }
  }
  
  return <group>{cells}</group>
}