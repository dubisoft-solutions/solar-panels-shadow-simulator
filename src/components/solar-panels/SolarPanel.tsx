'use client'

import { useRef } from 'react'
import * as THREE from 'three'
import { SolarPanelCells } from './SolarPanelCells'
import { PANEL_SPECS, VISUAL_SETTINGS } from '@/config/solarPanelInstallationSettings'
import { PanelSpacingService } from '@/services/PanelSpacingService'

interface SolarPanelProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
  orientation?: 'landscape' | 'portrait'
}

export function SolarPanel({ position = [0, 0, 0], rotation = [0, 0, 0], orientation = 'landscape' }: SolarPanelProps) {
  const panelRef = useRef<THREE.Group>(null)

  const panelDimensions = PanelSpacingService.getPanelDimensions(PANEL_SPECS, orientation)

  return (
    <group ref={panelRef} position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[panelDimensions.length, panelDimensions.thickness, panelDimensions.width]} />
        <meshLambertMaterial color={VISUAL_SETTINGS.frameColor} />
      </mesh>
      
      <mesh 
        castShadow 
        receiveShadow 
        position={[0, panelDimensions.thickness / 2 + 0.003, 0]}
      >
        <boxGeometry args={[panelDimensions.length * 0.98, 0.005, panelDimensions.width * 0.98]} />
        <meshLambertMaterial color={VISUAL_SETTINGS.panelColor} />
      </mesh>

      <SolarPanelCells specs={PANEL_SPECS} orientation={orientation} />
    </group>
  )
}