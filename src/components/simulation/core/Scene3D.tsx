'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { houseSettings } from '@/config/houseSettings'
import RoofSolarInstallation from '../buildings/house/solar-panels/RoofSolarInstallation'
import House from '../buildings/house/House'
import { Layout3DConfiguration } from '@/domain/entities/InstallationPosition'
import { CoordinateTransformationService } from '@/services/CoordinateTransformationService'

interface Scene3DProps {
  sunPosition: {
    azimuth: number
    elevation: number
  }
  layout3DConfiguration: Layout3DConfiguration
}

function Roof({ layout3DConfiguration }: { layout3DConfiguration: Layout3DConfiguration }) {
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

      {/* North Parapet - connects to west parapet */}
      {roof.parapet.sides.includes('north') && (() => {
        const northParapetWidth = roof.parapet.widths.north
        const westParapetWidth = roof.parapet.widths.west
        const northParapetLength = roof.dimensions.width - westParapetWidth
        const parapetEdgePos = {
          x: roof.position.x + westParapetWidth,
          y: heightY + roof.dimensions.thickness,
          z: roof.position.y
        }
        return (
          <mesh
            castShadow
            receiveShadow
            position={CoordinateTransformationService.edgeToThreeJs(
              parapetEdgePos,
              { width: northParapetLength, height: roof.parapet.height, depth: northParapetWidth }
            )}
          >
            <boxGeometry args={[northParapetLength, roof.parapet.height, northParapetWidth]} />
            <meshLambertMaterial color="#CCCCCC" />
          </mesh>
        )
      })()}
      
      {/* South Parapet - connects to west parapet */}
      {roof.parapet.sides.includes('south') && (() => {
        const southParapetWidth = roof.parapet.widths.south
        const westParapetWidth = roof.parapet.widths.west
        const southParapetLength = roof.dimensions.width - westParapetWidth
        const parapetEdgePos = {
          x: roof.position.x + westParapetWidth,
          y: heightY + roof.dimensions.thickness,
          z: roof.position.y + roof.dimensions.depth - southParapetWidth
        }
        return (
          <mesh
            castShadow
            receiveShadow
            position={CoordinateTransformationService.edgeToThreeJs(
              parapetEdgePos,
              { width: southParapetLength, height: roof.parapet.height, depth: southParapetWidth }
            )}
          >
            <boxGeometry args={[southParapetLength, roof.parapet.height, southParapetWidth]} />
            <meshLambertMaterial color="#CCCCCC" />
          </mesh>
        )
      })()}
      
      {/* West Parapet */}
      {roof.parapet.sides.includes('west') && (() => {
        const westParapetWidth = roof.parapet.widths.west
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
              { width: westParapetWidth, height: roof.parapet.height, depth: roof.dimensions.depth }
            )}
          >
            <boxGeometry args={[westParapetWidth, roof.parapet.height, roof.dimensions.depth]} />
            <meshLambertMaterial color="#CCCCCC" />
          </mesh>
        )
      })()}
      
      {/* Roof Objects - now nested inside roof coordinate system */}
      <RoofObjects layout3DConfiguration={layout3DConfiguration} />
    </group>
  )
}

function RoofObjects({ layout3DConfiguration }: { layout3DConfiguration: Layout3DConfiguration }) {
  const roofThickness = houseSettings.roof.dimensions.thickness
  const houseHeight = houseSettings.dimensions.height

  return (
    <>
      {/* Roof objects (chimneys, etc.) */}
      {houseSettings.roofObjects.map((obj) => {
        const edgePosition = {
          x: obj.position.x,
          y: houseHeight + roofThickness + obj.position.y,
          z: obj.position.z
        }

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
            <mesh
              castShadow
              receiveShadow
              position={CoordinateTransformationService.toThreeJsPosition(centerPosition)}
            >
              <boxGeometry args={[obj.dimensions.width, obj.dimensions.height, obj.dimensions.depth]} />
              <meshLambertMaterial color={obj.color || '#8B4513'} />
            </mesh>

            {obj.pipe && (
              (() => {
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

      {/* Solar Panel Installations - using service-provided configuration */}
      {layout3DConfiguration.installations.map(installation => {
        // Create a unique key that includes configuration details to force remount on config change
        const configKey = JSON.stringify({
          id: installation.id,
          config: installation.configuration
        })

        return (
          <group
            key={configKey}
            position={[installation.position.x, installation.position.y, installation.position.z]}
            rotation={installation.rotation}
          >
            <RoofSolarInstallation
              configuration={installation.configuration}
            />
          </group>
        )
      })}
    </>
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

export default function Scene3D({ sunPosition, layout3DConfiguration }: Scene3DProps) {
  const lightRef = useRef<THREE.DirectionalLight>(null)
  const sunLightRef = useRef<THREE.DirectionalLight>(null)

  useFrame(() => {
    const azimuthRad = sunPosition.azimuth * Math.PI / 180
    const elevationRad = sunPosition.elevation * Math.PI / 180
    
    // Update visual light (close distance for proper shadows)
    if (lightRef.current) {
      const distance = 50
      const x = distance * Math.cos(elevationRad) * Math.sin(azimuthRad)
      const y = distance * Math.sin(elevationRad)
      const z = -distance * Math.cos(elevationRad) * Math.cos(azimuthRad)
      
      lightRef.current.position.set(x, y, z)
      lightRef.current.target.position.set(0, 0, 0)
      lightRef.current.target.updateMatrixWorld()
    }
    
    // Update sun light (far distance for SmartSolarCell calculations)
    if (sunLightRef.current) {
      const sunDistance = 1000 // Very far away for parallel rays
      const x = sunDistance * Math.cos(elevationRad) * Math.sin(azimuthRad)
      const y = sunDistance * Math.sin(elevationRad)
      const z = -sunDistance * Math.cos(elevationRad) * Math.cos(azimuthRad)
      
      sunLightRef.current.position.set(x, y, z)
      sunLightRef.current.target.position.set(0, 0, 0)
      sunLightRef.current.target.updateMatrixWorld()
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
      
      {/* Far sun light for SmartSolarCell calculations (no shadows, no visual impact) */}
      <directionalLight
        ref={sunLightRef}
        intensity={sunPosition.elevation > 0 ? 0.0001 : 0.0}  // Very low intensity to avoid visual impact
        castShadow={false}  // No shadow casting
        name="sun-light"  // Name for SmartSolarCell to identify
      />
      
      <Ground />

      {/* House and roof positioned 2m west and 2m south for better centering */}
      <group position={[-2, 0, 2]}>
        <House />
        <Roof layout3DConfiguration={layout3DConfiguration} />
      </group>
      
      <Compass />
      
      <gridHelper args={[50, 50, '#444444', '#888888']} />
    </>
  )
}