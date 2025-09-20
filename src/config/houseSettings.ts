export interface ChimneyPipe {
  diameter: number // meters
  height: number   // meters
  position: {
    x: number // meters relative to chimney center
    y: number // meters relative to chimney top
    z: number // meters relative to chimney center
  }
  color?: string
}

export interface RoofObject {
  id: string
  type: 'chimney' | 'antenna' | 'vent'
  position: {
    x: number // meters from west wall (X=0 at west wall)
    z: number // meters from north wall (Z=0 at north wall)  
    y: number // elevation above roof level (meters)
  }
  dimensions: {
    width: number  // meters (box base)
    depth: number  // meters (box base)
    height: number // meters (box height)
  }
  pipe?: ChimneyPipe // optional pipe on top
  color?: string
}

export interface RoofSettings {
  position: {
    x: number // meters from west wall (X=0 at west wall)
    y: number // meters from north wall (Z=0 at north wall)
    z: number // elevation above house top (meters)
  }
  dimensions: {
    width: number  // meters - total roof width (east-west)
    depth: number  // meters - total roof depth (north-south)
    thickness: number // meters
  }
  parapet: {
    height: number // meters
    widths: {
      north: number  // meters
      south: number  // meters
      east: number   // meters
      west: number   // meters
    }
    sides: ('north' | 'south' | 'east' | 'west')[] // which sides have parapets
  }
  color: string
}

export interface EnergyStorageSystem {
  position: {
    x: number // meters from west wall
    y: number // meters above ground
    z: number // meters from north wall (0 = at north wall, positive = south of north wall)
  }
  batteryCount: number
  inverter: {
    model: string
    dimensions: {
      width: number  // meters
      height: number // meters
      depth: number  // meters
    }
    color: string
  }
  battery: {
    model: string
    dimensions: {
      width: number  // meters
      height: number // meters
      depth: number  // meters
    }
    color: string
  }
  mounting: {
    wallOffset: number // meters - space between wall and equipment for mounting system
    unitSpacing: number // meters - vertical gap between units
  }
}

export interface HouseSettings {
  dimensions: {
    westSideLength: number    // Longest side facing west
    northSideLength: number   // Shorter side facing north
    height: number
  }
  roof: RoofSettings
  orientation: {
    rotationFromNorth: number // degrees
  }
  location: {
    latitude: number
    longitude: number
    city: string
    country: string
    timezone: string
  }
  display: {
    units: 'meters' | 'feet'
  }
  roofObjects: RoofObject[]
  energyStorage: EnergyStorageSystem
}

const HOUSE_DEPTH = 8.93
const HOUSE_WIDTH = 5.6

const ROOF_SOUTH_PARAPET_WIDTH = 0.15
const ROOF_NORTH_PARAPET_WIDTH = 0.40
const ROOF_WEST_PARAPET_WIDTH = 0.40

const ENERGY_STORAGE_UNIT_WIDTH = 0.61
const ENERGY_STORAGE_UNIT_DEPTH = 0.212
const ENERGY_STORAGE_UNIT_WALL_OFFSET = 0.048

export const houseSettings: HouseSettings = {
  dimensions: {
    westSideLength: HOUSE_DEPTH,   // meters - longest side (7.99 + 0.36*2 for walls)
    northSideLength: HOUSE_WIDTH,  // meters - shorter side 
    height: 3.0             // meters
  },
  roof: {
    position: {
      x: 0,                 // centered from west side
      y: 0,                 // centered from north side  
      z: 0                  // on top of house
    },
    dimensions: {
      width: HOUSE_WIDTH,          // same as house width (east-west)
      depth: HOUSE_DEPTH + 0.62,         // house depth + 62cm extension for 9m useful space
      thickness: 0.2        // 20cm thick roof
    },
    parapet: {
      height: 0.16,         // 16cm high
      widths: {
        north: ROOF_NORTH_PARAPET_WIDTH,
        south: ROOF_SOUTH_PARAPET_WIDTH,
        east: 0,              // no parapet on east side
        west: ROOF_WEST_PARAPET_WIDTH
      },
      sides: ['north', 'west', 'south']  // no parapet on east side
    },
    color: '#FFFFFF'        // white color for better shadow visibility
  },
  orientation: {
    rotationFromNorth: 30.5   // degrees clockwise from true north
  },
  location: {
    latitude: 51.9553,      // Culemborg, Netherlands
    longitude: 5.2256,
    city: 'Culemborg',
    country: 'Netherlands',
    timezone: 'Europe/Amsterdam'
  },
  display: {
    units: 'meters'
  },
  roofObjects: [
    {
      id: 'chimney-1',
      type: 'chimney',
      position: {
        x: (HOUSE_WIDTH - 2.64) + 0.05,  // 2.264m from east side + pipe radius
        z: 4.94 + 0.05,                  // 4.94m from north side + pipe radius
        y: 0      // on roof level
      },
      dimensions: {
        width: 0.46,   // 46cm
        depth: 0.46,   // 46cm
        height: 0.40   // 40cm
      },
      pipe: {
        diameter: 0.1,  // 10cm
        height: 0.3,    // 30cm
        position: {
          x: 0.09,  // center of chimney (east-west)
          y: 0,  // on top of chimney
          z: 0.1   // center of chimney (north-south)
        },
        color: '#767373'
      },
      color: '#232220'
    }
  ],
  energyStorage: {
    position: {
      x: HOUSE_WIDTH - ENERGY_STORAGE_UNIT_WIDTH - 0.25,    // 25cm from east wall (total width - equipment width - margin)
      y: 0.30,    // 30cm above ground
      z: 0        // at the north wall surface
    },
    batteryCount: 2,
    inverter: {
      model: 'AlphaEss Smile G3 S5',
      dimensions: {
        width: ENERGY_STORAGE_UNIT_WIDTH,
        height: 0.366,  // 366mm  
        depth: ENERGY_STORAGE_UNIT_DEPTH
      },
      color: '#D3D3D3'  // light gray
    },
    battery: {
      model: 'SMILE-G3-BAT-3.8S',
      dimensions: {
        width: ENERGY_STORAGE_UNIT_WIDTH,
        height: 0.435,  // 435mm
        depth: ENERGY_STORAGE_UNIT_DEPTH
      },
      color: '#F5F5F5'  // white
    },
    mounting: {
      wallOffset: ENERGY_STORAGE_UNIT_WALL_OFFSET,
      unitSpacing: 0.001  // 1mm gap between units for minimal visual separation
    }
  }
}

export const getDisplayDimensions = (settings: HouseSettings) => {
  const { westSideLength, northSideLength, height } = settings.dimensions
  const { units } = settings.display
  const { rotationFromNorth } = settings.orientation

  // Calculate useful roof space (total roof depth minus parapet widths)
  const totalRoofDepth = settings.roof.dimensions.depth
  const usefulRoofDepth = totalRoofDepth - settings.roof.parapet.widths.north - settings.roof.parapet.widths.south
  const usefulRoofWidth = settings.roof.dimensions.width - settings.roof.parapet.widths.west

  return {
    westSide: `${westSideLength}${units === 'meters' ? 'm' : 'ft'}`,
    northSide: `${northSideLength}${units === 'meters' ? 'm' : 'ft'}`,
    height: `${height}${units === 'meters' ? 'm' : 'ft'}`,
    rotation: `${rotationFromNorth}° from North`,
    totalRoofDepth: `${totalRoofDepth.toFixed(2)}${units === 'meters' ? 'm' : 'ft'}`,
    usefulRoofSpace: `${usefulRoofWidth.toFixed(2)}m × ${usefulRoofDepth.toFixed(1)}m`
  }
}