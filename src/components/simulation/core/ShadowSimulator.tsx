'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as SunCalc from 'suncalc'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'
import Scene3D from './Scene3D'
import Controls from './Controls'
import DateTimePicker from '../ui/DateTimePicker'
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
  const [followNowTime, setFollowNowTime] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const getCurrentNetherlandsTime = useCallback(() => {
    const now = new Date()
    const nlTime = toZonedTime(now, houseSettings.location.timezone)
    const hours = nlTime.getHours() + nlTime.getMinutes() / 60
    return { date: nlTime, time: hours }
  }, [])

  const updateToCurrentTime = useCallback(() => {
    const current = getCurrentNetherlandsTime()
    setDate(current.date)
    setTime(current.time)
  }, [getCurrentNetherlandsTime])

  const handleDateChange = (newDate: Date) => {
    setDate(newDate)
    if (followNowTime) {
      setFollowNowTime(false)
    }
  }

  const handleTimeChange = (newTime: number) => {
    setTime(newTime)
    if (followNowTime) {
      setFollowNowTime(false)
    }
  }

  const handleFollowNowTimeChange = (follow: boolean) => {
    setFollowNowTime(follow)
    if (follow) {
      updateToCurrentTime()
    }
  }

  const calculateSunPosition = (date: Date, timeHours: number): SunPosition => {
    // Create a date that represents the specified time in Netherlands timezone
    // This ensures consistent sun calculations regardless of the user's local timezone
    const year = date.getFullYear()
    const month = date.getMonth()
    const day = date.getDate()
    const hours = Math.floor(timeHours)
    const minutes = Math.floor((timeHours % 1) * 60)
    
    // Create a date object with the specified time, treating it as Netherlands local time
    const nlLocalTime = new Date(year, month, day, hours, minutes, 0)
    
    // Convert Netherlands local time to UTC using date-fns-tz
    // This automatically handles DST transitions
    const utcTime = fromZonedTime(nlLocalTime, houseSettings.location.timezone)
    
    // Use SunCalc to get accurate sun position for Netherlands location
    const sunPosition = SunCalc.getPosition(
      utcTime,
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

  // Handle follow now time interval
  useEffect(() => {
    if (followNowTime) {
      // Update immediately when starting to follow
      updateToCurrentTime()
      
      // Set up interval to update every minute
      intervalRef.current = setInterval(() => {
        updateToCurrentTime()
      }, 60000) // 60,000ms = 1 minute
    } else {
      // Clear interval when not following
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [followNowTime, updateToCurrentTime])

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
        sunPosition={sunPosition}
        connectorLength={connectorLength}
        layout={layout}
        onConnectorLengthChange={setConnectorLength}
        onLayoutChange={setLayout}
      />
      
      <DateTimePicker
        date={date}
        time={time}
        followNowTime={followNowTime}
        onDateChange={handleDateChange}
        onTimeChange={handleTimeChange}
        onFollowNowTimeChange={handleFollowNowTimeChange}
      />
    </div>
  )
}