'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { houseSettings } from '@/config/houseSettings'
import RoofSolarInstallation from './SolarPanels'

interface Scene3DProps {
  sunPosition: {
    azimuth: number
    elevation: number
  }
}

function Roof() {
  const houseWidthX = houseSettings.dimensions.northSideLength
  const houseDepthZ = houseSettings.dimensions.westSideLength
  const heightY = houseSettings.dimensions.height
  const rotationFromNorth = houseSettings.orientation.rotationFromNorth * Math.PI / 180
  const roof = houseSettings.roof

  // Convert roof position from house-relative coordinates to Three.js center-relative
  const roofX = (roof.position.x + roof.dimensions.width / 2) - houseWidthX / 2   
  const roofZ = (roof.position.y + roof.dimensions.depth / 2) - houseDepthZ / 2   
  const roofY = heightY + roof.position.z + roof.dimensions.thickness / 2

  return (
    <group rotation={[0, rotationFromNorth, 0]}>
      {/* Main roof surface */}
      <mesh 
        castShadow 
        receiveShadow 
        position={[roofX, roofY, roofZ]}
      >
        <boxGeometry args={[roof.dimensions.width, roof.dimensions.thickness, roof.dimensions.depth]} />
        <meshLambertMaterial color={roof.color} />
      </mesh>

      {/* North Parapet - shortened to avoid west corner overlap */}
      {roof.parapet.sides.includes('north') && (
        <mesh 
          castShadow 
          receiveShadow 
          position={[roofX + roof.parapet.width / 2, heightY + roof.dimensions.thickness + roof.parapet.height / 2, roofZ - roof.dimensions.depth / 2 + roof.parapet.width / 2]}
        >
          <boxGeometry args={[roof.dimensions.width - roof.parapet.width, roof.parapet.height, roof.parapet.width]} />
          <meshLambertMaterial color="#CCCCCC" />
        </mesh>
      )}
      
      {/* South Parapet - shortened to avoid west corner overlap */}
      {roof.parapet.sides.includes('south') && (
        <mesh 
          castShadow 
          receiveShadow 
          position={[roofX + roof.parapet.width / 2, heightY + roof.dimensions.thickness + roof.parapet.height / 2, roofZ + roof.dimensions.depth / 2 - roof.parapet.width / 2]}
        >
          <boxGeometry args={[roof.dimensions.width - roof.parapet.width, roof.parapet.height, roof.parapet.width]} />
          <meshLambertMaterial color="#CCCCCC" />
        </mesh>
      )}
      
      {/* West Parapet */}
      {roof.parapet.sides.includes('west') && (
        <mesh 
          castShadow 
          receiveShadow 
          position={[roofX - roof.dimensions.width / 2 + roof.parapet.width / 2, heightY + roof.dimensions.thickness + roof.parapet.height / 2, roofZ]}
        >
          <boxGeometry args={[roof.parapet.width, roof.parapet.height, roof.dimensions.depth]} />
          <meshLambertMaterial color="#CCCCCC" />
        </mesh>
      )}
    </group>
  )
}

function RoofObjects() {
  const widthX = houseSettings.dimensions.northSideLength
  const depthZ = houseSettings.dimensions.westSideLength
  const heightY = houseSettings.dimensions.height
  const rotationFromNorth = houseSettings.orientation.rotationFromNorth * Math.PI / 180

  return (
    <group rotation={[0, rotationFromNorth, 0]}>
      {houseSettings.roofObjects.map((obj) => {
        // Convert from house-relative coordinates to Three.js coordinates
        // House center is at (0,0,0), so we need to offset from center
        const x = obj.position.x - widthX / 2   // convert from west-side distance to center-relative
        const z = obj.position.z - depthZ / 2   // convert from north-side distance to center-relative
        const y = heightY + houseSettings.roof.dimensions.thickness + obj.position.y + obj.dimensions.height / 2  // on top of roof + elevation + half object height

        return (
          <group key={obj.id}>
            {/* Main chimney box */}
            <mesh 
              castShadow 
              receiveShadow
              position={[x, y, z]}
            >
              <boxGeometry args={[obj.dimensions.width, obj.dimensions.height, obj.dimensions.depth]} />
              <meshLambertMaterial color={obj.color || '#8B4513'} />
            </mesh>
            
            {/* Chimney pipe if present */}
            {obj.pipe && (
              <mesh 
                castShadow 
                receiveShadow
                position={[
                  x + obj.pipe.position.x, 
                  y + obj.dimensions.height / 2 + obj.pipe.position.y + obj.pipe.height / 2, 
                  z + obj.pipe.position.z
                ]}
              >
                <cylinderGeometry args={[obj.pipe.diameter / 2, obj.pipe.diameter / 2, obj.pipe.height]} />
                <meshLambertMaterial color={obj.pipe.color || '#333333'} />
              </mesh>
            )}
          </group>
        )
      })}
      
      {/* Solar Panel Installation - positioned like chimney */}
      <group 
        position={[
          (0.15 + 0.1 + 1.762/2) - widthX / 2,  // 10cm from west parapet + half panel length, converted to center-relative
          heightY + houseSettings.roof.dimensions.thickness,  // on roof surface
          (0.1 + 1.134/2) - depthZ / 2   // 10cm from south edge + half panel width, converted to center-relative
        ]}
      >
        <RoofSolarInstallation 
          configuration={{
            rows: 6,
            columns: 1,
            connectorLength: 1.320
          }}
        />
      </group>
    </group>
  )
}

function House() {
  const houseRef = useRef<THREE.Group>(null)
  
  // In Three.js: X = east-west, Z = north-south, Y = up-down
  // westSideLength is the length of the side that FACES west (runs north-south)
  // northSideLength is the length of the side that FACES north (runs east-west)
  const widthX = houseSettings.dimensions.northSideLength  // 5.1m (runs east-west)
  const depthZ = houseSettings.dimensions.westSideLength   // 7.99m (runs north-south)
  const heightY = houseSettings.dimensions.height          // 3m (vertical)
  const rotationFromNorth = houseSettings.orientation.rotationFromNorth * Math.PI / 180

  return (
    <group ref={houseRef} rotation={[0, rotationFromNorth, 0]}>
      <mesh castShadow receiveShadow position={[0, heightY / 2, 0]}>
        <boxGeometry args={[widthX, heightY, depthZ]} />
        <meshLambertMaterial color="#8B4513" />
      </mesh>
      
      {/* Entrance on south side (positive Z direction) */}
      <mesh castShadow position={[0, 0.1, depthZ / 2 + 0.05]}>
        <boxGeometry args={[1.2, 0.2, 0.1]} />
        <meshLambertMaterial color="#654321" />
      </mesh>
      
      {/* Door frame on south side */}
      <mesh position={[0, heightY * 0.4, depthZ / 2 + 0.01]}>
        <boxGeometry args={[0.8, 1.8, 0.02]} />
        <meshLambertMaterial color="#2D1B14" />
      </mesh>
      
      {/* Door handle */}
      <mesh position={[0.3, heightY * 0.4, depthZ / 2 + 0.02]}>
        <sphereGeometry args={[0.03]} />
        <meshLambertMaterial color="#FFD700" />
      </mesh>
      
      {/* <mesh castShadow position={[0, houseHeight + 0.5, 0]}>
        <coneGeometry args={[Math.max(houseWidth, houseDepth) * 0.7, 1, 4]} />
        <meshLambertMaterial color="#654321" />
      </mesh> */}
    </group>
  )
}

function Ground() {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <planeGeometry args={[100, 100]} />
      <meshLambertMaterial color="#90EE90" />
    </mesh>
  )
}

function Compass() {
  return (
    <group position={[15, 0.1, 15]}>
      <mesh>
        <cylinderGeometry args={[2, 2, 0.1]} />
        <meshBasicMaterial color="#333333" />
      </mesh>
      
      {/* North arrow (red) - pointing up in view (negative Z) */}
      <mesh position={[0, 0.1, -1.5]}>
        <coneGeometry args={[0.2, 1, 3]} />
        <meshBasicMaterial color="#FF0000" />
      </mesh>
      
      {/* East arrow (gray) - pointing right in view (positive X) */}
      <mesh position={[1.5, 0.1, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.15, 0.8, 3]} />
        <meshBasicMaterial color="#CCCCCC" />
      </mesh>
    </group>
  )
}

export default function Scene3D({ sunPosition }: Scene3DProps) {
  const lightRef = useRef<THREE.DirectionalLight>(null)

  useFrame(() => {
    if (lightRef.current) {
      // Human perspective from above: North=up, East=right, West=left
      // So: North=-Z, East=+X, South=+Z, West=-X
      const azimuthRad = sunPosition.azimuth * Math.PI / 180
      const elevationRad = sunPosition.elevation * Math.PI / 180
      
      const distance = 50
      const x = distance * Math.cos(elevationRad) * Math.sin(azimuthRad) // East is RIGHT (positive X)
      const y = distance * Math.sin(elevationRad) // Up-Down
      const z = -distance * Math.cos(elevationRad) * Math.cos(azimuthRad) // North is UP (negative Z)
      
      lightRef.current.position.set(x, y, z)
      lightRef.current.target.position.set(0, 0, 0)
      lightRef.current.target.updateMatrixWorld()
    }
  })

  return (
    <>
      <ambientLight intensity={0.3} />
      
      <directionalLight
        ref={lightRef}
        intensity={sunPosition.elevation > 0 ? 0.8 : 0.0}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={0.1}
      />
      
      <Ground />
      <House />
      <Roof />
      <RoofObjects />
      <Compass />
      
      <gridHelper args={[50, 50, '#444444', '#888888']} />
    </>
  )
}