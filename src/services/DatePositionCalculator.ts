/**
 * Service for calculating positions and conversions between dates and pixel coordinates
 * in the infinite scrolling date picker.
 * 
 * Handles the mathematical relationship between date differences and screen positions.
 */

export interface PositionConfig {
  pixelsPerDay: number
  viewportWidth: number
  centerPosition: number  // Usually 50% (0.5)
}

export interface DatePosition {
  date: Date
  pixelPosition: number
  isVisible: boolean
  screenPercentage: number
}

export class DatePositionCalculator {
  /**
   * Calculates the pixel position of a date relative to a center date.
   * 
   * @param targetDate Date to calculate position for
   * @param centerDate Reference center date 
   * @param config Position configuration including pixels per day
   * @returns Pixel offset from center position (can be negative)
   * 
   * @example
   * // Calculate position of Jan 15 when Jan 10 is center
   * const position = DatePositionCalculator.getDatePosition(
   *   new Date(2024, 0, 15),
   *   new Date(2024, 0, 10), 
   *   { pixelsPerDay: 10, viewportWidth: 1000, centerPosition: 0.5 }
   * )
   * // Result: 50 pixels (5 days * 10 pixels/day) to the right of center
   */
  static getDatePosition(
    targetDate: Date,
    centerDate: Date,
    config: PositionConfig
  ): number {
    // Calculate day difference (positive = after center, negative = before center)
    const dayDifference = this.daysBetween(centerDate, targetDate)
    
    // Convert to pixel offset from center
    const pixelOffset = dayDifference * config.pixelsPerDay
    
    // Return absolute position on screen
    return config.viewportWidth * config.centerPosition + pixelOffset
  }

  /**
   * Converts a pixel position back to a date relative to center date.
   * 
   * @param pixelPosition Absolute pixel position on screen
   * @param centerDate Reference center date
   * @param config Position configuration  
   * @returns Date corresponding to the pixel position
   * 
   * @example
   * // Convert pixel position 550 to date when Jan 10 is center (viewport 1000px wide)
   * const date = DatePositionCalculator.getDateFromPosition(
   *   550,
   *   new Date(2024, 0, 10),
   *   { pixelsPerDay: 10, viewportWidth: 1000, centerPosition: 0.5 }
   * )
   * // Result: Jan 15 (5 days after center)
   */
  static getDateFromPosition(
    pixelPosition: number,
    centerDate: Date,
    config: PositionConfig
  ): Date {
    // Calculate pixel offset from center
    const centerPixel = config.viewportWidth * config.centerPosition
    const pixelOffset = pixelPosition - centerPixel
    
    // Convert to day offset
    const dayOffset = Math.round(pixelOffset / config.pixelsPerDay)
    
    // Create new date with offset
    const resultDate = new Date(centerDate)
    resultDate.setDate(centerDate.getDate() + dayOffset)
    
    return resultDate
  }

  /**
   * Calculates detailed position information for a date including visibility.
   * 
   * @param targetDate Date to analyze
   * @param centerDate Reference center date
   * @param config Position configuration
   * @returns Complete position information
   */
  static getDatePositionInfo(
    targetDate: Date,
    centerDate: Date, 
    config: PositionConfig
  ): DatePosition {
    const pixelPosition = this.getDatePosition(targetDate, centerDate, config)
    const screenPercentage = pixelPosition / config.viewportWidth
    
    // Consider visible if within viewport with some margin
    const isVisible = screenPercentage >= -0.1 && screenPercentage <= 1.1
    
    return {
      date: targetDate,
      pixelPosition,
      isVisible,
      screenPercentage
    }
  }

  /**
   * Filters a list of dates to only those visible on screen.
   * 
   * @param dates Array of dates to filter
   * @param centerDate Reference center date
   * @param config Position configuration
   * @returns Only dates that would be visible on screen
   */
  static getVisibleDates(
    dates: Date[],
    centerDate: Date,
    config: PositionConfig
  ): DatePosition[] {
    return dates
      .map(date => this.getDatePositionInfo(date, centerDate, config))
      .filter(info => info.isVisible)
  }

  /**
   * Calculates the optimal spacing for date labels based on available space.
   * 
   * @param totalDates Number of dates in visible range
   * @param viewportWidth Available screen width
   * @param minSpacing Minimum pixels between labels
   * @returns Optimal interval between displayed labels
   */
  static calculateLabelInterval(
    totalDates: number,
    viewportWidth: number, 
    minSpacing: number = 60
  ): number {
    const maxLabels = Math.floor(viewportWidth / minSpacing)
    return Math.ceil(totalDates / maxLabels)
  }

  /**
   * Helper method to calculate days between two dates.
   * Same implementation as DateRangeCalculator for consistency.
   */
  private static daysBetween(date1: Date, date2: Date): number {
    const msPerDay = 24 * 60 * 60 * 1000
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate())
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate())
    return Math.floor((utc2 - utc1) / msPerDay)
  }
}