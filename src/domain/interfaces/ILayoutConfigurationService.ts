import { LayoutConfiguration, LayoutId, LayoutUIDescription } from '../entities/LayoutConfiguration'
import { Layout3DConfiguration } from '../entities/InstallationPosition'

export interface LayoutSelectOption {
  value: LayoutId
  label: string
  description?: string
}

export interface ILayoutConfigurationService {
  getAvailableLayouts(): LayoutConfiguration[]
  getLayoutById(id: LayoutId): LayoutConfiguration | null
  getDefaultLayout(): LayoutConfiguration
  validateLayoutId(id: string): id is LayoutId
  getLayoutSelectOptions(): LayoutSelectOption[]
  get3DConfiguration(layoutId: LayoutId): Layout3DConfiguration
  getUIDescription(layoutId: LayoutId): LayoutUIDescription
}