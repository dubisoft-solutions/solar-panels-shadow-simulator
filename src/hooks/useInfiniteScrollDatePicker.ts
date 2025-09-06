/**
 * React hook for managing infinite scrolling date picker state and interactions.
 * 
 * Integrates the VirtualScrollManager service with React component lifecycle
 * and provides a clean interface for the DateTimePicker component.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { VirtualScrollManager } from '@/services/VirtualScrollManager'

interface UseInfiniteScrollDatePickerConfig {
  initialDate: Date
  pixelsPerDay?: number
  bufferDays?: number
  bufferThreshold?: number
  debounceMs?: number
  onDateChange?: (date: Date) => void
}

interface DragState {
  isDragging: boolean
  startX: number
  startDate: Date
}

export const useInfiniteScrollDatePicker = ({
  initialDate,
  pixelsPerDay = 3.33, // ~30 days visible in 1000px viewport
  bufferDays = 50,
  bufferThreshold = 20,
  debounceMs = 16, // ~60fps
  onDateChange
}: UseInfiniteScrollDatePickerConfig) => {
  // State for drag interactions
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startDate: new Date(initialDate)
  })

  // State for current center date
  const [centerDate, setCenterDate] = useState(new Date(initialDate))
  
  // Ref for the scroll manager instance
  const scrollManagerRef = useRef<VirtualScrollManager | null>(null)

  // Initialize scroll manager
  const scrollManager = useMemo(() => {
    if (typeof window === 'undefined') return null

    const manager = new VirtualScrollManager(
      initialDate,
      {
        pixelsPerDay,
        viewportWidth: window.innerWidth,
        centerPosition: 0.5
      },
      {
        width: window.innerWidth,
        bufferThreshold,
        smoothTransitions: true,
        debounceMs
      },
      {
        daysBefore: bufferDays,
        daysAfter: bufferDays
      }
    )

    scrollManagerRef.current = manager
    return manager
  }, [initialDate, pixelsPerDay, bufferDays, bufferThreshold, debounceMs])

  // Get visible dates from scroll manager
  const visibleDates = useMemo(() => {
    if (!scrollManager) return []
    const dates = scrollManager.getVisibleDates()
    // Transform to include key and position for rendering
    return dates.map(datePos => {
      // Calculate position relative to current center date
      const centerDateMs = centerDate.getTime()
      const datePosMs = datePos.date.getTime()
      const dayOffset = (datePosMs - centerDateMs) / (1000 * 60 * 60 * 24)
      const position = 50 + (dayOffset / 30) * 100 // Center at 50%, 30 days = 100%
      
      return {
        key: `date-${datePos.date.toISOString()}`,
        date: datePos.date,
        position: position,
        isVisible: position >= -20 && position <= 120
      }
    })
  }, [scrollManager, centerDate]) // Re-calculate when center date changes

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
      startDate: new Date(centerDate)
    })
  }, [centerDate])

  // Handle drag movement
  const handleDragMove = useCallback((clientX: number) => {
    if (!dragState.isDragging || !scrollManager) return

    const pixelOffset = -(clientX - dragState.startX) // Negative for natural scroll direction
    const newDate = scrollManager.handleScrollMovement(pixelOffset, dragState.startDate)
    
    setCenterDate(new Date(newDate))
    
    // Notify parent component
    if (onDateChange) {
      onDateChange(new Date(newDate))
    }
  }, [dragState, scrollManager, onDateChange])

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    if (!scrollManager) return

    const finalDate = scrollManager.handleScrollEnd(true) // Snap to nearest day
    setCenterDate(new Date(finalDate))
    
    setDragState(prev => ({
      ...prev,
      isDragging: false
    }))

    // Notify parent component of final date
    if (onDateChange) {
      onDateChange(new Date(finalDate))
    }
  }, [scrollManager, onDateChange])

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

  // Update center date from external source
  const updateCenterDate = useCallback((newDate: Date, forceRecalculation: boolean = false) => {
    if (!scrollManager) return

    const dateChanged = scrollManager.updateCenterDate(newDate, forceRecalculation)
    setCenterDate(new Date(newDate))

    if (dateChanged && onDateChange) {
      onDateChange(new Date(newDate))
    }
  }, [scrollManager, onDateChange])

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
    centerDate,
    visibleDates,
    isDragging: dragState.isDragging,
    
    // Event handlers
    handleMouseDown,
    handleTouchStart,
    
    // Methods
    updateCenterDate,
    
    // Configuration
    pixelsPerDay
  }
}