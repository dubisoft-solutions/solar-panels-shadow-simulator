export interface PanelSpecs {
  length: number    // Panel long side (m)
  width: number     // Panel short side (m)
  thickness: number // Panel thickness (m)
}

export interface PlatformSpecs {
  tiltAngle: number // Tilt angle in degrees
  length: number    // Platform length (m)
  thickness: number // Platform thickness (m)
  panelMountOffset?: number // Panel mount offset from platform start (m)
  orientation: PanelOrientation // Panel orientation
}

export type PanelOrientation = 'landscape' | 'portrait'

export interface SpacingCalculation {
  projectedDepth: number    // D: Projected panel depth on roof (m)
  airGap: number           // G: Air gap between panels (m)
  rowSpacing: number       // Total spacing between panel centers (m)
  tiltAxisDimension: number // The dimension used as tilt axis
  platformLength: number   // Platform length (m)
  singleColWidth: number   // Width of a single column (m)
  platformThickness: number // Thickness of the platform (m)
  panelMountOffset: number // Panel mount offset from platform start (m)
}

export class PanelSpacingService {
  /**
   * Get the tilt axis dimension based on panel orientation
   * Landscape: tilt axis is panel width (short side)
   * Portrait: tilt axis is panel length (long side)
   */
  static getTiltAxisDimension(panelSpecs: PanelSpecs, orientation: PanelOrientation): number {
    return orientation === 'portrait' ? panelSpecs.length : panelSpecs.width
  }

  /**
   * Calculate the projected panel depth on the roof based on tilt angle and orientation
   * Formula: D = tiltAxisDimension * cos(β)
   * Where:
   * - D = Projected panel depth on roof
   * - tiltAxisDimension = Panel dimension along tilt axis (width for landscape, length for portrait)
   * - β = Tilt angle in radians
   */
  static calculateProjectedDepth(
    panelSpecs: PanelSpecs,
    platformSpecs: PlatformSpecs
  ): number {
    const beta = platformSpecs.tiltAngle * Math.PI / 180  // Convert to radians
    const tiltAxisDimension = this.getTiltAxisDimension(panelSpecs, platformSpecs.orientation)
    return tiltAxisDimension * Math.cos(beta)
  }

  /**
   * Calculate the air gap between panels given the connector length
   * Formula: G = connectorLength - D
   * Where:
   * - G = Air gap
   * - connectorLength = Total row pitch/spacing
   * - D = Projected panel depth on roof
   */
  static calculateAirGap(projectedDepth: number, connectorLength: number): number {
    return connectorLength - projectedDepth
  }

  /**
   * Calculate complete spacing information for solar panel rows
   */
  static calculateSpacing(
    panelSpecs: PanelSpecs,
    platformSpecs: PlatformSpecs,
    connectorLength: number
  ): SpacingCalculation {
    const orientation = platformSpecs.orientation
    const tiltAxisDimension = this.getTiltAxisDimension(panelSpecs, orientation)
    const projectedDepth = this.calculateProjectedDepth(panelSpecs, platformSpecs)
    const airGap = this.calculateAirGap(projectedDepth, connectorLength)

    return {
      projectedDepth,
      airGap,
      rowSpacing: connectorLength,  // Total spacing between panel centers
      platformLength: platformSpecs.length,
      tiltAxisDimension,
      singleColWidth: orientation === 'landscape' ? panelSpecs.length : panelSpecs.width,
      platformThickness: platformSpecs.thickness,
      panelMountOffset: platformSpecs.panelMountOffset || 0.05
    }
  }

  /**
   * Get human-readable spacing information
   */
  static getSpacingInfo(
    panelSpecs: PanelSpecs,
    platformSpecs: PlatformSpecs,
    connectorLength: number
  ): {
    projectedDepthMm: number
    airGapMm: number
    rowSpacingMm: number
    tiltAxisDimensionMm: number
    orientation: PanelOrientation
    description: string
  } {
    const spacing = this.calculateSpacing(panelSpecs, platformSpecs, connectorLength)
    const orientation = platformSpecs.orientation
    
    return {
      projectedDepthMm: Math.round(spacing.projectedDepth * 1000),
      airGapMm: Math.round(spacing.airGap * 1000),
      rowSpacingMm: Math.round(spacing.rowSpacing * 1000),
      tiltAxisDimensionMm: Math.round(spacing.tiltAxisDimension * 1000),
      orientation,
      description: `${orientation === 'portrait' ? 'Portrait' : 'Landscape'} mode: Panel projected depth ${Math.round(spacing.projectedDepth * 1000)}mm, Air gap ${Math.round(spacing.airGap * 1000)}mm`
    }
  }

  /**
   * Get panel dimensions based on orientation
   */
  static getPanelDimensions(panelSpecs: PanelSpecs, orientation: PanelOrientation): { length: number; width: number; thickness: number } {
    return orientation === 'landscape'
      ? { length: panelSpecs.length, width: panelSpecs.width, thickness: panelSpecs.thickness }
      : { length: panelSpecs.width, width: panelSpecs.length, thickness: panelSpecs.thickness }
  }
}