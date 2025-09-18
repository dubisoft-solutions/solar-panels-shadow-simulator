'use client'

import React, { useMemo } from 'react'
import * as THREE from 'three'
import { houseSettings } from '@/config/houseSettings'

// Create a simple canvas with text and return as texture
function createTextTexture(text: string): THREE.Texture {
  const canvas = document.createElement('canvas')
  canvas.width = 400
  canvas.height = 100
  const ctx = canvas.getContext('2d')!
  
  // Red background
  ctx.fillStyle = '#cdb9b9'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // Text
  ctx.fillStyle = '#393333'
  ctx.font = 'bold 32px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2)
  
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  texture.flipY = true
  return texture
}

interface WallMountProps {
  position: [number, number, number]
  width: number
  height: number
  depth: number
  blockZPosition: number // Position for mounting blocks relative to wall mount center
}

function WallMount({ position, width, height, depth, blockZPosition }: WallMountProps) {
  return (
    <group position={position}>
      {/* Four small corner mounting blocks */}
      <mesh castShadow receiveShadow position={[-width/2 + 0.025, height/2 - 0.025, blockZPosition]}>
        <boxGeometry args={[0.05, 0.05, depth]} />
        <meshLambertMaterial color="#404040" />
      </mesh>
      <mesh castShadow receiveShadow position={[width/2 - 0.025, height/2 - 0.025, blockZPosition]}>
        <boxGeometry args={[0.05, 0.05, depth]} />
        <meshLambertMaterial color="#404040" />
      </mesh>
      <mesh castShadow receiveShadow position={[-width/2 + 0.025, -height/2 + 0.025, blockZPosition]}>
        <boxGeometry args={[0.05, 0.05, depth]} />
        <meshLambertMaterial color="#404040" />
      </mesh>
      <mesh castShadow receiveShadow position={[width/2 - 0.025, -height/2 + 0.025, blockZPosition]}>
        <boxGeometry args={[0.05, 0.05, depth]} />
        <meshLambertMaterial color="#404040" />
      </mesh>
    </group>
  )
}

interface BatteryUnitProps {
  position: [number, number, number]
  unitNumber: number
}

function BatteryUnit({ position }: BatteryUnitProps) {
  const { battery, mounting } = houseSettings.energyStorage
  
  // Create text texture using canvas
  const labelTexture = useMemo(() => createTextTexture('SMILE-G3-BAT-3.8S'), [])
  
  // Calculate mounting block position: from wall mount center to equipment back face
  const blockZPosition = mounting.wallOffset/2 + battery.dimensions.depth/2
  
  return (
    <group position={position}>
      {/* Wall mount system */}
      <WallMount 
        position={[0, 0, 0]} 
        width={battery.dimensions.width}
        height={battery.dimensions.height}
        depth={mounting.wallOffset}
        blockZPosition={blockZPosition}
      />
      
      {/* Battery unit */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[
          battery.dimensions.width, 
          battery.dimensions.height, 
          battery.dimensions.depth  // Use actual battery depth from settings
        ]} />
        <meshLambertMaterial color={battery.color} />
      </mesh>
      
      {/* Battery label with actual text - on back face (toward wall) */}
      <mesh position={[0, 0, -battery.dimensions.depth/2 - 0.001]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.3, 0.075]} />
        <meshBasicMaterial map={labelTexture} />
      </mesh>
      
      {/* LED indicator - on back face, top right */}
      <mesh position={[battery.dimensions.width/2 - 0.03, battery.dimensions.height/2 - 0.03, -battery.dimensions.depth/2 - 0.001]}>
        <boxGeometry args={[0.02, 0.02, 0.004]} />
        <meshLambertMaterial color="#00FF00" />
      </mesh>
    </group>
  )
}

interface InverterUnitProps {
  position: [number, number, number]
}

function InverterUnit({ position }: InverterUnitProps) {
  const { inverter, mounting } = houseSettings.energyStorage
  
  // Create text texture using canvas
  const logoTexture = useMemo(() => createTextTexture('AlphaESS SMILE-G3'), [])
  
  // Calculate mounting block position: from wall mount center to equipment back face
  const blockZPosition = mounting.wallOffset/2 + inverter.dimensions.depth/2
  
  return (
    <group position={position}>
      {/* Wall mount system */}
      <WallMount 
        position={[0, 0, 0]} 
        width={inverter.dimensions.width}
        height={inverter.dimensions.height}
        depth={mounting.wallOffset}
        blockZPosition={blockZPosition}
      />
      
      {/* Inverter unit */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[
          inverter.dimensions.width, 
          inverter.dimensions.height, 
          inverter.dimensions.depth  // Use actual inverter depth from settings
        ]} />
        <meshLambertMaterial color={inverter.color} />
      </mesh>
      
      {/* Inverter display/panel - on back face (toward wall) */}
      <mesh position={[0, 0.05, -inverter.dimensions.depth/2 - 0.001]}>
        <boxGeometry args={[0.25, 0.15, 0.004]} />
        <meshLambertMaterial color="#000000" />
      </mesh>
      
      {/* AlphaEss logo - on back face (toward wall) */}
      <mesh position={[0, -0.08, -inverter.dimensions.depth/2 - 0.001]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.35, 0.08]} />
        <meshBasicMaterial map={logoTexture} />
      </mesh>
    </group>
  )
}


export default function EnergyStorageSystem() {
  const { energyStorage } = houseSettings
  const { position, batteryCount, battery, inverter, mounting } = energyStorage
  
  // Calculate positions for each unit (stack from bottom up)
  const units: React.JSX.Element[] = []
  
  // Add batteries from bottom up
  let currentY = position.y + battery.dimensions.height / 2
  for (let i = 0; i < batteryCount; i++) {
    const batteryPosition: [number, number, number] = [
      position.x + battery.dimensions.width / 2,
      currentY,
      position.z - (battery.dimensions.depth + mounting.wallOffset) / 2  // Total depth from wall surface
    ]
    
    units.push(
      <BatteryUnit 
        key={`battery-${i + 1}`}
        position={batteryPosition}
        unitNumber={i + 1}
      />
    )
    
    currentY += battery.dimensions.height + mounting.unitSpacing
  }
  
  // Add inverter on top 
  // currentY is positioned where the next battery center would be
  // We want the inverter to sit with minimal gap on top of the last battery
  const inverterPosition: [number, number, number] = [
    position.x + inverter.dimensions.width / 2,
    currentY - (battery.dimensions.height / 2) + (inverter.dimensions.height / 2),
    position.z - (inverter.dimensions.depth + mounting.wallOffset) / 2
  ]
  
  units.push(
    <InverterUnit 
      key="inverter"
      position={inverterPosition}
    />
  )
  
  return (
    <group>
      {units}
    </group>
  )
}