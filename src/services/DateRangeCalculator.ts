/**
 * Service for calculating date ranges for infinite scrolling date picker.
 * 
 * Handles dynamic generation of date windows around a center date,
 * ensuring seamless month/year transitions without keeping all dates in memory.
 */

export interface DateRange {
  dates: Date[]
  centerIndex: number
  startDate: Date
  endDate: Date
}

export interface DateRangeConfig {
  daysBefore: number
  daysAfter: number
}

export class DateRangeCalculator {
  /**
   * Generates a date range around a center date with specified buffer zones.
   * 
   * @param centerDate The center date for the range
   * @param config Configuration specifying days before and after center
   * @returns DateRange with generated dates and metadata
   * 
   * @example
   * // Generate 50 days before and after 2024-01-15
   * const range = DateRangeCalculator.generateRange(
   *   new Date(2024, 0, 15),
   *   { daysBefore: 50, daysAfter: 50 }
   * )
   * // Result: 101 dates from 2023-11-26 to 2024-03-05
   */
  static generateRange(centerDate: Date, config: DateRangeConfig): DateRange {
    const dates: Date[] = []
    
    // Generate dates before center (in reverse chronological order, then reverse)
    const beforeDates: Date[] = []
    for (let i = config.daysBefore; i > 0; i--) {
      const date = new Date(centerDate)
      date.setDate(centerDate.getDate() - i)
      beforeDates.push(date)
    }
    
    // Add all before dates to main array
    dates.push(...beforeDates)
    
    // Add center date
    const centerIndex = dates.length
    dates.push(new Date(centerDate))
    
    // Generate dates after center
    for (let i = 1; i <= config.daysAfter; i++) {
      const date = new Date(centerDate)
      date.setDate(centerDate.getDate() + i)
      dates.push(date)
    }
    
    return {
      dates,
      centerIndex,
      startDate: dates[0],
      endDate: dates[dates.length - 1]
    }
  }
  
  /**
   * Calculates the number of days between two dates.
   * Positive result means date2 is after date1.
   * 
   * @param date1 First date
   * @param date2 Second date  
   * @returns Number of days difference (can be negative)
   * 
   * @example
   * // Calculate days from Jan 1 to Jan 15
   * const days = DateRangeCalculator.daysBetween(
   *   new Date(2024, 0, 1),
   *   new Date(2024, 0, 15)
   * )
   * // Result: 14
   */
  static daysBetween(date1: Date, date2: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate())
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate())
    return Math.floor((utc2 - utc1) / msPerDay)
  }
  
  /**
   * Checks if a given date needs to trigger a range recalculation.
   * Used to determine when scrolling has moved close enough to buffer boundaries.
   * 
   * @param currentDate Date currently being viewed
   * @param range Current date range
   * @param bufferThreshold How close to edges before recalculation (days)
   * @returns True if recalculation is needed
   * 
   * @example
   * // Check if user is within 20 days of range boundaries
   * const needsRecalc = DateRangeCalculator.needsRecalculation(
   *   currentViewDate,
   *   currentRange,
   *   20
   * )
   */
  static needsRecalculation(
    currentDate: Date, 
    range: DateRange, 
    bufferThreshold: number
  ): boolean {
    const daysFromStart = this.daysBetween(range.startDate, currentDate)
    const daysFromEnd = this.daysBetween(currentDate, range.endDate)
    
    return daysFromStart < bufferThreshold || daysFromEnd < bufferThreshold
  }
  
  /**
   * Creates a date range shifted by a specified number of days.
   * Useful for pre-calculating the next range during buffer transitions.
   * 
   * @param originalRange Current range
   * @param shiftDays Number of days to shift (positive = forward, negative = backward)
   * @param config Range configuration to maintain same buffer sizes
   * @returns New range shifted by the specified days
   */
  static shiftRange(
    originalRange: DateRange, 
    shiftDays: number, 
    config: DateRangeConfig
  ): DateRange {
    const newCenterDate = new Date(originalRange.dates[originalRange.centerIndex])
    newCenterDate.setDate(newCenterDate.getDate() + shiftDays)
    
    return this.generateRange(newCenterDate, config)
  }
}