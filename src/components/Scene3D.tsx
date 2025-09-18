'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { houseSettings } from '@/config/houseSettings'
import RoofSolarInstallation from './solar-panels/RoofSolarInstallation'
import House from './House'
import { PANEL_SPECS, LANDSCAPE_PLATFORM_SPECS, PORTRAIT_PLATFORM_SPECS } from '@/config/solarPanelInstallationSettings'
import { CoordinateTransformationService } from '@/services/CoordinateTransformationService'
import { PanelSpacingService } from '@/services/PanelSpacingService'

interface Scene3DProps {
  sunPosition: {
    azimuth: number
    elevation: number
  }
  connectorLength?: number
  layout?: 'current' | 'sw-reposition' | 'sw-portrait'
}

function Roof({ connectorLength, layout }: { connectorLength: number; layout: 'current' | 'sw-reposition' | 'sw-portrait' }) {
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
          z: roof.position.y
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
      <RoofObjects connectorLength={connectorLength} layout={layout} />
    </group>
  )
}

function RoofObjects({ connectorLength, layout }: { connectorLength: number; layout: 'current' | 'sw-reposition' | 'sw-portrait' }) {
  const roofThickness = houseSettings.roof.dimensions.thickness
  const houseHeight = houseSettings.dimensions.height
  const houseWidth = houseSettings.dimensions.northSideLength
  const houseDepth = houseSettings.dimensions.westSideLength

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
      
      {/* SE Solar Panel Installation - using service layer for positioning */}
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
                connectorLength: connectorLength
              }}
            />
          </group>
        )
      })()}
      
      {/* SW 1 Solar Panel Installation - along north parapet, facing west */}
      {layout === 'current' && (() => {
        const spacing = PanelSpacingService.calculateSpacing(
          PANEL_SPECS,
          LANDSCAPE_PLATFORM_SPECS,
          connectorLength,
          'landscape'  // Will be configurable for portrait mode later
        )
        // Edge-based position calculation for SW installation
        const swInstallationEdgePosition = {
          x: houseWidth - connectorLength - spacing.projectedDepth - 0.05,  // panels positioned based on connector length
          y: houseHeight + roofThickness,  // house height + on roof surface
          z: 0.15 + PANEL_SPECS.length  // closed to north parapet (15cm parapet)
        }
        
        return (
          <group 
            position={CoordinateTransformationService.toThreeJsPosition(swInstallationEdgePosition)}
            rotation={[0, Math.PI / 2, 0]}
          >
            <RoofSolarInstallation 
              configuration={{
                rows: 2,  // 2 panels in a row
                columns: 1,
                connectorLength: connectorLength
              }}
            />
          </group>
        )
      })()}

      {/* SW 1 Solar Panel Installation - along north parapet, facing west */}
      {layout === 'sw-reposition' && (() => {
        const spacing = PanelSpacingService.calculateSpacing(
          PANEL_SPECS,
          LANDSCAPE_PLATFORM_SPECS,
          connectorLength,
          'landscape'  // Will be configurable for portrait mode later
        )
        // Edge-based position calculation for SW installation
        const swInstallationEdgePosition = {
          x: houseWidth - spacing.projectedDepth - 0.05,  // panels positioned based on connector length
          y: houseHeight + roofThickness,  // house height + on roof surface
          z: 0.15 + PANEL_SPECS.length * 2 + 0.1  // 10cm from north parapet (15cm parapet + 10cm gap)
        }
        
        return (
          <group 
            position={CoordinateTransformationService.toThreeJsPosition(swInstallationEdgePosition)}
            rotation={[0, Math.PI / 2, 0]}
          >
            <RoofSolarInstallation 
              configuration={{
                rows: 1,
                columns: 2,
                connectorLength: connectorLength
              }}
            />
          </group>
        )
      })()}

      {/* SW 2 Solar Panel Installation - along south parapet, facing west */}
      {(layout === 'current' || layout === 'sw-reposition') && (() => {
        const spacing = PanelSpacingService.calculateSpacing(
          PANEL_SPECS,
          LANDSCAPE_PLATFORM_SPECS,
          connectorLength,
          'landscape'  // Will be configurable for portrait mode later
        )
        // Edge-based position calculation for SW installation
        const swInstallationEdgePosition = {
          x: houseWidth - connectorLength - spacing.projectedDepth - 0.05,  // panels positioned based on connector length
          y: houseHeight + roofThickness,  // house height + on roof surface
          z: houseDepth + 0.15  // 10cm from north parapet (15cm parapet + 10cm gap)
        }
        
        return (
          <group 
            position={CoordinateTransformationService.toThreeJsPosition(swInstallationEdgePosition)}
            rotation={[0, Math.PI / 2, 0]}
          >
            <RoofSolarInstallation 
              configuration={{
                rows: 2,  // 2 panels in a row
                columns: 2,
                connectorLength: connectorLength
              }}
            />
          </group>
        )
      })()}


      {/* SW 1 Solar Panel Installation in portrait mode - along north parapet, facing west */}
      {layout === 'sw-portrait' && (() => {
        const spacing = PanelSpacingService.calculateSpacing(
          PANEL_SPECS,
          PORTRAIT_PLATFORM_SPECS,
          connectorLength,
          'portrait'  // Will be configurable for portrait mode later
        )
        // Edge-based position calculation for SW installation
        const swInstallationEdgePosition = {
          x: houseWidth - spacing.projectedDepth - 0.05,  // panels positioned based on connector length
          y: houseHeight + roofThickness,  // house height + on roof surface
          z: 0.15 + PANEL_SPECS.length * 2 + 0.1  // 10cm from north parapet (15cm parapet + 10cm gap)
        }
        
        return (
          <group 
            position={CoordinateTransformationService.toThreeJsPosition(swInstallationEdgePosition)}
            rotation={[0, Math.PI / 2, 0]}
          >
            <RoofSolarInstallation 
              configuration={{
                rows: 1,
                columns: 3,
                connectorLength: connectorLength,
                orientation: 'portrait'
              }}
            />
          </group>
        )
      })()}


      {/* SW 2 Solar Panel Installation in portrait mode - along south parapet, facing west */}
      {(layout === 'sw-portrait') && (() => {
        const spacing = PanelSpacingService.calculateSpacing(
          PANEL_SPECS,
          PORTRAIT_PLATFORM_SPECS,
          connectorLength,
          'portrait'  // Will be configurable for portrait mode later
        )
        // Edge-based position calculation for SW installation
        const swInstallationEdgePosition = {
          x: houseWidth - spacing.platformLength,
          y: houseHeight + roofThickness,  // house height + on roof surface
          z: houseDepth + 0.15  // 10cm from north parapet (15cm parapet + 10cm gap)
        }
        
        return (
          <group 
            position={CoordinateTransformationService.toThreeJsPosition(swInstallationEdgePosition)}
            rotation={[0, Math.PI / 2, 0]}
          >
            <RoofSolarInstallation 
              configuration={{
                rows: 1,  // 1 panel in a row
                columns: 3,
                connectorLength: connectorLength,
                orientation: 'portrait'
              }}
            />
          </group>
        )
      })()}


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

export default function Scene3D({ sunPosition, connectorLength = 1.320, layout = 'current' }: Scene3DProps) {
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
        <Roof connectorLength={connectorLength} layout={layout} />
      </group>
      
      <Compass />
      
      <gridHelper args={[50, 50, '#444444', '#888888']} />
    </>
  )
}