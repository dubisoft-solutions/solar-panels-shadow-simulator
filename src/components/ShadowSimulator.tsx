'use client'

import { useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import * as SunCalc from 'suncalc'
import Scene3D from './Scene3D'
import Controls from './Controls'
import { houseSettings } from '@/config/houseSettings'
import { simulatorSettings } from '@/config/simulatorSettings'

interface SunPosition {
  azimuth: number
  elevation: number
}

export default function ShadowSimulator() {
  const [date, setDate] = useState(() => {
    return simulatorSettings.defaultDateTime 
      ? new Date(simulatorSettings.defaultDateTime.date)
      : new Date()
  })
  const [time, setTime] = useState(() => {
    return simulatorSettings.defaultDateTime?.time ?? 12
  })
  const [sunPosition, setSunPosition] = useState<SunPosition>({ azimuth: 180, elevation: 45 })
  const [connectorLength, setConnectorLength] = useState(1.320)
  const [layout, setLayout] = useState<'current' | 'sw-reposition' | 'sw-portrait'>('current')

  const calculateSunPosition = (date: Date, timeHours: number): SunPosition => {
    // Create a new date with the specified time
    const dateWithTime = new Date(date)
    dateWithTime.setHours(Math.floor(timeHours), (timeHours % 1) * 60, 0, 0)
    
    // Use SunCalc to get accurate sun position
    const sunPosition = SunCalc.getPosition(
      dateWithTime,
      houseSettings.location.latitude,
      houseSettings.location.longitude
    )
    
    // Convert to degrees and adjust for our coordinate system
    const elevation = Math.max(0, sunPosition.altitude * 180 / Math.PI)
    const azimuth = (sunPosition.azimuth * 180 / Math.PI + 180) % 360
    
    return { azimuth, elevation }
  }

  useEffect(() => {
    const newSunPosition = calculateSunPosition(date, time)
    setSunPosition(newSunPosition)
  }, [date, time])

  return (
    <div className="h-screen w-screen relative">
      <Canvas
        camera={{
          position: [0, 20, 0],
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        shadows
        style={{ background: 'linear-gradient(to bottom, #87CEEB 0%, #98FB98 100%)' }}
      >
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2}
          minDistance={5}
          maxDistance={50}
        />
        <Scene3D sunPosition={sunPosition} connectorLength={connectorLength} layout={layout} />
      </Canvas>
      
      <Controls
        date={date}
        time={time}
        sunPosition={sunPosition}
        connectorLength={connectorLength}
        layout={layout}
        onDateChange={setDate}
        onTimeChange={setTime}
        onConnectorLengthChange={setConnectorLength}
        onLayoutChange={setLayout}
      />
    </div>
  )
}