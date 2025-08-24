'use client'

import { useRef } from 'react'
import * as THREE from 'three'
import { SolarPanel } from './SolarPanel'
import { PANEL_SPECS, LANDSCAPE_PLATFORM_SPECS, VISUAL_SETTINGS } from '@/config/solarPanelInstallationSettings'

interface PlatformProps {
  position?: [number, number, number]
  dimensions?: {
    length: number
    width: number
    thickness: number
  }
  tiltAngle?: number
  includePanel?: boolean
}

export function Platform({ 
  position = [0, 0, 0], 
  dimensions = {
    length: PANEL_SPECS.length,
    width: PANEL_SPECS.width,
    thickness: 0.05
  },
  tiltAngle = LANDSCAPE_PLATFORM_SPECS.tiltAngle,
  includePanel = true 
}: PlatformProps) {
  const platformRef = useRef<THREE.Group>(null)
  const tiltRadians = -(tiltAngle * Math.PI) / 180
  
  const rearElevation = Math.sin(Math.abs(tiltRadians)) * PANEL_SPECS.width
  
  return (
    <group ref={platformRef} position={position}>
      <mesh 
        castShadow 
        receiveShadow 
        position={[0, 0, 0]}
      >
        <boxGeometry args={[dimensions.length, dimensions.thickness, dimensions.width]} />
        <meshLambertMaterial color={VISUAL_SETTINGS.platformColor} />
      </mesh>
      
      {includePanel && (
        <SolarPanel 
          position={[0, dimensions.thickness / 2 + rearElevation / 2 + PANEL_SPECS.thickness / 2, -(PANEL_SPECS.width / 2) + (dimensions.width / 2)]}
          rotation={[tiltRadians, 0, 0]}
        />
      )}
    </group>
  )
}