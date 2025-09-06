/**
 * Service for calculating positions and conversions between times and pixel coordinates
 * in the infinite scrolling time picker.
 * 
 * Handles the mathematical relationship between time differences and screen positions,
 * including 24-hour wrapping logic for seamless midnight transitions.
 */

import { TimeUnit } from './TimeUnit'
import { PositionConfig } from '../base/IVirtualScrollManager'

export interface TimePosition {
  time: TimeUnit
  pixelPosition: number
  isVisible: boolean
  screenPercentage: number
}

export class TimePositionCalculator {
  /**
   * Calculates the pixel position of a time relative to a center time.
   * 
   * @param targetTime Time to calculate position for
   * @param centerTime Reference center time 
   * @param config Position configuration including pixels per hour
   * @returns Pixel offset from center position (can be negative)
   * 
   * @example
   * // Calculate position of 15:30 when 14:00 is center
   * const position = TimePositionCalculator.getTimePosition(
   *   TimeUnit.fromHourMinute(15, 30),
   *   TimeUnit.fromHourMinute(14, 0), 
   *   { pixelsPerUnit: 100, viewportWidth: 1000, centerPosition: 0.5 }
   * )
   * // Result: 650 pixels (1.5 hours * 100 pixels/hour + 500px center)
   */
  static getTimePosition(
    targetTime: TimeUnit,
    centerTime: TimeUnit,
    config: PositionConfig
  ): number {
    // Use the shortest path distance (handles wrapping)
    const hourDifference = centerTime.distanceFrom(targetTime)
    
    // Convert to pixel offset from center
    const pixelOffset = hourDifference * config.pixelsPerUnit
    
    // Return absolute position on screen
    return config.viewportWidth * config.centerPosition + pixelOffset
  }

  /**
   * Converts a pixel position back to a time relative to center time.
   * 
   * @param pixelPosition Absolute pixel position on screen
   * @param centerTime Reference center time
   * @param config Position configuration  
   * @returns TimeUnit corresponding to the pixel position
   * 
   * @example
   * // Convert pixel position 650 to time when 14:00 is center (viewport 1000px wide)
   * const time = TimePositionCalculator.getTimeFromPosition(
   *   650,
   *   TimeUnit.fromHourMinute(14, 0),
   *   { pixelsPerUnit: 100, viewportWidth: 1000, centerPosition: 0.5 }
   * )
   * // Result: 15:30 (1.5 hours after center)
   */
  static getTimeFromPosition(
    pixelPosition: number,
    centerTime: TimeUnit,
    config: PositionConfig,
    snapToInterval: boolean = true
  ): TimeUnit {
    // Calculate pixel offset from center
    const centerPixel = config.viewportWidth * config.centerPosition
    const pixelOffset = pixelPosition - centerPixel
    
    // Convert to hour offset
    let hourOffset = pixelOffset / config.pixelsPerUnit
    
    // Optionally snap to reasonable intervals (e.g., 15 minutes)
    if (snapToInterval) {
      const snapIntervalHours = 0.25 // 15 minutes
      hourOffset = Math.round(hourOffset / snapIntervalHours) * snapIntervalHours
    }
    
    // Create new time with offset (wrapping handled by TimeUnit)
    return centerTime.add(hourOffset)
  }

  /**
   * Calculates detailed position information for a time including visibility.
   * 
   * @param targetTime Time to analyze
   * @param centerTime Reference center time
   * @param config Position configuration
   * @returns Complete position information
   */
  static getTimePositionInfo(
    targetTime: TimeUnit,
    centerTime: TimeUnit, 
    config: PositionConfig
  ): TimePosition {
    const pixelPosition = this.getTimePosition(targetTime, centerTime, config)
    const screenPercentage = pixelPosition / config.viewportWidth
    
    // Consider visible if within viewport with some margin
    const isVisible = screenPercentage >= -0.1 && screenPercentage <= 1.1
    
    return {
      time: targetTime,
      pixelPosition,
      isVisible,
      screenPercentage
    }
  }

  /**
   * Filters a list of times to only those visible on screen.
   * 
   * @param times Array of time units to filter
   * @param centerTime Reference center time
   * @param config Position configuration
   * @returns Only times that would be visible on screen
   */
  static getVisibleTimes(
    times: TimeUnit[],
    centerTime: TimeUnit,
    config: PositionConfig
  ): TimePosition[] {
    return times
      .map(time => this.getTimePositionInfo(time, centerTime, config))
      .filter(info => info.isVisible)
  }

  /**
   * Calculates the optimal spacing for time labels based on available space.
   * 
   * @param totalTimes Number of time units in visible range
   * @param viewportWidth Available screen width
   * @param minSpacing Minimum pixels between labels
   * @returns Optimal interval between displayed labels
   */
  static calculateLabelInterval(
    totalTimes: number,
    viewportWidth: number, 
    minSpacing: number = 80
  ): number {
    const maxLabels = Math.floor(viewportWidth / minSpacing)
    return Math.max(1, Math.ceil(totalTimes / maxLabels))
  }

  /**
   * Determines appropriate time label format based on zoom level and position.
   * 
   * @param time Time to format
   * @param granularityMinutes Current granularity in minutes
   * @param isMainLabel Whether this is a major tick mark
   * @returns Formatted time string
   */
  static formatTimeLabel(
    time: TimeUnit, 
    granularityMinutes: number,
    isMainLabel: boolean = false
  ): string {
    const hour = time.getHour()
    const minute = time.getMinute()
    
    // For hourly or larger intervals, show full time
    if (granularityMinutes >= 60) {
      if (isMainLabel || hour % 6 === 0) {
        // Show full 12-hour format for major labels
        return time.format12Hour()
      } else if (hour % 3 === 0) {
        // Show abbreviated format for medium labels
        const isPM = hour >= 12
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
        return `${displayHour}${isPM ? 'PM' : 'AM'}`
      } else {
        // Show hour only for minor labels
        return hour.toString()
      }
    }
    
    // For sub-hourly intervals
    if (granularityMinutes >= 15) {
      if (minute === 0) {
        // Top of hour - show hour
        return isMainLabel ? time.format12Hour() : hour.toString()
      } else {
        // Show minutes only
        return `:${minute.toString().padStart(2, '0')}`
      }
    }
    
    // For very fine granularity, always show full time
    return time.format24Hour()
  }

  /**
   * Calculates tick mark height based on time significance.
   * 
   * @param time Time unit to analyze
   * @param granularityMinutes Current granularity in minutes
   * @returns Height level (1 = small, 2 = medium, 3 = large, 4 = extra large)
   */
  static getTickHeight(time: TimeUnit, granularityMinutes: number): number {
    const hour = time.getHour()
    const minute = time.getMinute()
    
    // Midnight and noon get the tallest ticks
    if ((hour === 0 || hour === 12) && minute === 0) {
      return 4 // Extra large
    }
    
    // Every 6 hours (6 AM, 6 PM) get large ticks
    if (hour % 6 === 0 && minute === 0) {
      return 3 // Large
    }
    
    // Every 3 hours get medium ticks
    if (hour % 3 === 0 && minute === 0) {
      return 2 // Medium
    }
    
    // Top of every hour gets medium tick
    if (minute === 0) {
      return 2 // Medium
    }
    
    // For sub-hourly granularity
    if (granularityMinutes <= 30 && minute % 30 === 0) {
      return 2 // Medium for half-hours
    }
    
    if (granularityMinutes <= 15 && minute % 15 === 0) {
      return 1 // Small for quarter-hours
    }
    
    return 1 // Small for everything else
  }

  /**
   * Pre-calculates positions for a range of times for better performance.
   * 
   * @param times Array of time units
   * @param centerTime Reference center time
   * @param config Position configuration
   * @returns Map of time values to their calculated positions
   */
  static precalculatePositions(
    times: TimeUnit[],
    centerTime: TimeUnit,
    config: PositionConfig
  ): Map<number, TimePosition> {
    const positionMap = new Map<number, TimePosition>()
    
    for (const time of times) {
      const position = this.getTimePositionInfo(time, centerTime, config)
      positionMap.set(time.getValue(), position)
    }
    
    return positionMap
  }
}