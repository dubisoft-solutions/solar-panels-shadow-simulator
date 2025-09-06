'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
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
  const rememberedDate = useRef<Date>(new Date())
  const rememberedTime = useRef(0)

  // Simple drag handler with remembering initial date/time
  const handleDrag = (clientX: number, startDrag = false) => {
    if (startDrag) {
      dragStartX.current = clientX
      rememberedDate.current = new Date(date)
      rememberedTime.current = time
      
      if (scaleMode === 'time') {
        dragStartValue.current = time
      } else {
        dragStartValue.current = date.getTime()
      }
      setIsDragging(true)
      return
    }
    
    const movement = clientX - dragStartX.current
    
    if (scaleMode === 'time') {
      // Time scrolling: match the visual scale exactly
      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1000
      const percentageMovement = movement / viewportWidth * 100
      const timeChange = -percentageMovement * 0.03 // 3 hours per 100% = 0.03 hours per 1%
      
      const newTime = rememberedTime.current + timeChange
      const wrappedTime = ((newTime % 24) + 24) % 24 // Always wrap time to 0-24
      
      // Determine which day we're on based on midnight crossings from remembered time
      let dayOffset = 0
      
      if (newTime >= 24) {
        // Crossed forward past midnight(s)
        dayOffset = Math.floor(newTime / 24)
      } else if (newTime < 0) {
        // Crossed backward past midnight(s)
        dayOffset = -Math.ceil(Math.abs(newTime) / 24)
      }
      
      // Calculate the new date based on remembered date + day offset
      const adjustedDate = new Date(rememberedDate.current.getTime() + dayOffset * 24 * 60 * 60 * 1000)
      
      onDateChange(adjustedDate)
      onTimeChange(wrappedTime)
    } else {
      // Date scrolling: 60px = 1 day (double sensitivity), but allow fractional changes during drag
      const dayChange = -movement / 60 // Don't round during drag
      const newDate = new Date(dragStartValue.current + dayChange * 24 * 60 * 60 * 1000)
      
      // Only update if the change is significant enough
      if (Math.abs(newDate.getTime() - date.getTime()) > 1000 * 60 * 60) { // 1 hour threshold
        onDateChange(newDate)
      }
    }
  }

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    handleDrag(event.clientX, true)
    
    const handleMouseMove = (e: MouseEvent) => {
      handleDrag(e.clientX)
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
    handleDrag(event.touches[0].clientX, true)
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      handleDrag(e.touches[0].clientX)
    }
    
    const handleTouchEnd = () => {
      setIsDragging(false)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
  }

  // Generate minutes for time scale (show every minute for precision)
  const minutes = useMemo(() => {
    const minuteList = []
    const startTime = time - 12 // Show 12 hours before
    const endTime = time + 36   // Show 36 hours after
    
    // Generate every minute in the range
    for (let t = startTime; t <= endTime; t += 1/60) { // 1/60 hour = 1 minute
      const rawHour = Math.floor(t)
      const fractionalPart = t - rawHour
      const minute = Math.floor(Math.abs(fractionalPart) * 60) // Handle negative fractional parts
      const wrappedHour = ((rawHour % 24) + 24) % 24 // Wrap to 0-23
      
      minuteList.push({ 
        value: t, 
        hour: wrappedHour, 
        minute: minute,
        isHour: minute === 0,
        actualTime: t // Keep the actual time value for date detection
      })
    }
    return minuteList
  }, [time])

  // Generate dates for date scale (infinite-like) - memoize more aggressively
  const dates = useMemo(() => {
    const dateList = []
    // Use a more reliable method that handles month boundaries properly
    const baseDate = new Date(date.getTime()) // Clone the date
    
    for (let i = -30; i <= 60; i++) { // Show 91 days total (even more days visible)
      const newDate = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000)
      dateList.push({
        date: newDate,
        day: newDate.getDate(),
        month: newDate.toLocaleDateString('en-US', { month: 'short' }),
        key: `date-${newDate.getTime()}`
      })
    }
    return dateList
  }, [Math.floor(date.getTime() / (24 * 60 * 60 * 1000))]) // Only recalculate when date changes

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
                    // Convert time hours to screen positions (match the new 3-hour scale)
                    const startOffset = segment.start - time
                    const endOffset = segment.end - time
                    const startPosition = 50 + (startOffset / 3) * 100 // 3 hours = 100% (same as ticks)
                    const endPosition = 50 + (endOffset / 3) * 100
                    
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
                {minutes.map((timeItem, index) => {
                  const hour = timeItem.hour
                  const isPM = hour >= 12
                  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
                  
                  // Calculate position relative to current time (wider scale)
                  const offsetFromCurrentTime = timeItem.value - time
                  const position = 50 + (offsetFromCurrentTime / 3) * 100 // 3 hours = 100% (instead of 12)
                  
                  // Only show ticks within visible range
                  if (position < -10 || position > 110) return null
                  
                  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
                  
                  // Tick height based on time significance
                  const minute = timeItem.minute
                  let tickHeight = 'h-1' // Default for minutes
                  let showTick = true
                  
                  if (minute === 0) {
                    // Hour marks
                    if (hour % 6 === 0) tickHeight = 'h-4' // Major hours (6, 12, 18, 24)
                    else if (hour % 3 === 0) tickHeight = 'h-3' // Minor hours (3, 9, 15, 21)
                    else tickHeight = 'h-2' // Regular hours
                  } else if (minute === 30) {
                    // Half-hour marks
                    tickHeight = 'h-2' // Same as regular hours
                  } else if (isMobile) {
                    // Hide minute ticks on mobile, but keep the spacing
                    showTick = minute % 15 === 0 // Only show every 15 minutes on mobile
                  }
                  
                  // Show labels every 30 minutes
                  const labelText = (() => {
                    const minute = timeItem.minute
                    
                    // Only show labels at :00 and :30
                    if (minute !== 0 && minute !== 30) return ''
                    
                    const minuteStr = minute.toString().padStart(2, '0')
                    const timeStr = `${displayHour}:${minuteStr} ${isPM ? 'PM' : 'AM'}`
                    
                    if (isMobile) {
                      // Mobile: show fewer labels to avoid crowding
                      // Use the wrapped hour for the modulo check
                      if (minute === 0 && hour % 2 === 0) return timeStr // Every 2 hours on the hour
                      return ''
                    } else {
                      // Desktop: show every 30 minutes
                      return timeStr
                    }
                  })()
                  
                  return (
                    <div
                      key={`time-${index}`}
                      className="absolute flex flex-col items-center justify-center h-full text-gray-300"
                      style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                    >
                      {showTick && <div className={`w-0.5 bg-current mb-2 ${tickHeight}`} />}
                      <span className="text-xs whitespace-nowrap">
                        {labelText}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* Date Scale */
              <div className="flex items-center h-full px-4 w-full">
                {dates.map((dateItem, index) => {
                  const { date: itemDate, day: dayOfMonth, month, key } = dateItem
                  
                  // Calculate position relative to current date using exact time difference
                  const timeDiff = itemDate.getTime() - date.getTime()
                  const dayOffset = timeDiff / (1000 * 60 * 60 * 24) // Exact fractional days
                  const position = 50 + (dayOffset / 30) * 100
                  
                  // Only show dates within visible range
                  if (position < -20 || position > 120) return null
                  
                  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
                  
                  return (
                    <div
                      key={key}
                      className="absolute flex flex-col items-center justify-center h-full text-gray-300"
                      style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className={`w-0.5 bg-current mb-1 ${
                        dayOfMonth === 1 ? 'h-4' : 'h-2'
                      } ${
                        isMobile && dayOfMonth % 10 !== 0 ? 'opacity-0' : ''
                      }`} />
                      <div className="text-xs whitespace-nowrap text-center">
                        {(() => {
                          if (isMobile) {
                            // On mobile, show every 10th day
                            if (dayOfMonth % 10 === 0) {
                              return (
                                <>
                                  <div>{dayOfMonth}</div>
                                  <div className="text-xs opacity-60">{month.toUpperCase()}</div>
                                </>
                              )
                            }
                            return null
                          } else {
                            // Desktop: show every 5th day
                            if (dayOfMonth % 5 === 0) {
                              return (
                                <>
                                  <div>{dayOfMonth}</div>
                                  <div className="text-xs opacity-60">{month.toUpperCase()}</div>
                                </>
                              )
                            }
                            return null
                          }
                        })()}
                      </div>
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