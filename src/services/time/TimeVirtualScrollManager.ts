/**
 * Service for managing virtual scrolling state and viewport management
 * in the infinite scrolling time picker.
 * 
 * Handles time-specific scroll position tracking, buffer management with 24-hour wrapping,
 * and smooth transitions between time ranges while maintaining performance.
 */

import { TimeUnit } from './TimeUnit'
import { TimeRange, TimeRangeConfig, TimeRangeCalculator } from './TimeRangeCalculator'
import { TimePositionCalculator, TimePosition } from './TimePositionCalculator'
import { IVirtualScrollManager, PositionConfig, ViewportConfig } from '../base/IVirtualScrollManager'
import { ScrollPosition } from '../base/ScrollPosition'

export interface TimeScrollManagerState {
  scrollPosition: ScrollPosition<TimeUnit>
  currentRange: TimeRange | null
  positionConfig: PositionConfig
  viewportConfig: ViewportConfig
  timeRangeConfig: TimeRangeConfig
}

export class TimeVirtualScrollManager implements IVirtualScrollManager<number> {
  private state: TimeScrollManagerState
  private debounceTimer: NodeJS.Timeout | null = null

  constructor(
    initialTime: TimeUnit,
    positionConfig: PositionConfig,
    viewportConfig: ViewportConfig,
    timeRangeConfig: TimeRangeConfig = { 
      hoursBefore: 6, 
      hoursAfter: 6, 
      granularityMinutes: 60 
    }
  ) {
    this.state = {
      scrollPosition: ScrollPosition.initial(initialTime),
      currentRange: null,
      positionConfig,
      viewportConfig,
      timeRangeConfig
    }

    // Initialize the first time range
    this.initializeRange()
  }

  /**
   * Initializes or recalculates the time range around the current center time.
   */
  private initializeRange(): void {
    this.state.currentRange = TimeRangeCalculator.generateRange(
      this.state.scrollPosition.centerValue,
      this.state.timeRangeConfig
    )
  }

  /**
   * Updates the center time and triggers range recalculation if necessary.
   * 
   * @param newCenterTime New center time to focus on
   * @param forceRecalculation Force range recalculation even if within buffer
   * @returns True if range was recalculated
   */
  updateCenterValue(newCenterTime: number, forceRecalculation: boolean = false): boolean {
    const timeUnit = new TimeUnit(newCenterTime)
    const oldScrollPosition = this.state.scrollPosition
    this.state.scrollPosition = oldScrollPosition.withCenterValue(timeUnit)

    // Check if we need to recalculate the range
    const needsRecalc = forceRecalculation || 
      !this.state.currentRange ||
      TimeRangeCalculator.needsRecalculation(
        timeUnit,
        this.state.currentRange,
        this.state.viewportConfig.bufferThreshold
      )

    if (needsRecalc) {
      this.initializeRange()
      return true
    }

    return false
  }

  /**
   * Handles scroll/drag movement by converting pixel offset to time changes.
   * 
   * @param pixelOffset Pixel movement from drag start
   * @param startTime Time at drag start position (as number)
   * @returns New center time after applying movement (as number)
   */
  handleScrollMovement(pixelOffset: number, startTime: number): number {
    // Calculate new time based on pixel movement
    const hourOffset = pixelOffset / this.state.positionConfig.pixelsPerUnit
    const newTimeValue = startTime + hourOffset
    
    // Wrap to 24-hour range
    const wrappedTime = ((newTimeValue % 24) + 24) % 24
    
    // Update center time (may trigger range recalculation)
    this.updateCenterValue(wrappedTime)
    
    return wrappedTime
  }

  /**
   * Handles end of scroll/drag with optional snapping.
   * 
   * @param snapToNearestUnit Whether to snap to the nearest time interval
   * @returns Final center time after any snapping (as number)
   */
  handleScrollEnd(snapToNearestUnit: boolean = true): number {
    this.state.scrollPosition = this.state.scrollPosition.withScrollEnded()

    if (snapToNearestUnit) {
      // Snap to the nearest interval based on granularity
      const granularityHours = (this.state.timeRangeConfig.granularityMinutes || 60) / 60
      const snappedTime = this.state.scrollPosition.centerValue.roundToInterval(granularityHours)
      this.updateCenterValue(snappedTime.getValue())
    }

    return this.state.scrollPosition.centerValue.getValue()
  }

  /**
   * Gets the current visible time items with position information.
   * 
   * @returns Array of visible times with their calculated positions
   */
  getVisibleItems(): Array<{
    value: number
    pixelPosition: number
    isVisible: boolean
    screenPercentage: number
  }> {
    if (!this.state.currentRange) {
      return []
    }

    const visibleTimes = TimePositionCalculator.getVisibleTimes(
      this.state.currentRange.timeUnits,
      this.state.scrollPosition.centerValue,
      this.state.positionConfig
    )

    // Convert TimePosition to the interface format
    return visibleTimes.map(timePos => ({
      value: timePos.time.getValue(),
      pixelPosition: timePos.pixelPosition,
      isVisible: timePos.isVisible,
      screenPercentage: timePos.screenPercentage
    }))
  }

  /**
   * Gets detailed time positions for UI rendering.
   * 
   * @returns Array of TimePosition objects with full time information
   */
  getDetailedVisibleTimes(): TimePosition[] {
    if (!this.state.currentRange) {
      return []
    }

    return TimePositionCalculator.getVisibleTimes(
      this.state.currentRange.timeUnits,
      this.state.scrollPosition.centerValue,
      this.state.positionConfig
    )
  }

  /**
   * Gets the complete current state for external use.
   */
  getCurrentState(): TimeScrollManagerState {
    return { ...this.state }
  }

  /**
   * Updates position configuration (e.g., when viewport size changes).
   */
  updatePositionConfig(newConfig: Partial<PositionConfig>): void {
    this.state.positionConfig = { ...this.state.positionConfig, ...newConfig }
  }

  /**
   * Updates viewport configuration.
   */
  updateViewportConfig(newConfig: Partial<ViewportConfig>): void {
    this.state.viewportConfig = { ...this.state.viewportConfig, ...newConfig }
  }

  /**
   * Updates time range configuration (e.g., changing granularity or buffer size).
   */
  updateTimeRangeConfig(newConfig: Partial<TimeRangeConfig>): void {
    this.state.timeRangeConfig = { ...this.state.timeRangeConfig, ...newConfig }
    
    // Force recalculation with new configuration
    this.initializeRange()
  }

  /**
   * Debounced method to handle high-frequency scroll events.
   * 
   * @param callback Function to call after debounce period
   */
  debounceScroll(callback: () => void): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    this.debounceTimer = setTimeout(callback, this.state.viewportConfig.debounceMs)
  }

  /**
   * Pre-loads the next range in the scroll direction for smooth transitions.
   * This can be called in the background when approaching buffer boundaries.
   * 
   * @param direction Direction to pre-load: 1 for forward, -1 for backward
   * @returns Pre-calculated range for the specified direction
   */
  preloadNextRange(direction: 1 | -1): TimeRange {
    if (!this.state.currentRange) {
      throw new Error('Cannot preload range: no current range available')
    }

    const shiftHours = direction * Math.floor(this.state.timeRangeConfig.hoursBefore / 2)
    return TimeRangeCalculator.shiftRange(
      this.state.currentRange,
      shiftHours,
      this.state.timeRangeConfig
    )
  }

  /**
   * Adjusts the granularity dynamically based on zoom level or user preference.
   * 
   * @param granularityMinutes New granularity in minutes (5, 15, 30, 60, etc.)
   */
  setGranularity(granularityMinutes: number): void {
    this.updateTimeRangeConfig({ granularityMinutes })
  }

  /**
   * Gets the current center time as a TimeUnit for easier manipulation.
   */
  getCenterTimeUnit(): TimeUnit {
    return this.state.scrollPosition.centerValue
  }

  /**
   * Jumps directly to a specific time without animation.
   * 
   * @param targetTime Time to jump to
   */
  jumpToTime(targetTime: TimeUnit): void {
    this.updateCenterValue(targetTime.getValue(), true) // Force recalculation
  }

  /**
   * Gets the optimal label interval for current viewport and range.
   */
  getOptimalLabelInterval(): number {
    if (!this.state.currentRange) {
      return 1
    }

    return TimePositionCalculator.calculateLabelInterval(
      this.state.currentRange.timeUnits.length,
      this.state.viewportConfig.width
    )
  }

  /**
   * Cleanup method to clear timers and prevent memory leaks.
   */
  dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = null
    }
  }
}