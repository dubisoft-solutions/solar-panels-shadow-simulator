'use client'

import React from 'react'
import * as THREE from 'three'
import { houseSettings } from '@/config/houseSettings'
import { CoordinateTransformationService } from '@/services/CoordinateTransformationService'

interface WallMountProps {
  position: [number, number, number]
  width: number
  height: number
}

function WallMount({ position, width, height }: WallMountProps) {
  return (
    <group position={position}>
      {/* Wall mounting bracket - flat against wall */}
      <mesh castShadow receiveShadow position={[0, 0, -0.002]}>
        <boxGeometry args={[width + 0.1, height, 0.004]} />
        <meshLambertMaterial color="#2C2C2C" />
      </mesh>
      
      {/* Left support rail */}
      <mesh castShadow receiveShadow position={[-width/2 + 0.02, 0, 0.015]}>
        <boxGeometry args={[0.04, height, 0.025]} />
        <meshLambertMaterial color="#404040" />
      </mesh>
      
      {/* Right support rail */}
      <mesh castShadow receiveShadow position={[width/2 - 0.02, 0, 0.015]}>
        <boxGeometry args={[0.04, height, 0.025]} />
        <meshLambertMaterial color="#404040" />
      </mesh>
      
      {/* Top support rail */}
      <mesh castShadow receiveShadow position={[0, height/2 - 0.015, 0.015]}>
        <boxGeometry args={[width - 0.08, 0.03, 0.025]} />
        <meshLambertMaterial color="#404040" />
      </mesh>
      
      {/* Bottom support rail */}
      <mesh castShadow receiveShadow position={[0, -height/2 + 0.015, 0.015]}>
        <boxGeometry args={[width - 0.08, 0.03, 0.025]} />
        <meshLambertMaterial color="#404040" />
      </mesh>
    </group>
  )
}

interface BatteryUnitProps {
  position: [number, number, number]
  unitNumber: number
}

function BatteryUnit({ position, unitNumber }: BatteryUnitProps) {
  const { battery, mounting } = houseSettings.energyStorage
  
  return (
    <group position={position}>
      {/* Wall mount system */}
      <WallMount 
        position={[0, 0, -mounting.wallOffset/2]} 
        width={battery.dimensions.width}
        height={battery.dimensions.height}
      />
      
      {/* Battery unit */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[
          battery.dimensions.width, 
          battery.dimensions.height, 
          0.260  // Total depth including mounting: 260mm
        ]} />
        <meshLambertMaterial color={battery.color} />
      </mesh>
      
      {/* Battery label background */}
      <mesh position={[0, 0, -(battery.dimensions.depth + mounting.wallOffset)/2 - 0.002]}>
        <boxGeometry args={[0.35, 0.08, 0.004]} />
        <meshLambertMaterial color="#FFFFFF" />
      </mesh>
      
      {/* Battery model text - temporarily disabled */}
      <mesh position={[0, 0.01, -(battery.dimensions.depth + mounting.wallOffset)/2 - 0.003]}>
        <boxGeometry args={[0.25, 0.015, 0.005]} />
        <meshLambertMaterial color="#333333" />
      </mesh>
      <mesh position={[0, -0.02, -(battery.dimensions.depth + mounting.wallOffset)/2 - 0.003]}>
        <boxGeometry args={[0.2, 0.012, 0.005]} />
        <meshLambertMaterial color="#666666" />
      </mesh>
      
      {/* LED indicator - on the right side */}
      <mesh position={[-battery.dimensions.width/2 + 0.03, battery.dimensions.height/2 - 0.03, -(battery.dimensions.depth + mounting.wallOffset)/2 - 0.002]}>
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
  
  return (
    <group position={position}>
      {/* Wall mount system */}
      <WallMount 
        position={[0, 0, -mounting.wallOffset/2]} 
        width={inverter.dimensions.width}
        height={inverter.dimensions.height}
      />
      
      {/* Inverter unit */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[
          inverter.dimensions.width, 
          inverter.dimensions.height, 
          0.260  // Total depth including mounting: 260mm
        ]} />
        <meshLambertMaterial color={inverter.color} />
      </mesh>
      
      {/* Inverter display/panel */}
      <mesh position={[0, 0.05, -(inverter.dimensions.depth + mounting.wallOffset)/2 - 0.002]}>
        <boxGeometry args={[0.25, 0.15, 0.004]} />
        <meshLambertMaterial color="#000000" />
      </mesh>
      
      {/* AlphaEss logo area */}
      <mesh position={[0, -0.08, -(inverter.dimensions.depth + mounting.wallOffset)/2 - 0.003]}>
        <boxGeometry args={[0.35, 0.06, 0.005]} />
        <meshLambertMaterial color="#FF6600" />
      </mesh>
      
      {/* AlphaEss logo text - temporarily disabled */}
      <mesh position={[0, -0.08, -(inverter.dimensions.depth + mounting.wallOffset)/2 - 0.004]}>
        <boxGeometry args={[0.25, 0.015, 0.005]} />
        <meshLambertMaterial color="#FFFFFF" />
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
      position.z + (battery.dimensions.depth + mounting.wallOffset) / 2  // Total depth from wall surface
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
    position.z + (inverter.dimensions.depth + mounting.wallOffset) / 2  // Total depth from wall surface
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