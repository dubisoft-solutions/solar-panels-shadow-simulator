export type LayoutId = 'current' | 'longer-connectors' | 'sw-reposition' | 'sw-reposition-1500' | 'sw-portrait'

export type InstallationAreaId = 'se' | 'sw1' | 'sw2'

export type PanelOrientation = 'landscape' | 'portrait'

export interface RowConfiguration {
  columns: number
  connectorLength?: number
}

export interface InstallationArea {
  id: InstallationAreaId
  rowConfigurations: RowConfiguration[]
  orientation: PanelOrientation
  repositioned?: boolean
}

export interface LayoutConfiguration {
  id: LayoutId
  name: string
  description: string
  installations: InstallationArea[]
}

export interface LayoutUIDescription {
  name: string
  description: string
  totalPanels: number
  seInfo: string
  swInfo: string
}