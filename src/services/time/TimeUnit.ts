/**
 * Value object representing a time unit with 24-hour wrapping logic.
 * 
 * Encapsulates time operations while handling midnight boundaries seamlessly.
 * Uses decimal hours for smooth calculations (e.g., 14.5 = 2:30 PM).
 */

import { ScrollableUnit } from '../base/IVirtualScrollManager'

export class TimeUnit implements ScrollableUnit<number> {
  private readonly _hours: number

  constructor(hours: number) {
    // Normalize hours to 0-23.999... range with wrapping
    this._hours = this.normalizeHours(hours)
  }

  /**
   * Gets the hours value (0-23.999...).
   */
  getValue(): number {
    return this._hours
  }

  /**
   * Gets the hour component (0-23).
   */
  getHour(): number {
    return Math.floor(this._hours)
  }

  /**
   * Gets the minute component (0-59).
   */
  getMinute(): number {
    return Math.floor((this._hours % 1) * 60)
  }

  /**
   * Gets the second component (0-59).
   */
  getSecond(): number {
    const minuteDecimal = (this._hours % 1) * 60
    return Math.floor((minuteDecimal % 1) * 60)
  }

  /**
   * Adds hours with automatic wrapping.
   */
  add(hours: number): TimeUnit {
    return new TimeUnit(this._hours + hours)
  }

  /**
   * Subtracts hours with automatic wrapping.
   */
  subtract(hours: number): TimeUnit {
    return new TimeUnit(this._hours - hours)
  }

  /**
   * Calculates the shortest distance between two times.
   * 
   * Handles wrapping (e.g., distance from 23:00 to 01:00 is 2 hours, not 22).
   * Positive result means the other time is in the future (clockwise).
   * 
   * @param other The other time unit
   * @returns Hours difference (-12 to +12)
   */
  distanceFrom(other: TimeUnit): number {
    const diff = other._hours - this._hours
    
    // Handle wrapping - choose shortest path around the clock
    if (diff > 12) {
      return diff - 24  // Go backwards instead
    } else if (diff < -12) {
      return diff + 24  // Go forwards instead
    }
    
    return diff
  }

  /**
   * Calculates the absolute distance between two times.
   * Always returns positive value representing shortest path.
   */
  absoluteDistanceFrom(other: TimeUnit): number {
    return Math.abs(this.distanceFrom(other))
  }

  /**
   * Checks if this time is within a specified range of another time.
   */
  isWithinRange(other: TimeUnit, rangeHours: number): boolean {
    return this.absoluteDistanceFrom(other) <= rangeHours
  }

  /**
   * Rounds to the nearest interval (e.g., nearest 15 minutes).
   */
  roundToInterval(intervalHours: number): TimeUnit {
    const rounded = Math.round(this._hours / intervalHours) * intervalHours
    return new TimeUnit(rounded)
  }

  /**
   * Formats as 12-hour time string (e.g., "2:30 PM").
   */
  format12Hour(): string {
    const hour = this.getHour()
    const minute = this.getMinute()
    const isPM = hour >= 12
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    
    return `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`
  }

  /**
   * Formats as 24-hour time string (e.g., "14:30").
   */
  format24Hour(): string {
    const hour = this.getHour()
    const minute = this.getMinute()
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  }

  /**
   * Creates a TimeUnit from hour and minute components.
   */
  static fromHourMinute(hour: number, minute: number = 0, second: number = 0): TimeUnit {
    const decimalHours = hour + minute / 60 + second / 3600
    return new TimeUnit(decimalHours)
  }

  /**
   * Creates a TimeUnit from the current time.
   */
  static now(): TimeUnit {
    const now = new Date()
    return TimeUnit.fromHourMinute(now.getHours(), now.getMinutes(), now.getSeconds())
  }

  /**
   * Creates a TimeUnit representing midnight (00:00).
   */
  static midnight(): TimeUnit {
    return new TimeUnit(0)
  }

  /**
   * Creates a TimeUnit representing noon (12:00).
   */
  static noon(): TimeUnit {
    return new TimeUnit(12)
  }

  /**
   * Normalizes hours to 0-23.999... range with proper wrapping.
   */
  private normalizeHours(hours: number): number {
    // Use modulo with proper handling of negative numbers
    const normalized = ((hours % 24) + 24) % 24
    
    // Ensure we don't have exactly 24.0 (should wrap to 0.0)
    return normalized >= 24 ? 0 : normalized
  }

  /**
   * Equality comparison.
   */
  equals(other: TimeUnit): boolean {
    return Math.abs(this._hours - other._hours) < 0.001 // Allow for floating point precision
  }

  /**
   * String representation.
   */
  toString(): string {
    return this.format24Hour()
  }
}