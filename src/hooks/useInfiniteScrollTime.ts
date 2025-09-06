/**
 * React hook for managing infinite scrolling time picker state and interactions.
 * 
 * Integrates the TimeVirtualScrollManager service with React component lifecycle
 * and provides a clean interface for the DateTimePicker component.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { TimeVirtualScrollManager } from '@/services/time/TimeVirtualScrollManager'
import { TimeUnit } from '@/services/time/TimeUnit'
import { TimeRangeConfig } from '@/services/time/TimeRangeCalculator'
import { PositionConfig, ViewportConfig } from '@/services/base/IVirtualScrollManager'

interface UseInfiniteScrollTimeConfig {
  initialTime: number // Hours (0-23.99)
  pixelsPerHour?: number
  bufferHours?: number
  bufferThreshold?: number
  granularityMinutes?: number
  debounceMs?: number
  onTimeChange?: (time: number) => void
}

interface DragState {
  isDragging: boolean
  startX: number
  startTime: number
}

export const useInfiniteScrollTime = ({
  initialTime,
  pixelsPerHour = 100, // 1 hour = 100px by default
  bufferHours = 6,
  bufferThreshold = 2, // Recalculate when within 2 hours of buffer edge
  granularityMinutes = 60,
  debounceMs = 16, // ~60fps
  onTimeChange
}: UseInfiniteScrollTimeConfig) => {
  // State for drag interactions
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startTime: initialTime
  })

  // State for current center time
  const [centerTime, setCenterTime] = useState(initialTime)
  
  // Ref for the scroll manager instance
  const scrollManagerRef = useRef<TimeVirtualScrollManager | null>(null)

  // Initialize scroll manager
  const scrollManager = useMemo(() => {
    if (typeof window === 'undefined') return null

    const timeUnit = new TimeUnit(initialTime)
    
    const positionConfig: PositionConfig = {
      pixelsPerUnit: pixelsPerHour,
      viewportWidth: window.innerWidth,
      centerPosition: 0.5
    }

    const viewportConfig: ViewportConfig = {
      width: window.innerWidth,
      bufferThreshold,
      smoothTransitions: true,
      debounceMs
    }

    const timeRangeConfig: TimeRangeConfig = {
      hoursBefore: bufferHours,
      hoursAfter: bufferHours,
      granularityMinutes
    }

    const manager = new TimeVirtualScrollManager(
      timeUnit,
      positionConfig,
      viewportConfig,
      timeRangeConfig
    )

    scrollManagerRef.current = manager
    return manager
  }, [initialTime, pixelsPerHour, bufferHours, bufferThreshold, granularityMinutes, debounceMs])

  // Get visible times from scroll manager
  const visibleTimes = useMemo(() => {
    if (!scrollManager) return []
    const times = scrollManager.getDetailedVisibleTimes()
    // Transform to include key and position for rendering
    return times.map(timePos => {
      // Calculate position relative to current center time
      const timeOffset = timePos.time.getValue() - centerTime
      const position = 50 + (timeOffset / 12) * 100 // Center at 50%, 12 hours = 100%
      
      return {
        key: `time-${timePos.time.getValue()}`,
        value: timePos.time.getValue(),
        position: position,
        isVisible: position >= -10 && position <= 110
      }
    })
  }, [scrollManager, centerTime]) // Re-calculate when center time changes

  // Handle window resize
  useEffect(() => {
    if (!scrollManager || typeof window === 'undefined') return

    const handleResize = () => {
      scrollManager.updatePositionConfig({
        viewportWidth: window.innerWidth
      })
      scrollManager.updateViewportConfig({
        width: window.innerWidth
      })
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [scrollManager])

  // Handle drag start
  const handleDragStart = useCallback((clientX: number) => {
    setDragState({
      isDragging: true,
      startX: clientX,
      startTime: centerTime
    })
  }, [centerTime])

  // Handle drag movement
  const handleDragMove = useCallback((clientX: number) => {
    if (!dragState.isDragging || !scrollManager) return

    const pixelOffset = -(clientX - dragState.startX) // Negative for natural scroll direction
    const newTime = scrollManager.handleScrollMovement(pixelOffset, dragState.startTime)
    
    setCenterTime(newTime)
    
    // Notify parent component
    if (onTimeChange) {
      onTimeChange(newTime)
    }
  }, [dragState, scrollManager, onTimeChange])

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (!scrollManager) return

    const finalTime = scrollManager.handleScrollEnd(true) // Snap to nearest interval
    setCenterTime(finalTime)
    
    setDragState(prev => ({
      ...prev,
      isDragging: false
    }))

    // Notify parent component of final time
    if (onTimeChange) {
      onTimeChange(finalTime)
    }
  }, [scrollManager, onTimeChange])

  // Mouse event handlers
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault()
    handleDragStart(event.clientX)

    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientX)
    }

    const handleMouseUp = () => {
      handleDragEnd()
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [handleDragStart, handleDragMove, handleDragEnd])

  // Touch event handlers
  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    event.preventDefault()
    handleDragStart(event.touches[0].clientX)

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      if (e.touches.length > 0) {
        handleDragMove(e.touches[0].clientX)
      }
    }

    const handleTouchEnd = () => {
      handleDragEnd()
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }

    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd)
  }, [handleDragStart, handleDragMove, handleDragEnd])

  // Update center time from external source
  const updateCenterTime = useCallback((newTime: number, forceRecalculation: boolean = false) => {
    if (!scrollManager) return

    const timeChanged = scrollManager.updateCenterValue(newTime, forceRecalculation)
    setCenterTime(newTime)

    if (timeChanged && onTimeChange) {
      onTimeChange(newTime)
    }
  }, [scrollManager, onTimeChange])

  // Change granularity dynamically
  const setGranularity = useCallback((granularityMinutes: number) => {
    if (!scrollManager) return
    
    scrollManager.setGranularity(granularityMinutes)
    // Trigger re-render by updating center time
    setCenterTime(scrollManager.getCenterTimeUnit().getValue())
  }, [scrollManager])

  // Jump to specific time
  const jumpToTime = useCallback((targetTime: number) => {
    if (!scrollManager) return
    
    const timeUnit = new TimeUnit(targetTime)
    scrollManager.jumpToTime(timeUnit)
    setCenterTime(targetTime)
    
    if (onTimeChange) {
      onTimeChange(targetTime)
    }
  }, [scrollManager, onTimeChange])

  // Get optimal label interval
  const labelInterval = useMemo(() => {
    if (!scrollManager) return 1
    return scrollManager.getOptimalLabelInterval()
  }, [scrollManager, visibleTimes.length])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollManagerRef.current) {
        scrollManagerRef.current.dispose()
      }
    }
  }, [])

  return {
    // State
    centerTime,
    centerTimeUnit: scrollManager ? scrollManager.getCenterTimeUnit() : new TimeUnit(centerTime),
    visibleTimes,
    isDragging: dragState.isDragging,
    
    // Event handlers
    handleMouseDown,
    handleTouchStart,
    
    // Methods
    updateCenterTime,
    jumpToTime,
    setGranularity,
    
    // Configuration
    pixelsPerHour,
    labelInterval,
    granularityMinutes
  }
}