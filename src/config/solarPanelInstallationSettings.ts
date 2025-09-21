// Hyundai HiT-H450LE-FB Panel Specifications
export const PANEL_SPECS = {
  length: 1.762,     // m (X direction)
  width: 1.134,      // m (Y direction)
  thickness: 0.04,   // m
  cellColumns: 16,   // columns
  cellRows: 6,       // rows
  stringCount: 3     // internal strings
}

// platform specs according to https://enstall.ma.informationstore.net/informationstore/F/F0001459_0001.pdf?expires=99990909000000&secretname=InformationStore&id=0&ticket=7B13C0DFA33FFE99869B70648EFE497B
export const LANDSCAPE_PLATFORM_SPECS = {
  tiltAngle: 13,            // degrees
  length: 1.145,            // m
  thickness: 0.082,            // m
  panelMountOffset: 0.15,   // m (5cm offset from platform start)
  defaultConnectorLength: 1.320  // m (configurable)
}

export const PORTRAIT_PLATFORM_SPECS = {
  tiltAngle: 10,            // degrees
  length: 1.826,            // m
  thickness: 0.082,            // m
  panelMountOffset: 0.05,   // m (5cm offset from platform start)
  defaultConnectorLength: 1.320  // m (configurable)
}

// Visual settings
export const VISUAL_SETTINGS = {
  panelColor: '#1a1a2e',
  frameColor: '#2d3436',
  cellColor: '#0f0f1a',
  stringColors: ['#ff7675', '#74b9ff', '#00b894'],
  platformColor: '#E8E8E8',
  connectorColor: '#888888'
}