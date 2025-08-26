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

function getShadowColor(shadowIntensity: number, baseColor: string): string {
  if (shadowIntensity === 0) return baseColor
  if (shadowIntensity <= 0.2) return '#f0ffabff' // 20% shadow - light yellow
  if (shadowIntensity <= 0.4) return '#FFD700' // 40% shadow - gold
  if (shadowIntensity <= 0.6) return '#FFA500' // 60% shadow - orange
  if (shadowIntensity <= 0.8) return '#FF6347' // 80% shadow - tomato
  return '#8B0000' // 100% shadow - dark red
}

function getShadowOpacity(shadowIntensity: number): number {
  if (shadowIntensity === 0) return 0.8
  return 0.9 - (shadowIntensity * 0.3) // 0.9 to 0.6 opacity range (more shadow = more transparent)
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
      
      if (directionalLight) {
        const light = directionalLight as THREE.DirectionalLight
        if (light.intensity > 0) {
          const worldPos = new THREE.Vector3()
          meshRef.current!.getWorldPosition(worldPos)
          
          const lightDirection = new THREE.Vector3()
          const lightWorldPos = new THREE.Vector3()
          light.getWorldPosition(lightWorldPos)
          lightDirection.subVectors(lightWorldPos, worldPos).normalize()
          
          const halfWidth = geometry[0] / 2
          const halfHeight = geometry[1] / 2
          
          const cornerPositions = [
            new THREE.Vector3(worldPos.x - halfWidth, worldPos.y + halfHeight, worldPos.z),
            new THREE.Vector3(worldPos.x + halfWidth, worldPos.y + halfHeight, worldPos.z), 
            new THREE.Vector3(worldPos.x - halfWidth, worldPos.y - halfHeight, worldPos.z),
            new THREE.Vector3(worldPos.x + halfWidth, worldPos.y - halfHeight, worldPos.z)
          ]
          
          const raycaster = new THREE.Raycaster()
          
          const checkShadow = (position: THREE.Vector3) => {
            const rayDirection = new THREE.Vector3()
            rayDirection.subVectors(lightWorldPos, position).normalize()
            raycaster.set(position, rayDirection)
            
            const intersects = raycaster.intersectObjects(scene.children, true)
            
            return intersects.some(hit => {
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
          }
          
          let shadowedPoints = 0
          
          for (const cornerPos of cornerPositions) {
            if (checkShadow(cornerPos)) {
              shadowedPoints++
            }
          }
          
          if (shadowedPoints > 0) {
            if (checkShadow(worldPos)) {
              shadowedPoints++
            }
          }
          
          setShadowIntensity(shadowedPoints / 5)
        } else {
          setShadowIntensity(0)
        }
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
        color={getShadowColor(shadowIntensity, baseColor)}
        opacity={getShadowOpacity(shadowIntensity)}
        transparent
      />
    </mesh>
  )
}