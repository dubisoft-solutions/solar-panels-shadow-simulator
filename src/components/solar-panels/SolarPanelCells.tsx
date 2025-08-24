'use client'

import { SmartSolarCell } from './SmartSolarCell'
import { PANEL_SPECS, VISUAL_SETTINGS } from '@/config/solarPanelInstallationSettings'

interface SolarPanelCellsProps {
  specs: typeof PANEL_SPECS
}

export function SolarPanelCells({ specs }: SolarPanelCellsProps) {
  const cellWidth = specs.length / specs.cellColumns
  const cellHeight = specs.width / specs.cellRows
  const cellThickness = 0.005
  
  const cells = []

  for (let row = 0; row < specs.cellRows; row++) {
    for (let col = 0; col < specs.cellColumns; col++) {
      let stringIndex = 0
      if (row >= 4) stringIndex = 2
      else if (row >= 2) stringIndex = 1
      
      const x = (col * cellWidth) - (specs.length / 2) + (cellWidth / 2)
      const y = specs.thickness / 2 + cellThickness + 0.002
      const z = (row * cellHeight) - (specs.width / 2) + (cellHeight / 2)
      
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
  
  const stringRowCounts = [2, 2, 2]
  let currentRow = 0
  
  for (let i = 0; i < specs.stringCount - 1; i++) {
    currentRow += stringRowCounts[i]
    const z = (currentRow * cellHeight) - (specs.width / 2)
    cells.push(
      <mesh
        key={`string-divider-${i}`}
        position={[0, specs.thickness / 2 + cellThickness, z]}
      >
        <boxGeometry args={[specs.length, cellThickness, 0.002]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>
    )
  }
  
  return <group>{cells}</group>
}