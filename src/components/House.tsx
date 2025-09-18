'use client'

import { useRef } from 'react'
import * as THREE from 'three'
import { houseSettings } from '@/config/houseSettings'
import EnergyStorageSystem from './EnergyStorageSystem'
import WoodenShell from './WoodenShell'
import { WoodenShellCalculationService } from '@/services/WoodenShellCalculationService'

export default function House() {
  const houseRef = useRef<THREE.Group>(null)

  // In Three.js: X = east-west, Z = north-south, Y = up-down
  // westSideLength is the length of the side that FACES west (runs north-south)
  // northSideLength is the length of the side that FACES north (runs east-west)
  const widthX = houseSettings.dimensions.northSideLength  // runs east-west
  const depthZ = houseSettings.dimensions.westSideLength   // runs north-south
  const heightY = houseSettings.dimensions.height          // runs vertical
  const rotationFromNorth = houseSettings.orientation.rotationFromNorth * Math.PI / 180

  // Calculate WoodenShell configuration
  const shellConfig = WoodenShellCalculationService.calculateShellConfiguration(houseSettings.energyStorage)

  return (
    <group ref={houseRef} rotation={[0, rotationFromNorth, 0]} position={[-widthX / 2, 0, -depthZ / 2]}>
      <mesh castShadow receiveShadow position={[widthX / 2, heightY / 2, depthZ / 2]}>
        <boxGeometry args={[widthX, heightY, depthZ]} />
        <meshLambertMaterial color="#8B4513" />
      </mesh>

      {/* Entrance on south side */}
      <mesh castShadow position={[widthX / 2, 0.1, depthZ + 0.05]}>
        <boxGeometry args={[1.2, 0.2, 0.1]} />
        <meshLambertMaterial color="#654321" />
      </mesh>

      {/* Door frame on south side */}
      <mesh position={[widthX / 2, heightY * 0.4, depthZ + 0.01]}>
        <boxGeometry args={[0.8, 1.8, 0.02]} />
        <meshLambertMaterial color="#2D1B14" />
      </mesh>

      {/* Door handle */}
      <mesh position={[widthX / 2 + 0.3, heightY * 0.4, depthZ + 0.02]}>
        <sphereGeometry args={[0.03]} />
        <meshLambertMaterial color="#FFD700" />
      </mesh>

      {/* Energy Storage System on north wall */}
      <EnergyStorageSystem />

      {/* Wooden Shell for battery enclosure */}
      <WoodenShell configuration={shellConfig} />

      {/* <mesh castShadow position={[0, houseHeight + 0.5, 0]}>
        <coneGeometry args={[Math.max(houseWidth, houseDepth) * 0.7, 1, 4]} />
        <meshLambertMaterial color="#654321" />
      </mesh> */}
    </group>
  )
}