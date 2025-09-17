/**
 * Service for managing virtual scrolling state and viewport management
 * in the infinite scrolling date picker.
 * 
 * Handles scroll position tracking, buffer management, and smooth transitions
 * between date ranges while maintaining performance.
 */

import { DateRange, DateRangeConfig, DateRangeCalculator } from './DateRangeCalculator'
import { PositionConfig, DatePositionCalculator } from './DatePositionCalculator'

export interface ScrollState {
  centerDate: Date
  scrollOffset: number
  isScrolling: boolean
  lastScrollTime: number
}

export interface ViewportConfig {
  width: number
  bufferThreshold: number  // Days from edge before recalculation
  smoothTransitions: boolean
  debounceMs: number
}

export interface ScrollManagerState {
  scrollState: ScrollState
  currentRange: DateRange | null
  positionConfig: PositionConfig
  viewportConfig: ViewportConfig
  dateRangeConfig: DateRangeConfig
}

export class VirtualScrollManager {
  private state: ScrollManagerState
  private debounceTimer: NodeJS.Timeout | null = null

  constructor(
    initialDate: Date,
    positionConfig: PositionConfig,
    viewportConfig: ViewportConfig,
    dateRangeConfig: DateRangeConfig = { daysBefore: 50, daysAfter: 50 }
  ) {
    this.state = {
      scrollState: {
        centerDate: new Date(initialDate),
        scrollOffset: 0,
        isScrolling: false,
        lastScrollTime: Date.now()
      },
      currentRange: null,
      positionConfig,
      viewportConfig,
      dateRangeConfig
    }

    // Initialize the first date range
    this.initializeRange()
  }

  /**
   * Initializes or recalculates the date range around the current center date.
   */
  private initializeRange(): void {
    this.state.currentRange = DateRangeCalculator.generateRange(
      this.state.scrollState.centerDate,
      this.state.dateRangeConfig
    )
  }

  /**
   * Updates the center date and triggers range recalculation if necessary.
   * 
   * @param newCenterDate New center date to focus on
   * @param forceRecalculation Force range recalculation even if within buffer
   * @returns True if range was recalculated
   */
  updateCenterDate(newCenterDate: Date, forceRecalculation: boolean = false): boolean {
    this.state.scrollState.centerDate = new Date(newCenterDate)
    this.state.scrollState.lastScrollTime = Date.now()

    // Check if we need to recalculate the range
    const needsRecalc = forceRecalculation || 
      !this.state.currentRange ||
      DateRangeCalculator.needsRecalculation(
        newCenterDate,
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
   * Handles scroll/drag movement by converting pixel offset to date changes.
   * 
   * @param pixelOffset Pixel movement from drag start
   * @param startDate Date at drag start position
   * @returns New center date after applying movement
   */
  handleScrollMovement(pixelOffset: number, startDate: Date): Date {
    this.state.scrollState.isScrolling = true
    this.state.scrollState.scrollOffset = pixelOffset

    // Convert pixel movement to days
    const dayOffset = pixelOffset / this.state.positionConfig.pixelsPerDay
    
    // Calculate new date
    const newDate = new Date(startDate)
    newDate.setDate(startDate.getDate() + Math.round(dayOffset))

    // Update center date (may trigger range recalculation)
    this.updateCenterDate(newDate)

    return this.state.scrollState.centerDate
  }

  /**
   * Handles end of scroll/drag with optional momentum and snapping.
   * 
   * @param snapToNearestDay Whether to snap to the nearest day
   * @returns Final center date after any snapping
   */
  handleScrollEnd(snapToNearestDay: boolean = true): Date {
    this.state.scrollState.isScrolling = false
    this.state.scrollState.scrollOffset = 0

    if (snapToNearestDay) {
      // The center date is already properly calculated, no additional snapping needed
      // since getDateFromPosition already rounds to nearest day
    }

    return this.state.scrollState.centerDate
  }

  /**
   * Gets the current visible dates with position information.
   * 
   * @returns Array of visible dates with their calculated positions
   */
  getVisibleDates() {
    if (!this.state.currentRange) {
      return []
    }

    return DatePositionCalculator.getVisibleDates(
      this.state.currentRange.dates,
      this.state.scrollState.centerDate,
      this.state.positionConfig
    )
  }

  /**
   * Gets the complete current state for external use.
   */
  getCurrentState(): ScrollManagerState {
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
  preloadNextRange(direction: 1 | -1): DateRange {
    if (!this.state.currentRange) {
      throw new Error('Cannot preload range: no current range available')
    }

    const shiftDays = direction * Math.floor(this.state.dateRangeConfig.daysBefore / 2)
    return DateRangeCalculator.shiftRange(
      this.state.currentRange,
      shiftDays,
      this.state.dateRangeConfig
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