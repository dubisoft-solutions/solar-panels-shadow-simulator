import { LayoutConfiguration, LayoutId } from '@/domain/entities/LayoutConfiguration'

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
        orientation: 'landscape'
      },
      {
        id: 'sw1',
        rowConfigurations: [
          { columns: 1, connectorLength: 1.320 },
          { columns: 1 }
        ],
        orientation: 'landscape'
      },
      {
        id: 'sw2',
        rowConfigurations: [
          { columns: 2, connectorLength: 1.320 },
          { columns: 2 }
        ],
        orientation: 'landscape'
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
        orientation: 'landscape'
      },
      {
        id: 'sw1',
        rowConfigurations: [
          { columns: 1, connectorLength: 1.500 },
          { columns: 1 }
        ],
        orientation: 'landscape'
      },
      {
        id: 'sw2',
        rowConfigurations: [
          { columns: 2, connectorLength: 1.500 },
          { columns: 2 }
        ],
        orientation: 'landscape'
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
        orientation: 'landscape'
      },
      {
        id: 'sw1',
        rowConfigurations: [
          { columns: 2 }
        ],
        orientation: 'landscape'
      },
      {
        id: 'sw2',
        rowConfigurations: [
          { columns: 2, connectorLength: 1.320 },
          { columns: 2 }
        ],
        orientation: 'landscape'
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
        orientation: 'landscape'
      },
      {
        id: 'sw1',
        rowConfigurations: [
          { columns: 2 }
        ],
        orientation: 'landscape'
      },
      {
        id: 'sw2',
        rowConfigurations: [
          { columns: 2, connectorLength: 1.500 },
          { columns: 2 }
        ],
        orientation: 'landscape'
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
        orientation: 'landscape'
      },
      {
        id: 'sw1',
        rowConfigurations: [
          { columns: 3 }
        ],
        orientation: 'portrait'
      },
      {
        id: 'sw2',
        rowConfigurations: [
          { columns: 3 }
        ],
        orientation: 'portrait'
      }
    ]
  }
]

export const DEFAULT_LAYOUT_ID: LayoutId = 'current'