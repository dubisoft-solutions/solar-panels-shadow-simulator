'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import WoodenShell from '@/components/simulation/buildings/house/WoodenShell'
import { WoodenShellCalculationService } from '@/services/WoodenShellCalculationService'
import { houseSettings } from '@/config/houseSettings'

export default function EnergySystemShellPage() {
  // Use the exact same configuration as the house component but position at 1m height
  const shellConfig = WoodenShellCalculationService.calculateShellConfiguration(houseSettings.energyStorage)

  // Override position to center the shell 1 meter from ground
  const debugShellConfig = {
    ...shellConfig,
    position: { x: 0, y: 1, z: 0 }
  }

  return (
    <div className="w-full h-screen bg-gray-100">
      <Canvas
        shadows
        camera={{
          position: [3, 2, 3],
          fov: 60,
          near: 0.1,
          far: 1000
        }}
      >
        {/* Fixed ambient lighting */}
        <ambientLight intensity={0.4} />

        {/* Fixed directional light for shadows */}
        <directionalLight
          position={[5, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />

        {/* Ground plane */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[10, 10]} />
          <meshLambertMaterial color="#90EE90" />
        </mesh>

        {/* Grid helper for reference */}
        <gridHelper args={[10, 10]} position={[0, 0.01, 0]} />

        {/* Wooden Shell - positioned 1 meter from ground */}
        <WoodenShell configuration={debugShellConfig} />

        {/* Camera controls */}
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          target={[0, 1, 0]}
        />
      </Canvas>

      {/* Info panel */}
      <div className="absolute top-4 left-4 bg-white p-4 rounded shadow-lg">
        <h2 className="text-lg font-bold mb-2">Energy System Shell Debug</h2>
        <div className="text-sm space-y-1">
          <p><strong>Shell Dimensions:</strong></p>
          <p>Width: {debugShellConfig.shellDimensions.width.toFixed(3)}m</p>
          <p>Height: {debugShellConfig.shellDimensions.height.toFixed(3)}m</p>
          <p>Depth: {debugShellConfig.shellDimensions.depth.toFixed(3)}m</p>
          <p><strong>Battery Count:</strong> {houseSettings.energyStorage.batteryCount}</p>
          <p><strong>Inverter Model:</strong> {houseSettings.energyStorage.inverter.model}</p>
          <p><strong>Battery Model:</strong> {houseSettings.energyStorage.battery.model}</p>
        </div>
      </div>
    </div>
  )
}