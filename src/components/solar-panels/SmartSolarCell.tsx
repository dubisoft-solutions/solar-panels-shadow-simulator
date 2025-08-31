'use client'

import * as THREE from 'three'
import { useRef, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'

interface SmartSolarCellProps {
  position: [number, number, number]
  geometry: [number, number, number]
  baseColor: string
  cellId: string
  debugRays?: boolean
}

function getShadowColor(shadowIntensity: number, baseColor: string): string {
  if (shadowIntensity === 0) return baseColor
  if (shadowIntensity <= 0.25) return '#FFFF00' // 1/4 points - bright yellow
  if (shadowIntensity <= 0.5) return '#faa63f' // 2/4 points - dark orange  
  if (shadowIntensity <= 0.75) return '#d9913a' // 3/4 points - deep pink
  if (shadowIntensity <= 0.95) return '#b59267' // 4/4 points - blue violet
  return '#000000' // 5/5 points - black
}

function getShadowOpacity(shadowIntensity: number): number {
  if (shadowIntensity === 0) return 0.8
  return 0.9 - (shadowIntensity * 0.3) // 0.9 to 0.6 opacity range (more shadow = more transparent)
}

export function SmartSolarCell({ position, geometry, baseColor, cellId, debugRays = false }: SmartSolarCellProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { scene } = useThree()
  const [shadowIntensity, setShadowIntensity] = useState(0)
  const frameCount = useRef(0)
  const debugRaysRef = useRef<THREE.Line[]>([])
  
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
          light.getWorldDirection(lightDirection)
          lightDirection.negate() // Point towards the light
          
          
          const raycaster = new THREE.Raycaster()
          
          const lightWorldPos = new THREE.Vector3()
          light.getWorldPosition(lightWorldPos)
          
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
          
          // Use bounding box approach for reliable corner calculation
          const mesh = meshRef.current!
          mesh.updateMatrixWorld()
          
          // Step 1: get the geometry's bounding box in local space
          const geometry = mesh.geometry
          geometry.computeBoundingBox()
          const bbox = geometry.boundingBox!
          
          
          // Step 2: define the 4 corners - top at max.z, bottom at min.z for separation
          const localCorners = [
            new THREE.Vector3(bbox.min.x, bbox.min.y, bbox.max.z), // top-left (high Z)
            new THREE.Vector3(bbox.max.x, bbox.min.y, bbox.max.z), // top-right (high Z)  
            new THREE.Vector3(bbox.min.x, bbox.max.y, bbox.min.z), // bottom-left (low Z)
            new THREE.Vector3(bbox.max.x, bbox.max.y, bbox.min.z), // bottom-right (low Z)
          ]
          
          // Step 3: transform to world space
          const worldCorners = localCorners.map(corner =>
            corner.clone().applyMatrix4(mesh.matrixWorld)
          )
          
          // Sample points: top-left, top-right, center, bottom-left, bottom-right
          const samplePoints = [
            worldCorners[0], // Top-left
            worldCorners[1], // Top-right  
            worldPos.clone(), // Center
            worldCorners[2], // Bottom-left
            worldCorners[3], // Bottom-right
          ]
          
          let shadowedPoints = 0
          
          for (const samplePoint of samplePoints) {
            if (checkShadow(samplePoint)) {
              shadowedPoints++
            }
          }
          
          // Clear existing debug rays from scene
          debugRaysRef.current.forEach(ray => {
            scene.remove(ray)
            ray.geometry.dispose()
            if (ray.material instanceof THREE.Material) {
              ray.material.dispose()
            }
          })
          debugRaysRef.current = []
          
          // Create debug rays only if enabled
          if (debugRays) {
            const rayLength = 1.0
            
            samplePoints.forEach((point, index) => {
              // Use the exact same ray direction as in checkShadow function
              const rayDirection = new THREE.Vector3()
              rayDirection.subVectors(lightWorldPos, point).normalize()
              const rayEnd = point.clone().add(rayDirection.clone().multiplyScalar(rayLength))
              
              // Create line geometry
              const points = [point, rayEnd]
              const lineGeometry = new THREE.BufferGeometry().setFromPoints(points)
              
              // Different colors for different points to help identify them
              const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'] // Red, Green, Blue, Yellow, Magenta
              const lineMaterial = new THREE.LineBasicMaterial({ 
                color: colors[index % colors.length],
                opacity: 0.8,
                transparent: true
              })
              
              const line = new THREE.Line(lineGeometry, lineMaterial)
              // Add directly to scene to maintain world space positioning
              scene.add(line)
              debugRaysRef.current.push(line)
            })
          }
          
          const intensity = shadowedPoints / samplePoints.length
          
          // Debug logging to track the issue
          console.log(`Cell ${cellId}: frame=${frameCount.current}, intensity=${intensity.toFixed(3)}, light=(${lightWorldPos.x.toFixed(1)},${lightWorldPos.y.toFixed(1)},${lightWorldPos.z.toFixed(1)})`)
          
          setShadowIntensity(intensity)
        } else {
          setShadowIntensity(0)
        }
      } else {
        setShadowIntensity(0)
      }
    }
  })
  
  const handleClick = () => {
    console.log(`Clicked cell: ${cellId}, shadowIntensity: ${shadowIntensity}`)
    
    if (meshRef.current) {
      const mesh = meshRef.current
      const geometry3d = mesh.geometry as THREE.BoxGeometry
      const { width, height, depth } = geometry3d.parameters
      console.log(`Cell ${cellId} dimensions: width=${width}, height=${height}, depth=${depth}`)
      
      // Log the corner positions
      const localCorners = [
        new THREE.Vector3(-width/2, -height/2, depth/2),
        new THREE.Vector3(width/2, -height/2, depth/2), 
        new THREE.Vector3(-width/2, height/2, depth/2),
        new THREE.Vector3(width/2, height/2, depth/2),
      ]
      
      mesh.updateMatrixWorld()
      const corners = localCorners.map((corner) => 
        corner.clone().applyMatrix4(mesh.matrixWorld)
      )
      
      console.log(`Cell ${cellId} corners:`)
      console.log(`  Top-left: (${corners[0].x.toFixed(3)}, ${corners[0].y.toFixed(3)}, ${corners[0].z.toFixed(3)})`)
      console.log(`  Top-right: (${corners[1].x.toFixed(3)}, ${corners[1].y.toFixed(3)}, ${corners[1].z.toFixed(3)})`)
      console.log(`  Bottom-left: (${corners[2].x.toFixed(3)}, ${corners[2].y.toFixed(3)}, ${corners[2].z.toFixed(3)})`)
      console.log(`  Bottom-right: (${corners[3].x.toFixed(3)}, ${corners[3].y.toFixed(3)}, ${corners[3].z.toFixed(3)})`)
    }
  }

  return (
    <mesh
      ref={meshRef}
      position={position}
      castShadow
      receiveShadow
      onClick={handleClick}
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