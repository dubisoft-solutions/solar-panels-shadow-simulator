/**
 * Generic interface for virtual scroll management.
 * 
 * Defines common scrolling behavior that can be implemented 
 * by both date and time scroll managers following Clean Architecture principles.
 */

export interface ScrollPosition<T> {
  centerValue: T
  scrollOffset: number
  isScrolling: boolean
  lastScrollTime: number
}

export interface ViewportConfig {
  width: number
  bufferThreshold: number  // Units from edge before recalculation
  smoothTransitions: boolean
  debounceMs: number
}

export interface PositionConfig {
  pixelsPerUnit: number    // Generic: pixels per day or pixels per hour
  viewportWidth: number
  centerPosition: number   // Usually 50% (0.5)
}

export interface ScrollableUnit<T> {
  getValue(): T
  add(amount: number): ScrollableUnit<T>
  subtract(amount: number): ScrollableUnit<T>
  distanceFrom(other: ScrollableUnit<T>): number
}

export interface VirtualRange<T> {
  items: ScrollableUnit<T>[]
  centerIndex: number
  startValue: T
  endValue: T
}

export interface IVirtualScrollManager<T> {
  /**
   * Updates the center value and triggers range recalculation if necessary.
   */
  updateCenterValue(newCenter: T, forceRecalculation?: boolean): boolean
  
  /**
   * Handles scroll/drag movement by converting pixel offset to value changes.
   */
  handleScrollMovement(pixelOffset: number, startValue: T): T
  
  /**
   * Handles end of scroll/drag with optional snapping.
   */
  handleScrollEnd(snapToNearestUnit?: boolean): T
  
  /**
   * Gets the current visible items with position information.
   */
  getVisibleItems(): Array<{
    value: T
    pixelPosition: number
    isVisible: boolean
    screenPercentage: number
  }>
  
  /**
   * Updates position configuration (e.g., when viewport size changes).
   */
  updatePositionConfig(newConfig: Partial<PositionConfig>): void
  
  /**
   * Updates viewport configuration.
   */
  updateViewportConfig(newConfig: Partial<ViewportConfig>): void
  
  /**
   * Cleanup method to prevent memory leaks.
   */
  dispose(): void
}