'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { houseSettings } from '@/config/houseSettings'
import RoofSolarInstallation, { PANEL_SPECS } from './SolarPanels'
import { CoordinateTransformationService } from '@/services/CoordinateTransformationService'

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

  // Edge-based position from config (business logic)
  const roofEdgePosition = {
    x: roof.position.x,
    y: heightY + roof.position.z,  // house height + roof elevation
    z: roof.position.y
  }

  return (
    <group rotation={[0, rotationFromNorth, 0]} position={[-houseWidthX / 2, 0, -houseDepthZ / 2]}>
      {/* Main roof surface */}
      <mesh 
        castShadow 
        receiveShadow 
        position={CoordinateTransformationService.edgeToThreeJs(
          roofEdgePosition,
          {
            width: roof.dimensions.width,
            height: roof.dimensions.thickness,
            depth: roof.dimensions.depth
          }
        )}
      >
        <boxGeometry args={[roof.dimensions.width, roof.dimensions.thickness, roof.dimensions.depth]} />
        <meshLambertMaterial color={roof.color} />
      </mesh>

      {/* North Parapet - shortened to avoid west corner overlap */}
      {roof.parapet.sides.includes('north') && (() => {
        const parapetEdgePos = {
          x: roof.position.x + roof.parapet.width / 2,
          y: heightY + roof.dimensions.thickness,
          z: roof.position.y - roof.parapet.width / 2
        }
        return (
          <mesh 
            castShadow 
            receiveShadow 
            position={CoordinateTransformationService.edgeToThreeJs(
              parapetEdgePos,
              { width: roof.dimensions.width - roof.parapet.width, height: roof.parapet.height, depth: roof.parapet.width }
            )}
          >
            <boxGeometry args={[roof.dimensions.width - roof.parapet.width, roof.parapet.height, roof.parapet.width]} />
            <meshLambertMaterial color="#CCCCCC" />
          </mesh>
        )
      })()}
      
      {/* South Parapet - shortened to avoid west corner overlap */}
      {roof.parapet.sides.includes('south') && (() => {
        const parapetEdgePos = {
          x: roof.position.x + roof.parapet.width / 2,
          y: heightY + roof.dimensions.thickness,
          z: roof.position.y + roof.dimensions.depth - roof.parapet.width
        }
        return (
          <mesh 
            castShadow 
            receiveShadow 
            position={CoordinateTransformationService.edgeToThreeJs(
              parapetEdgePos,
              { width: roof.dimensions.width - roof.parapet.width, height: roof.parapet.height, depth: roof.parapet.width }
            )}
          >
            <boxGeometry args={[roof.dimensions.width - roof.parapet.width, roof.parapet.height, roof.parapet.width]} />
            <meshLambertMaterial color="#CCCCCC" />
          </mesh>
        )
      })()}
      
      {/* West Parapet */}
      {roof.parapet.sides.includes('west') && (() => {
        const parapetEdgePos = {
          x: roof.position.x,
          y: heightY + roof.dimensions.thickness,
          z: roof.position.y
        }
        return (
          <mesh 
            castShadow 
            receiveShadow 
            position={CoordinateTransformationService.edgeToThreeJs(
              parapetEdgePos,
              { width: roof.parapet.width, height: roof.parapet.height, depth: roof.dimensions.depth }
            )}
          >
            <boxGeometry args={[roof.parapet.width, roof.parapet.height, roof.dimensions.depth]} />
            <meshLambertMaterial color="#CCCCCC" />
          </mesh>
        )
      })()}
      
      {/* Roof Objects - now nested inside roof coordinate system */}
      <RoofObjects />
    </group>
  )
}

function RoofObjects() {
  const roofThickness = houseSettings.roof.dimensions.thickness
  const houseHeight = houseSettings.dimensions.height

  return (
    <>
      {houseSettings.roofObjects.map((obj) => {
        // Edge-based position from config (business logic)
        const edgePosition = {
          x: obj.position.x,  // distance from roof west edge
          y: houseHeight + roofThickness + obj.position.y, // house height + above roof surface + elevation
          z: obj.position.z   // distance from roof north edge
        }
        
        // Transform to center-based position using service
        const centerPosition = CoordinateTransformationService.edgeToCenter(
          edgePosition,
          {
            width: obj.dimensions.width,
            height: obj.dimensions.height,
            depth: obj.dimensions.depth
          }
        )

        return (
          <group key={obj.id}>
            {/* Main chimney box */}
            <mesh 
              castShadow 
              receiveShadow
              position={CoordinateTransformationService.toThreeJsPosition(centerPosition)}
            >
              <boxGeometry args={[obj.dimensions.width, obj.dimensions.height, obj.dimensions.depth]} />
              <meshLambertMaterial color={obj.color || '#8B4513'} />
            </mesh>
            
            {/* Chimney pipe if present */}
            {obj.pipe && (
              (() => {
                // Calculate pipe position relative to chimney center
                const pipeEdgePosition = {
                  x: edgePosition.x + obj.pipe.position.x,
                  y: edgePosition.y + obj.dimensions.height + obj.pipe.position.y,
                  z: edgePosition.z + obj.pipe.position.z
                }
                
                const pipeCenterPosition = CoordinateTransformationService.edgeToCenter(
                  pipeEdgePosition,
                  {
                    width: obj.pipe.diameter,
                    height: obj.pipe.height,
                    depth: obj.pipe.diameter
                  }
                )
                
                return (
                  <mesh 
                    castShadow 
                    receiveShadow
                    position={CoordinateTransformationService.toThreeJsPosition(pipeCenterPosition)}
                  >
                    <cylinderGeometry args={[obj.pipe.diameter / 2, obj.pipe.diameter / 2, obj.pipe.height]} />
                    <meshLambertMaterial color={obj.pipe.color || '#333333'} />
                  </mesh>
                )
              })()
            )}
          </group>
        )
      })}
      
      {/* Solar Panel Installation - using service layer for positioning */}
      {(() => {
        // Edge-based position calculation (business logic)
        const installationEdgePosition = {
          x: 0.1 + 0.15 + PANEL_SPECS.length,  // 10cm from west parapet (15cm parapet + 10cm gap)
          y: houseHeight + roofThickness,  // house height + on roof surface  
          z: houseSettings.roof.position.y + houseSettings.roof.dimensions.depth - 0.15 - 0.1   // at actual south edge
        }
        
        return (
          <group 
            position={CoordinateTransformationService.toThreeJsPosition(installationEdgePosition)}
            rotation={[0, Math.PI, 0]}
          >
            <RoofSolarInstallation 
              configuration={{
                rows: 6,
                columns: 1,
                connectorLength: 1.320
              }}
            />
          </group>
        )
      })()}
    </>
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
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-near={0.1}
      />
      
      <Ground />
      <House />
      <Roof />
      <Compass />
      
      <gridHelper args={[50, 50, '#444444', '#888888']} />
    </>
  )
}