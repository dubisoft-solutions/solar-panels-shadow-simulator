'use client'

import { useState, useRef, useMemo } from 'react'
import * as SunCalc from 'suncalc'
import { fromZonedTime } from 'date-fns-tz'
import { houseSettings } from '@/config/houseSettings'

interface DateTimePickerProps {
  date: Date
  time: number
  followNowTime: boolean
  onDateChange: (date: Date) => void
  onTimeChange: (time: number) => void
  onFollowNowTimeChange: (follow: boolean) => void
}

type ScaleMode = 'time' | 'date'

export default function DateTimePicker({
  date,
  time,
  followNowTime,
  onDateChange,
  onTimeChange,
  onFollowNowTimeChange
}: DateTimePickerProps) {
  const [scaleMode, setScaleMode] = useState<ScaleMode>('time')
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef(0)
  const dragStartValue = useRef(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.floor((hours - h) * 60)
    const isPM = h >= 12
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${displayHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`
  }

  const handleScaleDrag = (clientX: number, startDrag = false) => {
    if (startDrag) {
      dragStartX.current = clientX
      if (scaleMode === 'time') {
        dragStartValue.current = time
      } else {
        dragStartValue.current = dates.findIndex(d => d.toDateString() === date.toDateString())
      }
      setIsDragging(true)
      return
    }
    
    const movement = clientX - dragStartX.current
    
    if (scaleMode === 'time') {
      // Map movement to time change - 100px = 1 hour (inverted: left = backward, right = forward)
      const timeChange = -movement / 100
      const newTime = Math.max(0, Math.min(24, dragStartValue.current + timeChange))
      onTimeChange(newTime)
    } else {
      // Map movement to date change - 10px = 1 day (more sensitive for faster scrolling)
      const dayChange = Math.round(-movement / 10)
      const newIndex = Math.max(0, Math.min(dates.length - 1, dragStartValue.current + dayChange))
      if (dates[newIndex]) {
        onDateChange(dates[newIndex])
      }
    }
  }

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    const clientX = event.clientX
    handleScaleDrag(clientX, true)
    
    const handleMouseMove = (e: MouseEvent) => {
      handleScaleDrag(e.clientX)
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault()
    const clientX = event.touches[0].clientX
    handleScaleDrag(clientX, true)
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      handleScaleDrag(e.touches[0].clientX)
    }
    
    const handleTouchEnd = () => {
      setIsDragging(false)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
  }

  // Generate hours for time scale
  const hours = Array.from({ length: 24 }, (_, i) => i)

  // Memoize dates array to prevent infinite re-renders
  const dates = useMemo(() => {
    const currentYear = date.getFullYear()
    const dateArray: Date[] = []
    
    // Only generate current year to improve performance
    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(currentYear, month + 1, 0).getDate()
      for (let day = 1; day <= daysInMonth; day++) {
        dateArray.push(new Date(currentYear, month, day))
      }
    }
    
    return dateArray
  }, [date.getFullYear()]) // Only regenerate when year changes

  // Memoize daylight segments - only recalculate when date changes
  const daylightSegments = useMemo(() => {
    const segments: { start: number; end: number }[] = []
    let segmentStart: number | null = null
    
    // Check every 1 minute for accurate daylight detection
    for (let timeHour = 0; timeHour < 24; timeHour += 1/60) {
      const year = date.getFullYear()
      const month = date.getMonth()
      const day = date.getDate()
      const hours = Math.floor(timeHour)
      const minutes = Math.floor((timeHour % 1) * 60)
      
      const nlLocalTime = new Date(year, month, day, hours, minutes, 0)
      const utcTime = fromZonedTime(nlLocalTime, houseSettings.location.timezone)
      
      const sunPosition = SunCalc.getPosition(
        utcTime,
        houseSettings.location.latitude,
        houseSettings.location.longitude
      )
      
      const elevation = sunPosition.altitude * 180 / Math.PI
      
      if (elevation > 0) {
        if (segmentStart === null) {
          segmentStart = timeHour
        }
      } else if (segmentStart !== null) {
        segments.push({ start: segmentStart, end: timeHour })
        segmentStart = null
      }
    }
    
    // Close any open segment
    if (segmentStart !== null) {
      segments.push({ start: segmentStart, end: 24 })
    }
    
    return segments
  }, [date.getFullYear(), date.getMonth(), date.getDate()]) // Only recalculate when date changes


  return (
    <>
      {/* Date and Time Display */}
      <div className="fixed bottom-16 right-4 z-20 flex flex-col items-end gap-2">
        {/* Live Button */}
        <button
          onClick={() => onFollowNowTimeChange(!followNowTime)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            followNowTime
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/25'
              : 'bg-black/80 text-white hover:bg-black/90'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${followNowTime ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
          {followNowTime ? 'Live' : 'Live'}
        </button>

        {/* Date and Time Buttons */}
        <div className="bg-black/80 backdrop-blur-sm text-white rounded-lg overflow-hidden flex">
          <button
            onClick={() => setScaleMode('date')}
            className={`px-4 py-2 text-lg transition-colors ${
              scaleMode === 'date' ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            {(() => {
              const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
              const offset = new Date().getTimezoneOffset()
              const offsetHours = Math.floor(Math.abs(offset) / 60)
              const offsetMinutes = Math.abs(offset) % 60
              const offsetSign = offset <= 0 ? '+' : '-'
              const offsetString = `${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMinutes.toString().padStart(2, '0')}`
              
              return isMobile 
                ? `${formatDate(date)}, ${offsetString}`
                : `${formatDate(date)}, Central European Summer Time`
            })()}
          </button>
          <button
            onClick={() => setScaleMode('time')}
            className={`px-4 py-2 text-lg font-mono border-t border-white/20 transition-colors ${
              scaleMode === 'time' ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            {formatTime(time)}
          </button>
          
          {/* Sun Position Info */}
          <div className="px-4 py-2 text-xs text-gray-300 border-t border-white/10">
            {(() => {
              // Calculate current sun position using the same logic as ShadowSimulator
              const year = date.getFullYear()
              const month = date.getMonth()
              const day = date.getDate()
              const hours = Math.floor(time)
              const minutes = Math.floor((time % 1) * 60)
              
              const nlLocalTime = new Date(year, month, day, hours, minutes, 0)
              const utcTime = fromZonedTime(nlLocalTime, houseSettings.location.timezone)
              
              const sunPosition = SunCalc.getPosition(
                utcTime,
                houseSettings.location.latitude,
                houseSettings.location.longitude
              )
              
              const elevation = Math.max(0, sunPosition.altitude * 180 / Math.PI)
              const azimuth = (sunPosition.azimuth * 180 / Math.PI + 180) % 360
              
              // Convert azimuth to cardinal direction
              const getCardinalDirection = (deg: number) => {
                if (deg >= 0 && deg < 22.5) return 'N'
                if (deg >= 22.5 && deg < 67.5) return 'NE'
                if (deg >= 67.5 && deg < 112.5) return 'E'
                if (deg >= 112.5 && deg < 157.5) return 'SE'
                if (deg >= 157.5 && deg < 202.5) return 'S'
                if (deg >= 202.5 && deg < 247.5) return 'SW'
                if (deg >= 247.5 && deg < 292.5) return 'W'
                if (deg >= 292.5 && deg < 337.5) return 'NW'
                return 'N'
              }
              
              const direction = getCardinalDirection(azimuth)
              
              return (
                <>
                  <div className="font-mono flex items-center gap-1">
                    {elevation.toFixed(1)}°
                    <span className="text-xs">∠</span>
                  </div>
                  <div className="font-mono">{azimuth.toFixed(1)}° {direction}</div>
                </>
              )
            })()}
          </div>
        </div>
      </div>

      {/* Bottom Scale */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm text-white z-10">
        <div className="h-14 flex items-center relative overflow-hidden">
          <div 
            ref={scrollRef}
            className={`flex-1 relative h-full select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            {scaleMode === 'time' ? (
              /* Time Scale */
              <div className="flex items-center h-full px-4 w-full">
                {/* Daylight indicator - continuous green line for daylight hours */}
                <div className="absolute top-1 left-4 right-4 h-1">
                  {daylightSegments.map((segment, index) => {
                    // Convert time hours to screen positions
                    const startOffset = segment.start - time
                    const endOffset = segment.end - time
                    const startPosition = 50 + (startOffset / 12) * 100
                    const endPosition = 50 + (endOffset / 12) * 100
                    
                    // Only show segments that are visible on screen
                    if (endPosition < -10 || startPosition > 110) return null
                    
                    const clampedStart = Math.max(0, startPosition)
                    const clampedEnd = Math.min(100, endPosition)
                    const width = clampedEnd - clampedStart
                    
                    if (width <= 0) return null
                    
                    return (
                      <div
                        key={`daylight-segment-${index}`}
                        className="absolute h-1 bg-green-400"
                        style={{
                          left: `${clampedStart}%`,
                          width: `${width}%`
                        }}
                      />
                    )
                  })}
                </div>
                {hours.map((hour) => {
                  const isPM = hour >= 12
                  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
                  const label = hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : `${displayHour} ${isPM ? 'PM' : 'AM'}`
                  
                  // Calculate position relative to current time - center the current time
                  const offsetFromCurrentTime = hour - time
                  const position = 50 + (offsetFromCurrentTime / 12) * 100 // Wider spacing for mobile
                  
                  // Only show hours within visible range
                  if (position < -10 || position > 110) return null
                  
                  // Show fewer hours on mobile
                  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
                  const showLabel = isMobile ? hour % 6 === 0 : (hour % 6 === 0 || hour % 3 === 0)
                  const showTick = isMobile ? hour % 2 === 0 : true
                  
                  if (!showTick) return null
                  
                  return (
                    <div
                      key={hour}
                      className="absolute flex flex-col items-center justify-center h-full text-gray-300"
                      style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className={`w-0.5 bg-current mb-1 ${
                        hour % 6 === 0 ? 'h-4' : hour % 3 === 0 ? 'h-3' : 'h-2'
                      }`} />
                      <span className="text-xs whitespace-nowrap">
                        {showLabel ? (hour % 6 === 0 ? label : displayHour.toString()) : ''}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Date Scale */
              <div className="flex items-center h-full px-4 w-full">
                {dates.map((dateItem, index) => {
                  const dayOfMonth = dateItem.getDate()
                  const month = dateItem.toLocaleDateString('en-US', { month: 'short' })
                  const isFirstOfMonth = dayOfMonth === 1
                  
                  // Calculate position relative to current date - center the current date
                  const currentIndex = dates.findIndex(d => d.toDateString() === date.toDateString())
                  const offsetFromCurrentDate = index - currentIndex
                  const position = 50 + (offsetFromCurrentDate / 30) * 100 // Wider spacing for mobile
                  
                  // Only show dates within a smaller range for mobile readability
                  if (position < -20 || position > 120) return null
                  
                  // Show fewer dates on mobile - only every 3rd day except for first of month
                  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
                  if (isMobile && !isFirstOfMonth && index % 3 !== 0) return null
                  
                  return (
                    <div
                      key={index}
                      className="absolute flex flex-col items-center justify-center h-full text-gray-300"
                      style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className={`w-0.5 bg-current mb-1 ${
                        isFirstOfMonth ? 'h-4' : 'h-2'
                      }`} />
                      <span className="text-xs whitespace-nowrap">
                        {isFirstOfMonth ? `${month} ${dayOfMonth}` : dayOfMonth.toString()}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Fixed Center Indicator */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-yellow-400 pointer-events-none z-20">
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-yellow-400 rounded-full border-2 border-black" />
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  )
}