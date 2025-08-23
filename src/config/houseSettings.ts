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
    width: number  // meters
    sides: ('north' | 'south' | 'east' | 'west')[] // which sides have parapets
  }
  color: string
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
}

const HOUSE_DEPTH = 8.71
const HOUSE_WIDTH = 5.6

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
      depth: HOUSE_DEPTH + 0.5,          // house depth + 50cm extension (8.71 + 0.5)
      thickness: 0.2        // 20cm thick roof
    },
    parapet: {
      height: 0.16,         // 16cm high
      width: 0.15,          // 15cm wide
      sides: ['north', 'west', 'south']  // no parapet on east side
    },
    color: '#FFFFFF'        // white color for better shadow visibility
  },
  orientation: {
    rotationFromNorth: 30   // degrees clockwise from true north
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
        x: HOUSE_WIDTH / 2,  // center of house
        z: HOUSE_DEPTH / 2,  // center of house
        y: 0      // on roof level
      },
      dimensions: {
        width: 0.5,   // 50cm
        depth: 0.5,   // 50cm
        height: 0.4   // 40cm
      },
      pipe: {
        diameter: 0.1,  // 10cm
        height: 0.3,    // 30cm
        position: {
          x: 0.1,  // 10cm from west side of chimney base
          y: 0,    // on top of chimney
          z: 0.25 - 0.1 / 2  // center of chimney (north-south): chimney depth/2 - pipe diameter = 0.5m/2 - 0.1/2 = 0.2m
        },
        color: '#767373'
      },
      color: '#232220'
    }
  ]
}

export const getDisplayDimensions = (settings: HouseSettings) => {
  const { westSideLength, northSideLength, height } = settings.dimensions
  const { units } = settings.display
  const { rotationFromNorth } = settings.orientation
  
  return {
    westSide: `${westSideLength}${units === 'meters' ? 'm' : 'ft'}`,
    northSide: `${northSideLength}${units === 'meters' ? 'm' : 'ft'}`,
    height: `${height}${units === 'meters' ? 'm' : 'ft'}`,
    rotation: `${rotationFromNorth}° from North`
  }
}