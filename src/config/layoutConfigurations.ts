import { LayoutConfiguration, LayoutId } from '@/domain/entities/LayoutConfiguration'
import { LANDSCAPE_PLATFORM_SPECS, PORTRAIT_PLATFORM_SPECS } from './solarPanelInstallationSettings'

export const LAYOUT_CONFIGURATIONS: LayoutConfiguration[] = [
  {
    id: 'current',
    name: 'Current (1320mm)',
    description: 'SE string: 6 panels, Connector 1320mm. SW string: 6 panels, Connector 1320mm',
    installations: [
      {
        id: 'se',
        rowConfigurations: [
          { columns: 1, connectorLength: 1.320 },
          { columns: 1, connectorLength: 1.320 },
          { columns: 1, connectorLength: 1.320 },
          { columns: 1, connectorLength: 1.320 },
          { columns: 1, connectorLength: 1.320 },
          { columns: 1 }
        ],
        positionOffset: { x: 0.28, y: 0, z: 0 },
        platformSpecs: LANDSCAPE_PLATFORM_SPECS
      },
      {
        id: 'sw1',
        rowConfigurations: [
          { columns: 1, connectorLength: 1.320 },
          { columns: 1 }
        ],
        positionOffset: { x: 0, y: 0, z: 0 },
        platformSpecs: LANDSCAPE_PLATFORM_SPECS
      },
      {
        id: 'sw2',
        rowConfigurations: [
          { columns: 2, connectorLength: 1.320 },
          { columns: 2 }
        ],
        platformSpecs: LANDSCAPE_PLATFORM_SPECS
      }
    ]
  },
  {
    id: 'longer-connectors',
    name: 'Longer connectors (1500mm)',
    description: 'SE string: 6 panels, Connector 1500mm. SW string: 6 panels, Connector 1500mm',
    installations: [
      {
        id: 'se',
        rowConfigurations: [
          { columns: 1, connectorLength: 1.500 },
          { columns: 1, connectorLength: 1.500 },
          { columns: 1, connectorLength: 1.500 },
          { columns: 1, connectorLength: 1.500 },
          { columns: 1, connectorLength: 1.500 },
          { columns: 1 }
        ],
        positionOffset: { x: 0.28, y: 0, z: 0.11 },
        platformSpecs: LANDSCAPE_PLATFORM_SPECS
      },
      {
        id: 'sw1',
        rowConfigurations: [
          { columns: 1, connectorLength: 1.500 },
          { columns: 1 }
        ],
        positionOffset: { x: 0, y: 0, z: 0 },
        platformSpecs: LANDSCAPE_PLATFORM_SPECS
      },
      {
        id: 'sw2',
        rowConfigurations: [
          { columns: 2, connectorLength: 1.500 },
          { columns: 2 }
        ],
        platformSpecs: LANDSCAPE_PLATFORM_SPECS
      }
    ]
  },
  {
    id: 'sw-reposition',
    name: 'SW Reposition',
    description: 'SE string: 6 panels, Connector 1500mm. SW string: 6 panels repositioned, Connector 1320mm',
    installations: [
      {
        id: 'se',
        rowConfigurations: [
          { columns: 1, connectorLength: 1.500 },
          { columns: 1, connectorLength: 1.500 },
          { columns: 1, connectorLength: 1.500 },
          { columns: 1, connectorLength: 1.500 },
          { columns: 1, connectorLength: 1.500 },
          { columns: 1 }
        ],
        positionOffset: { x: 0.28, y: 0, z: 0.11 },
        platformSpecs: LANDSCAPE_PLATFORM_SPECS
      },
      {
        id: 'sw1',
        rowConfigurations: [
          { columns: 2 }
        ],
        positionOffset: { x: 0, y: 0, z: 0 },
        platformSpecs: LANDSCAPE_PLATFORM_SPECS
      },
      {
        id: 'sw2',
        rowConfigurations: [
          { columns: 2, connectorLength: 1.320 },
          { columns: 2 }
        ],
        platformSpecs: LANDSCAPE_PLATFORM_SPECS
      }
    ]
  },
  {
    id: 'sw-reposition-1500',
    name: 'SW Reposition (1500mm)',
    description: 'SE string: 6 panels, Connector 1500mm. SW string: 6 panels repositioned, Connector 1500mm',
    installations: [
      {
        id: 'se',
        rowConfigurations: [
          { columns: 1, connectorLength: 1.500 },
          { columns: 1, connectorLength: 1.500 },
          { columns: 1, connectorLength: 1.500 },
          { columns: 1, connectorLength: 1.500 },
          { columns: 1, connectorLength: 1.500 },
          { columns: 1 }
        ],
        positionOffset: { x: 0.28, y: 0, z: 0.11 },
        platformSpecs: LANDSCAPE_PLATFORM_SPECS
      },
      {
        id: 'sw1',
        rowConfigurations: [
          { columns: 2 }
        ],
        positionOffset: { x: 0, y: 0, z: 0 },
        platformSpecs: LANDSCAPE_PLATFORM_SPECS
      },
      {
        id: 'sw2',
        rowConfigurations: [
          { columns: 2, connectorLength: 1.500 },
          { columns: 2 }
        ],
        positionOffset: { x: 0, y: 0, z: 0 },
        platformSpecs: LANDSCAPE_PLATFORM_SPECS
      }
    ]
  },
  {
    id: 'sw-portrait',
    name: 'SW Portrait',
    description: 'SE string: 6 panels, Connector 1500mm. SW string: 6 panels in portrait orientation',
    installations: [
      {
        id: 'se',
        rowConfigurations: [
          { columns: 1, connectorLength: 1.500 },
          { columns: 1, connectorLength: 1.500 },
          { columns: 1, connectorLength: 1.500 },
          { columns: 1, connectorLength: 1.500 },
          { columns: 1, connectorLength: 1.500 },
          { columns: 1 }
        ],
        positionOffset: { x: 0.28, y: 0, z: 0.11 },
        platformSpecs: LANDSCAPE_PLATFORM_SPECS
      },
      {
        id: 'sw1',
        rowConfigurations: [
          { columns: 3 }
        ],
        platformSpecs: PORTRAIT_PLATFORM_SPECS
      },
      {
        id: 'sw2',
        rowConfigurations: [
          { columns: 3 }
        ],
        platformSpecs: PORTRAIT_PLATFORM_SPECS
      }
    ]
  }
]

export const DEFAULT_LAYOUT_ID: LayoutId = 'current'