/**
 * Value object representing scroll position state.
 * 
 * Encapsulates scroll state in an immutable way following Clean Architecture principles.
 * Generic to work with both time and date values.
 */

export class ScrollPosition<T> {
  constructor(
    public readonly centerValue: T,
    public readonly scrollOffset: number = 0,
    public readonly isScrolling: boolean = false,
    public readonly lastScrollTime: number = Date.now()
  ) {}

  /**
   * Creates a new ScrollPosition with updated center value.
   */
  withCenterValue(newCenterValue: T): ScrollPosition<T> {
    return new ScrollPosition(
      newCenterValue,
      this.scrollOffset,
      this.isScrolling,
      Date.now()
    )
  }

  /**
   * Creates a new ScrollPosition with updated scroll offset.
   */
  withScrollOffset(newOffset: number): ScrollPosition<T> {
    return new ScrollPosition(
      this.centerValue,
      newOffset,
      true, // Scrolling when offset changes
      Date.now()
    )
  }

  /**
   * Creates a new ScrollPosition with scrolling ended.
   */
  withScrollEnded(): ScrollPosition<T> {
    return new ScrollPosition(
      this.centerValue,
      0, // Reset offset when scrolling ends
      false,
      this.lastScrollTime
    )
  }

  /**
   * Checks if enough time has passed since last scroll for debouncing.
   */
  shouldDebounce(debounceMs: number): boolean {
    return Date.now() - this.lastScrollTime < debounceMs
  }

  /**
   * Creates initial scroll position.
   */
  static initial<T>(centerValue: T): ScrollPosition<T> {
    return new ScrollPosition(centerValue)
  }
}