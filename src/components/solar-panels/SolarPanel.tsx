'use client'

import { useRef } from 'react'
import * as THREE from 'three'
import { SolarPanelCells } from './SolarPanelCells'
import { PANEL_SPECS, VISUAL_SETTINGS } from '@/config/solarPanelInstallationSettings'

interface SolarPanelProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
}

export function SolarPanel({ position = [0, 0, 0], rotation = [0, 0, 0] }: SolarPanelProps) {
  const panelRef = useRef<THREE.Group>(null)
  
  return (
    <group ref={panelRef} position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[PANEL_SPECS.length, PANEL_SPECS.thickness, PANEL_SPECS.width]} />
        <meshLambertMaterial color={VISUAL_SETTINGS.frameColor} />
      </mesh>
      
      <mesh 
        castShadow 
        receiveShadow 
        position={[0, PANEL_SPECS.thickness / 2 + 0.003, 0]}
      >
        <boxGeometry args={[PANEL_SPECS.length * 0.98, 0.005, PANEL_SPECS.width * 0.98]} />
        <meshLambertMaterial color={VISUAL_SETTINGS.panelColor} />
      </mesh>
      
      <SolarPanelCells specs={PANEL_SPECS} />
    </group>
  )
}