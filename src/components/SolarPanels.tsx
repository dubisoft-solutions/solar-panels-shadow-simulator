'use client'

import * as THREE from 'three'
import { useRef, useState, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'

// Hyundai HiT-H450LE-FB Panel Specifications
export const PANEL_SPECS = {
  length: 1.762,     // m (X direction)
  width: 1.134,      // m (Y direction)
  thickness: 0.04,   // m
  cellColumns: 16,   // columns
  cellRows: 6,       // rows
  stringCount: 3     // internal strings
}

export const PLATFORM_SPECS = {
  tiltAngle: 13,           // degrees
  defaultConnectorLength: 1.320  // m (configurable)
}

// Visual settings
export const VISUAL_SETTINGS = {
  panelColor: '#1a1a2e',
  frameColor: '#2d3436',
  cellColor: '#0f0f1a',
  stringColors: ['#ff7675', '#74b9ff', '#00b894'],
  platformColor: '#E8E8E8',
  connectorColor: '#888888'
}


interface SmartSolarCellProps {
  position: [number, number, number]
  geometry: [number, number, number]
  baseColor: string
  cellId: string
}

function SmartSolarCell({ position, geometry, baseColor, cellId }: SmartSolarCellProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { scene } = useThree()
  const [shadowIntensity, setShadowIntensity] = useState(0)
  const frameCount = useRef(0)
  
  useFrame(() => {
    // Only check every 30 frames to reduce performance impact
    frameCount.current++
    if (frameCount.current % 30 !== 0) return
    
    if (meshRef.current) {
      // Find the directional light in the scene
      let directionalLight: THREE.DirectionalLight | null = null
      scene.traverse((child) => {
        if (child instanceof THREE.DirectionalLight) {
          directionalLight = child
        }
      })
      
      if (directionalLight && (directionalLight as THREE.DirectionalLight).intensity > 0) {
        // Get world position of this cell
        const worldPos = new THREE.Vector3()
        meshRef.current.getWorldPosition(worldPos)
        
        // Calculate direction from cell to light
        const lightDirection = new THREE.Vector3()
        lightDirection.subVectors(directionalLight.position, worldPos).normalize()
        
        // Single raycast from cell center to light
        const raycaster = new THREE.Raycaster()
        raycaster.set(worldPos, lightDirection)
        
        // Check for blocking objects
        const intersects = raycaster.intersectObjects(scene.children, true)
        
        // Find first significant blocking object
        const hasBlocker = intersects.some(hit => {
          if (hit.object === meshRef.current) return false // Skip self
          if (hit.distance < 0.1) return false // Too close, likely noise
          if (hit.distance > 50) return false // Too far to be relevant
          
          // Check if it's a substantial object
          const mesh = hit.object as THREE.Mesh
          if (mesh.geometry instanceof THREE.BoxGeometry) {
            const { width, height, depth } = mesh.geometry.parameters
            // Must be larger than a typical cell to cast meaningful shadows
            return width > 0.2 || height > 0.2 || depth > 0.2
          }
          
          return true // Non-box objects assumed to be substantial
        })
        
        setShadowIntensity(hasBlocker ? 1 : 0)
      } else {
        setShadowIntensity(0)
      }
    }
  })
  
  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow
      receiveShadow
    >
      <boxGeometry args={geometry} />
      <meshLambertMaterial 
        color={shadowIntensity > 0 ? '#FFFF00' : baseColor}
        opacity={shadowIntensity > 0 ? 0.6 : 0.8}
        transparent
      />
    </mesh>
  )
}

interface SolarPanelCellsProps {
  specs: typeof PANEL_SPECS
}

function SolarPanelCells({ specs }: SolarPanelCellsProps) {
  const cellWidth = specs.length / specs.cellColumns
  const cellHeight = specs.width / specs.cellRows
  const cellThickness = 0.005  // Made thicker so they're visible
  
  const cells = []

  // Create 96 cells (16x6 grid)
  for (let row = 0; row < specs.cellRows; row++) {
    for (let col = 0; col < specs.cellColumns; col++) {
      // Determine which string this cell belongs to - strings run horizontally (by rows)
      // String 0: rows 0-1, String 1: rows 2-3, String 2: rows 4-5
      let stringIndex = 0
      if (row >= 4) stringIndex = 2
      else if (row >= 2) stringIndex = 1
      
      // Calculate position relative to panel center - corrected for roof coordinates
      const x = (col * cellWidth) - (specs.length / 2) + (cellWidth / 2)
      const y = specs.thickness / 2 + cellThickness + 0.002  // Above the panel surface
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
  
  // Add string dividers (visual distinction between strings) - horizontal dividers
  // Dividers should be between rows where strings change
  const stringRowCounts = [2, 2, 2] // rows per string for 6 total rows, 3 strings
  let currentRow = 0
  
  for (let i = 0; i < specs.stringCount - 1; i++) {
    currentRow += stringRowCounts[i]
    // Position divider between currentRow-1 and currentRow
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

interface SolarPanelProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
}

export function SolarPanel({ position = [0, 0, 0], rotation = [0, 0, 0] }: SolarPanelProps) {
  const panelRef = useRef<THREE.Group>(null)
  
  return (
    <group ref={panelRef} position={position} rotation={rotation}>
      {/* Main panel frame - corrected for roof coordinates */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[PANEL_SPECS.length, PANEL_SPECS.thickness, PANEL_SPECS.width]} />
        <meshLambertMaterial color={VISUAL_SETTINGS.frameColor} />
      </mesh>
      
      {/* Panel surface */}
      <mesh 
        castShadow 
        receiveShadow 
        position={[0, PANEL_SPECS.thickness / 2 + 0.003, 0]}
      >
        <boxGeometry args={[PANEL_SPECS.length * 0.98, 0.005, PANEL_SPECS.width * 0.98]} />
        <meshLambertMaterial color={VISUAL_SETTINGS.panelColor} />
      </mesh>
      
      {/* Solar cells with string divisions */}
      <SolarPanelCells specs={PANEL_SPECS} />
    </group>
  )
}

interface PlatformProps {
  position?: [number, number, number]
  connectorLength?: number
  includePanel?: boolean
}

export function Platform({ 
  position = [0, 0, 0], 
  connectorLength = PLATFORM_SPECS.defaultConnectorLength,
  includePanel = true 
}: PlatformProps) {
  const platformRef = useRef<THREE.Group>(null)
  const tiltRadians = -(PLATFORM_SPECS.tiltAngle * Math.PI) / 180  // -13 degrees (negative to face front)
  
  // Calculate platform dimensions based on panel and tilt
  const platformLength = PANEL_SPECS.length + 0.1 // slightly larger than panel
  const platformWidth = PANEL_SPECS.width + 0.1
  const platformThickness = 0.05
  
  // Calculate height offset for tilted panel only
  const rearElevation = Math.sin(Math.abs(tiltRadians)) * PANEL_SPECS.width
  
  return (
    <group ref={platformRef} position={position}>
      {/* Platform base - flat on ground, not tilted */}
      <mesh 
        castShadow 
        receiveShadow 
        position={[0, 0, 0]}
      >
        <boxGeometry args={[platformLength, platformThickness, platformWidth]} />
        <meshLambertMaterial color={VISUAL_SETTINGS.platformColor} />
      </mesh>
      
      {/* Solar panel (if included) - front edge at front of platform, tilted upward */}
      {includePanel && (
        <SolarPanel 
          position={[0, rearElevation / 2 + platformThickness / 2 + PANEL_SPECS.thickness / 2, -(platformWidth - PANEL_SPECS.width) / 2]}
          rotation={[tiltRadians, 0, 0]}
        />
      )}
    </group>
  )
}

interface PlatformGridProps {
  position?: [number, number, number]
  rows?: number
  columns?: number
  connectorLength?: number
  includeAllPanels?: boolean
}

export function PlatformGrid({ 
  position = [0, 0, 0],
  rows = 6,
  columns = 1,
  connectorLength = PLATFORM_SPECS.defaultConnectorLength,
  includeAllPanels = true
}: PlatformGridProps) {
  const gridRef = useRef<THREE.Group>(null)
  
  const platforms = []
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      // Calculate position for each platform
      // X = east-west, Y = north-south, Z = height
      const x = col * (PANEL_SPECS.length + 0.2) // spacing between columns (east-west)
      const y = row * (PANEL_SPECS.width + connectorLength) // spacing between rows (north-south)
      const z = 0 // all at same height level
      
      platforms.push(
        <Platform
          key={`platform-${row}-${col}`}
          position={[x, y, z]}
          connectorLength={connectorLength}
          includePanel={includeAllPanels}
        />
      )
    }
  }
  
  return (
    <group ref={gridRef} position={position}>
      {platforms}
    </group>
  )
}

// Convenience component for positioning on the roof
interface RoofSolarInstallationProps {
  configuration?: {
    rows?: number
    columns?: number
    connectorLength?: number
  }
}

export default function RoofSolarInstallation({ 
  configuration = { rows: 6, columns: 1, connectorLength: PLATFORM_SPECS.defaultConnectorLength }
}: RoofSolarInstallationProps) {
  // This component will be placed inside the RoofObjects group, so it inherits the roof rotation
  // Use roof coordinates directly - no conversion needed
  const panels = []
  
  const rows = configuration.rows || 6
  const columns = configuration.columns || 1
  const connectorLength = configuration.connectorLength || PLATFORM_SPECS.defaultConnectorLength
  
  // Calculate spacing using shadow simulation formulas
  const W = PANEL_SPECS.width  // Panel short side (tilt axis): 1.134 m
  const beta = PLATFORM_SPECS.tiltAngle * Math.PI / 180  // Tilt angle in radians: 13°
  const H = W * Math.sin(beta)  // Rear-edge height: H = W·sinβ ≈ 0.255 m
  const D = W * Math.cos(beta)  // Projected panel depth on roof: D = W·cosβ ≈ 1.105 m
  const G = connectorLength - D  // Air gap: G = P - D (P is connector length)
  
  // Total spacing between panel centers = projected depth + air gap
  const panelSpacing = D + G
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      // Position relative to installation origin
      // First panel at row 0 should be at the front (z=0), others follow behind
      const x = col * (PANEL_SPECS.length + 0.2)
      const y = 0  
      const z = row * panelSpacing
      
      panels.push(
        <Platform
          key={`panel-${row}-${col}`}
          position={[x, y, z]}
          connectorLength={connectorLength}
          includePanel={true}
        />
      )
    }
  }
  
  // Add connectors between platforms (2 connectors on the sides per gap)
  const connectors = []
  for (let i = 0; i < rows - 1; i++) {
    // Position two connectors on the sides in the air gap between projected panel depths
    const connectorStart = i * panelSpacing + D
    const connectorEnd = (i + 1) * panelSpacing - D
    const connectorZ = (connectorStart + connectorEnd) / 2
    const sideOffset = PANEL_SPECS.length * 0.3 // Position on the sides
    
    // Left side connector
    connectors.push(
      <mesh
        key={`connector-${i}-left`}
        castShadow 
        receiveShadow 
        position={[-sideOffset, 0, connectorZ]}
      >
        <boxGeometry args={[0.05, 0.02, G]} />
        <meshLambertMaterial color={VISUAL_SETTINGS.connectorColor} />
      </mesh>
    )
    
    // Right side connector
    connectors.push(
      <mesh
        key={`connector-${i}-right`}
        castShadow 
        receiveShadow 
        position={[sideOffset, 0, connectorZ]}
      >
        <boxGeometry args={[0.05, 0.02, G]} />
        <meshLambertMaterial color={VISUAL_SETTINGS.connectorColor} />
      </mesh>
    )
  }
  
  return <group>{[...panels, ...connectors]}</group>
}