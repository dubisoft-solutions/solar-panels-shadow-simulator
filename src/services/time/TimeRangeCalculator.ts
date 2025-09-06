/**
 * Service for calculating time ranges with wrapping support for infinite time scrolling.
 * 
 * Handles dynamic generation of time windows around a center time,
 * ensuring seamless 24-hour transitions without keeping all possible times in memory.
 */

import { TimeUnit } from './TimeUnit'
import { VirtualRange } from '../base/IVirtualScrollManager'

export interface TimeRange extends VirtualRange<number> {
  timeUnits: TimeUnit[]
  centerIndex: number
  startTime: TimeUnit
  endTime: TimeUnit
}

export interface TimeRangeConfig {
  hoursBefore: number
  hoursAfter: number
  granularityMinutes?: number  // Default: 60 (1-hour intervals)
}

export class TimeRangeCalculator {
  /**
   * Generates a time range around a center time with specified buffer zones.
   * 
   * @param centerTime The center time for the range
   * @param config Configuration specifying hours before/after and granularity
   * @returns TimeRange with generated time units and metadata
   * 
   * @example
   * // Generate 6 hours before and after 14:30 with 30-minute intervals
   * const range = TimeRangeCalculator.generateRange(
   *   TimeUnit.fromHourMinute(14, 30),
   *   { hoursBefore: 6, hoursAfter: 6, granularityMinutes: 30 }
   * )
   * // Result: 25 time units from 08:30 to 20:30
   */
  static generateRange(centerTime: TimeUnit, config: TimeRangeConfig): TimeRange {
    const granularityHours = (config.granularityMinutes || 60) / 60
    const timeUnits: TimeUnit[] = []
    const numberValues: number[] = []
    
    // Calculate total intervals needed
    const intervalsBefore = Math.ceil(config.hoursBefore / granularityHours)
    const intervalsAfter = Math.ceil(config.hoursAfter / granularityHours)
    
    // Generate times before center (going backwards)
    for (let i = intervalsBefore; i > 0; i--) {
      const time = centerTime.subtract(i * granularityHours)
      timeUnits.push(time)
      numberValues.push(time.getValue())
    }
    
    // Add center time
    const centerIndex = timeUnits.length
    timeUnits.push(centerTime)
    numberValues.push(centerTime.getValue())
    
    // Generate times after center (going forwards)
    for (let i = 1; i <= intervalsAfter; i++) {
      const time = centerTime.add(i * granularityHours)
      timeUnits.push(time)
      numberValues.push(time.getValue())
    }
    
    return {
      timeUnits,
      items: timeUnits, // Satisfy VirtualRange interface
      centerIndex,
      startTime: timeUnits[0],
      endTime: timeUnits[timeUnits.length - 1],
      startValue: numberValues[0],
      endValue: numberValues[numberValues.length - 1]
    }
  }

  /**
   * Checks if a given time needs to trigger a range recalculation.
   * Used to determine when scrolling has moved close enough to buffer boundaries.
   * 
   * @param currentTime Time currently being viewed
   * @param range Current time range
   * @param bufferThreshold How close to edges before recalculation (hours)
   * @returns True if recalculation is needed
   */
  static needsRecalculation(
    currentTime: TimeUnit, 
    range: TimeRange, 
    bufferThreshold: number
  ): boolean {
    // Find the closest time unit in the range
    let closestDistance = Infinity
    let closestIndex = -1
    
    for (let i = 0; i < range.timeUnits.length; i++) {
      const distance = currentTime.absoluteDistanceFrom(range.timeUnits[i])
      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = i
      }
    }
    
    if (closestIndex === -1) return true
    
    // Check if we're too close to either end of the range
    const distanceFromStart = closestIndex
    const distanceFromEnd = range.timeUnits.length - 1 - closestIndex
    
    return distanceFromStart <= bufferThreshold || distanceFromEnd <= bufferThreshold
  }

  /**
   * Creates a time range shifted by a specified number of hours.
   * Useful for pre-calculating the next range during buffer transitions.
   * 
   * @param originalRange Current range
   * @param shiftHours Number of hours to shift (positive = forward, negative = backward)
   * @param config Range configuration to maintain same buffer sizes
   * @returns New range shifted by the specified hours
   */
  static shiftRange(
    originalRange: TimeRange, 
    shiftHours: number, 
    config: TimeRangeConfig
  ): TimeRange {
    const currentCenterTime = originalRange.timeUnits[originalRange.centerIndex]
    const newCenterTime = currentCenterTime.add(shiftHours)
    
    return this.generateRange(newCenterTime, config)
  }

  /**
   * Generates a continuous time range that spans multiple days if needed.
   * Useful for very large buffer zones that cross midnight multiple times.
   * 
   * @param centerTime Center time
   * @param totalHours Total hours to span (will be split before/after center)
   * @param granularityMinutes Granularity in minutes
   * @returns Extended range that may span multiple days
   */
  static generateExtendedRange(
    centerTime: TimeUnit,
    totalHours: number,
    granularityMinutes: number = 60
  ): TimeRange {
    const halfHours = totalHours / 2
    return this.generateRange(centerTime, {
      hoursBefore: halfHours,
      hoursAfter: halfHours,
      granularityMinutes
    })
  }

  /**
   * Creates time ranges optimized for different zoom levels.
   * 
   * @param centerTime Center time
   * @param zoomLevel Zoom level (1 = hour view, 2 = 30min view, 4 = 15min view, etc.)
   * @returns Range optimized for the specified zoom level
   */
  static generateZoomedRange(centerTime: TimeUnit, zoomLevel: number): TimeRange {
    // Adjust buffer size and granularity based on zoom level
    const baseHours = 12 / zoomLevel  // More zoom = smaller buffer
    const granularityMinutes = 60 / zoomLevel  // More zoom = finer granularity
    
    return this.generateRange(centerTime, {
      hoursBefore: baseHours,
      hoursAfter: baseHours,
      granularityMinutes: Math.max(5, granularityMinutes) // Minimum 5-minute intervals
    })
  }

  /**
   * Optimizes a range by removing time units that are too far from the viewport.
   * Used for performance optimization when ranges become very large.
   * 
   * @param range Original range
   * @param centerTime Current center time
   * @param maxDistance Maximum distance in hours to keep
   * @returns Optimized range with fewer items
   */
  static optimizeRange(
    range: TimeRange,
    centerTime: TimeUnit,
    maxDistance: number
  ): TimeRange {
    const optimizedTimeUnits = range.timeUnits.filter(timeUnit =>
      timeUnit.absoluteDistanceFrom(centerTime) <= maxDistance
    )
    
    if (optimizedTimeUnits.length === 0) {
      // Fallback: include at least the center time
      optimizedTimeUnits.push(centerTime)
    }
    
    // Find new center index
    let newCenterIndex = 0
    let closestDistance = Infinity
    
    for (let i = 0; i < optimizedTimeUnits.length; i++) {
      const distance = optimizedTimeUnits[i].absoluteDistanceFrom(centerTime)
      if (distance < closestDistance) {
        closestDistance = distance
        newCenterIndex = i
      }
    }
    
    return {
      timeUnits: optimizedTimeUnits,
      items: optimizedTimeUnits,
      centerIndex: newCenterIndex,
      startTime: optimizedTimeUnits[0],
      endTime: optimizedTimeUnits[optimizedTimeUnits.length - 1],
      startValue: optimizedTimeUnits[0].getValue(),
      endValue: optimizedTimeUnits[optimizedTimeUnits.length - 1].getValue()
    }
  }
}