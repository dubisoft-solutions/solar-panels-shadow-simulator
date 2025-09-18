import { WoodenShellConfiguration, Position3D, Dimensions3D } from '@/interfaces/WoodenShellTypes'

export interface EnergyStorageConfig {
  position: Position3D
  batteryCount: number
  battery: {
    dimensions: Dimensions3D
  }
  inverter: {
    dimensions: Dimensions3D
  }
  mounting: {
    wallOffset: number
  }
}

export class WoodenShellCalculationService {
  private static readonly BEAM_SIZE = 0.05
  private static readonly PANLAT_WIDTH = 0.022
  private static readonly PANLAT_DEPTH = 0.048
  private static readonly SHELL_PADDING = {
    sides: 0.20,
    front: 0.05,
    top: 0.20
  }

  static calculateShellConfiguration(energyStorage: EnergyStorageConfig): WoodenShellConfiguration {
    const { position, batteryCount, battery, inverter, mounting } = energyStorage

    const shellDimensions = this.calculateShellDimensions(
      inverter.dimensions,
      battery.dimensions,
      batteryCount,
      mounting
    )

    const shellPosition = this.calculateShellPosition(
      position,
      inverter.dimensions,
      shellDimensions,
      mounting
    )

    return {
      position: shellPosition,
      shellDimensions,
      beamSize: this.BEAM_SIZE,
      panlatSpecs: {
        width: this.PANLAT_WIDTH,
        depth: this.PANLAT_DEPTH
      },
      padding: this.SHELL_PADDING
    }
  }

  private static calculateShellDimensions(
    inverterDims: Dimensions3D,
    batteryDims: Dimensions3D,
    batteryCount: number,
    mounting: { wallOffset: number }
  ): Dimensions3D {
    const totalBatteriesHeight = batteryDims.height * batteryCount

    return {
      width: inverterDims.width + this.SHELL_PADDING.sides * 2,
      depth: inverterDims.depth + mounting.wallOffset + this.SHELL_PADDING.front,
      height: inverterDims.height + totalBatteriesHeight + this.SHELL_PADDING.top * 2
    }
  }

  private static calculateShellPosition(
    basePosition: Position3D,
    inverterDims: Dimensions3D,
    shellDims: Dimensions3D,
    mounting: { wallOffset: number }
  ): Position3D {
    return {
      x: basePosition.x + inverterDims.width / 2,
      y: basePosition.y + shellDims.height / 2 - this.SHELL_PADDING.top,
      z: basePosition.z - (mounting.wallOffset + inverterDims.depth) / 2 - this.SHELL_PADDING.front / 2
    }
  }

  static createDebugConfiguration(
    position: Position3D = { x: 0, y: 1, z: 0 },
    overrides: Partial<WoodenShellConfiguration> = {}
  ): WoodenShellConfiguration {
    const defaultConfig: WoodenShellConfiguration = {
      position,
      shellDimensions: { width: 1, height: 1.5, depth: 0.5 },
      beamSize: this.BEAM_SIZE,
      panlatSpecs: {
        width: this.PANLAT_WIDTH,
        depth: this.PANLAT_DEPTH
      },
      padding: this.SHELL_PADDING
    }

    return { ...defaultConfig, ...overrides }
  }
}