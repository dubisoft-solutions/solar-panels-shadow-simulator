import { Position3D } from '@/types/common'
import { houseSettings } from '@/config/houseSettings'
import { PANEL_SPECS } from '@/config/solarPanelInstallationSettings'
import { PanelSpacingService } from '@/services/PanelSpacingService'
import {
  ILayoutConfigurationService,
  LayoutSelectOption
} from '@/domain/interfaces/ILayoutConfigurationService'
import {
  LayoutConfiguration,
  LayoutId,
  LayoutUIDescription,
  InstallationArea
} from '@/domain/entities/LayoutConfiguration'
import {
  Layout3DConfiguration,
  Installation3DConfiguration
} from '@/domain/entities/InstallationPosition'
import { LAYOUT_CONFIGURATIONS, DEFAULT_LAYOUT_ID } from '@/config/layoutConfigurations'

export class LayoutConfigurationService implements ILayoutConfigurationService {
  private readonly layouts: Map<LayoutId, LayoutConfiguration>

  constructor() {
    this.layouts = new Map(
      LAYOUT_CONFIGURATIONS.map(layout => [layout.id, layout])
    )
  }

  getAvailableLayouts(): LayoutConfiguration[] {
    return LAYOUT_CONFIGURATIONS
  }

  getLayoutById(id: LayoutId): LayoutConfiguration | null {
    return this.layouts.get(id) || null
  }

  getDefaultLayout(): LayoutConfiguration {
    const defaultLayout = this.layouts.get(DEFAULT_LAYOUT_ID)
    if (!defaultLayout) {
      throw new Error(`Default layout '${DEFAULT_LAYOUT_ID}' not found`)
    }
    return defaultLayout
  }

  validateLayoutId(id: string): id is LayoutId {
    return this.layouts.has(id as LayoutId)
  }

  getLayoutSelectOptions(): LayoutSelectOption[] {
    return LAYOUT_CONFIGURATIONS.map(layout => ({
      value: layout.id,
      label: layout.name,
      description: layout.description
    }))
  }

  get3DConfiguration(layoutId: LayoutId): Layout3DConfiguration {
    const layout = this.getLayoutById(layoutId)
    if (!layout) {
      throw new Error(`Layout not found: ${layoutId}`)
    }

    const installations: Installation3DConfiguration[] = layout.installations.map(installation => {
      const position = this.getInstallationPosition(installation.id, installation)
      const rotation = this.getInstallationRotation(installation.id)

      return {
        id: installation.id,
        position,
        rotation,
        configuration: {
          rowConfigurations: installation.rowConfigurations,
          platformSpecs: installation.platformSpecs
        }
      }
    })

    return { installations }
  }

  getUIDescription(layoutId: LayoutId): LayoutUIDescription {
    const layout = this.getLayoutById(layoutId)
    if (!layout) {
      throw new Error(`Layout not found: ${layoutId}`)
    }

    // Calculate total panels
    const totalPanels = layout.installations.reduce((total, installation) => {
      const installationPanels = installation.rowConfigurations.reduce((sum, row) => sum + row.columns, 0)
      return total + installationPanels
    }, 0)

    // Generate SE info
    const seInstallation = layout.installations.find(i => i.id === 'se')
    const sePanelCount = seInstallation?.rowConfigurations.reduce((sum, row) => sum + row.columns, 0) || 0
    const seConnector = seInstallation?.rowConfigurations.find(row => row.connectorLength)?.connectorLength || 1.320
    const seInfo = `SE string: ${sePanelCount} panels, Connector ${(seConnector * 1000).toFixed(0)}mm`

    // Generate SW info - show two installations
    const swInstallations = layout.installations.filter(i => i.id.startsWith('sw'))

    let swInfo = 'SW string: '
    const swDetails: string[] = []

    swInstallations.forEach((installation) => {
      const panelCount = installation.rowConfigurations.reduce((sum, row) => sum + row.columns, 0)
      const hasConnector = installation.rowConfigurations.some(row => row.connectorLength)

      if (hasConnector) {
        const connector = installation.rowConfigurations.find(row => row.connectorLength)?.connectorLength || 1.320
        swDetails.push(`${panelCount} panels (${(connector * 1000).toFixed(0)}mm)`)
      } else {
        swDetails.push(`${panelCount} panels`)
      }
    })

    const totalSwPanels = swInstallations.reduce((total, installation) => {
      return total + installation.rowConfigurations.reduce((sum, row) => sum + row.columns, 0)
    }, 0)

    swInfo += `${totalSwPanels} panels in 2 installations: ${swDetails.join(' + ')}`

    return {
      name: layout.name,
      description: layout.description,
      totalPanels,
      seInfo,
      swInfo
    }
  }

  private getInstallationPosition(areaId: string, installation?: InstallationArea): Position3D {
    const houseHeight = houseSettings.dimensions.height
    const roofThickness = houseSettings.roof.dimensions.thickness
    const houseWidth = houseSettings.dimensions.northSideLength
    const houseDepth = houseSettings.dimensions.westSideLength

    // Extract connector length from installation configuration, fallback to default
    const getConnectorLength = (): number => {
      if (!installation) return 1.320 // Default fallback
      const rowWithConnector = installation.rowConfigurations.find(row => row.connectorLength)
      return rowWithConnector?.connectorLength ?? 0
    }

    const connectorLength = getConnectorLength()
    const platformSpecs = installation?.platformSpecs || { tiltAngle: 13, length: 1.145, thickness: 0.082, panelMountOffset: 0.15, orientation: 'landscape' }

    // Get maximum columns from row configurations
    const getMaxColumns = (): number => {
      if (!installation) return 1 // Default fallback
      return Math.max(...installation.rowConfigurations.map(row => row.columns))
    }

    const maxColumns = getMaxColumns()
    const positionOffset = installation?.positionOffset ?? { x: 0, y: 0, z: 0 }

    switch (areaId) {
      case 'se':
        // Edge-based position calculation from Scene3D.tsx
        return {
          x: positionOffset.x + houseSettings.roof.parapet.widths.west + PANEL_SPECS.length,
          y: houseHeight + roofThickness + positionOffset.y,
          z: houseSettings.roof.position.y + houseSettings.roof.dimensions.depth - houseSettings.roof.parapet.widths.south - 0.5 + positionOffset.z
        }

      case 'sw1':
        const sw1Spacing = PanelSpacingService.calculateSpacing(
          PANEL_SPECS,
          platformSpecs,
          connectorLength
        )
        return {
          x: houseWidth - connectorLength - sw1Spacing.projectedDepth + positionOffset.x,
          y: houseHeight + roofThickness + positionOffset.y,
          z: houseSettings.roof.parapet.widths.north + sw1Spacing.singleColWidth * maxColumns + 0.2 + positionOffset.z
        }

      case 'sw2':
        const sw2Spacing = PanelSpacingService.calculateSpacing(
          PANEL_SPECS,
          platformSpecs,
          connectorLength
        )
        return {
          x: houseWidth - connectorLength - sw2Spacing.projectedDepth + positionOffset.x,
          y: houseHeight + roofThickness + positionOffset.y,
          z: houseDepth + houseSettings.roof.parapet.widths.north - 0.04 + positionOffset.z
        }
        

      default:
        return { x: 0, y: 0, z: 0 }
    }
  }

  private getInstallationRotation(areaId: string): [number, number, number] {
    switch (areaId) {
      case 'se':
        return [0, Math.PI, 0]
      case 'sw1':
      case 'sw2':
        return [0, Math.PI / 2, 0]
      default:
        return [0, 0, 0]
    }
  }
}