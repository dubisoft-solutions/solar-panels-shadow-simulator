'use client'

import * as THREE from 'three'
import { useRef, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'

interface SmartSolarCellProps {
  position: [number, number, number]
  geometry: [number, number, number]
  baseColor: string
  cellId: string
}

export function SmartSolarCell({ position, geometry, baseColor, cellId }: SmartSolarCellProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { scene } = useThree()
  const [shadowIntensity, setShadowIntensity] = useState(0)
  const frameCount = useRef(0)
  
  useFrame(() => {
    frameCount.current++
    if (frameCount.current % 30 !== 0) return
    
    if (meshRef.current) {
      let directionalLight: THREE.DirectionalLight | null = null
      scene.traverse((child) => {
        if (child instanceof THREE.DirectionalLight) {
          directionalLight = child
        }
      })
      
      if (directionalLight && (directionalLight as THREE.DirectionalLight).intensity > 0) {
        const worldPos = new THREE.Vector3()
        meshRef.current.getWorldPosition(worldPos)
        
        const lightDirection = new THREE.Vector3()
        lightDirection.subVectors(directionalLight.position, worldPos).normalize()
        
        const raycaster = new THREE.Raycaster()
        raycaster.set(worldPos, lightDirection)
        
        const intersects = raycaster.intersectObjects(scene.children, true)
        
        const hasBlocker = intersects.some(hit => {
          if (hit.object === meshRef.current) return false
          if (hit.distance < 0.1) return false
          if (hit.distance > 50) return false
          
          const mesh = hit.object as THREE.Mesh
          if (mesh.geometry instanceof THREE.BoxGeometry) {
            const { width, height, depth } = mesh.geometry.parameters
            return width > 0.2 || height > 0.2 || depth > 0.2
          }
          
          return true
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