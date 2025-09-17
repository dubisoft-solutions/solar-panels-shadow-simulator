'use client'

import { useRef } from 'react'
import * as THREE from 'three'
import { houseSettings } from '@/config/houseSettings'

const BEAM_SIZE = 0.05 // 50mm x 50mm wooden beams
const PANLAT_WIDTH = 0.022 // 22mm KONSTA Vuren panlat
const PANLAT_DEPTH = 0.048 // 48mm KONSTA Vuren panlat (depth into the shell)
const SHELL_PADDING = {
  sides: 0.20, // 20cm padding on sides
  front: 0.05, // 5cm padding in front
  top: 0.20    // 20cm padding on top/bottom
}

export default function WoodenShell() {
  const groupRef = useRef<THREE.Group>(null)
  
  // Get energy storage configuration
  const { energyStorage } = houseSettings
  const { position, batteryCount, battery, inverter, mounting } = energyStorage
  
  // Calculate shell dimensions based on energy storage unit size
  const shellWidth = inverter.dimensions.width + SHELL_PADDING.sides * 2
  const shellDepth = inverter.dimensions.depth + mounting.wallOffset + SHELL_PADDING.front
  
  // Calculate height: inverter + batteries + padding
  const totalBatteriesHeight = battery.dimensions.height * batteryCount
  const shellHeight = inverter.dimensions.height + totalBatteriesHeight + SHELL_PADDING.top * 2
  
  // Calculate shell position - moved 1 meter forward from the house for visual debugging
  // The shell enclosure surrounds the battery with padding on all sides
  const shellPosition = [
    position.x + inverter.dimensions.width / 2,  // Center X on battery
    position.y + shellHeight / 2 - SHELL_PADDING.top,  // Center Y accounting for base height
    position.z - (mounting.wallOffset + inverter.dimensions.depth) / 2 - SHELL_PADDING.front / 2 // - 5.0  // Center Z with front padding + 1m forward
  ] as [number, number, number]
  
  // Create wood grain textures using canvas
  const createWoodTexture = (width: number, height: number, grainDirection: 'horizontal' | 'vertical' | 'depth') => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')!
    
    // Base wood color (lighter)
    ctx.fillStyle = '#D2B48C'
    ctx.fillRect(0, 0, width, height)
    
    // Add subtle grain lines
    ctx.strokeStyle = '#C4A478'
    ctx.lineWidth = 0.5
    ctx.globalAlpha = 0.3
    
    if (grainDirection === 'horizontal') {
      // Horizontal grain lines (wood runs along X axis)
      for (let y = 0; y < height; y += 4) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
    } else if (grainDirection === 'vertical') {
      // Vertical grain lines (wood runs along Y axis)
      for (let x = 0; x < width; x += 4) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
    } else {
      // Depth grain lines (wood runs along Z axis) - diagonal pattern
      for (let i = 0; i < Math.max(width, height); i += 6) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(0, i)
        ctx.stroke()
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    return texture
  }

  // Create beam materials with wood grain
  const mainBeamTexture = createWoodTexture(64, 64, 'vertical') // Main beams run vertically
  const panlatTextureH = createWoodTexture(64, 64, 'horizontal') // Panlat horizontal grain
  const panlatTextureV = createWoodTexture(64, 64, 'vertical') // Panlat vertical grain
  
  const mainBeamMaterial = <meshLambertMaterial map={mainBeamTexture} color="#D2B48C" /> // Light tan for main frame
  const panlatMaterialH = <meshLambertMaterial map={panlatTextureH} color="#F5DEB3" /> // Wheat color for horizontal beams
  const panlatMaterialV = <meshLambertMaterial map={panlatTextureV} color="#F5DEB3" /> // Wheat color for vertical beams
  
  // Helper function to create a beam
  const createBeam = (
    position: [number, number, number], 
    size: [number, number, number],
    key: string,
    material = mainBeamMaterial
  ) => (
    <mesh key={key} position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      {material}
    </mesh>
  )
  
  // Helper function to create an angled roof beam with bottom cut
  const createAngledBeam = (
    position: [number, number, number],
    length: number,
    angle: number,
    key: string,
    cutAngle: number = 30 * Math.PI / 180 // 30 degrees cut
  ) => {
    // Create a shape for the beam cross-section with angled bottom cut
    const shape = new THREE.Shape()
    const halfBeam = BEAM_SIZE / 2
    
    // Create cross-section profile (looking down the length of the beam)
    shape.moveTo(-halfBeam, -halfBeam)
    shape.lineTo(halfBeam, -halfBeam + Math.tan(cutAngle) * BEAM_SIZE) // Angled bottom
    shape.lineTo(halfBeam, halfBeam)
    shape.lineTo(-halfBeam, halfBeam)
    shape.closePath()
    
    const extrudeSettings = {
      depth: BEAM_SIZE, // Extrude along Z-axis for beam depth (50mm)
      bevelEnabled: false
    }
    
    return (
      <mesh 
        key={key}
        position={position}
        rotation={[-Math.PI/2, 0, angle]} // Rotate to orient correctly: X=length, Y=height, Z=depth
        castShadow 
        receiveShadow
      >
        <extrudeGeometry args={[shape, extrudeSettings]} />
        {mainBeamMaterial}
      </mesh>
    )
  }
  
  // Calculate beam positions relative to shell center
  const halfWidth = shellWidth / 2
  const halfHeight = shellHeight / 2
  const halfDepth = shellDepth / 2
  
  // Roof calculations
  const roofAngle = 20 * Math.PI / 180 // 20 degrees in radians
  const roofHeight = halfWidth * Math.tan(roofAngle) // Height of roof peak from top of frame
  // Adjust beam length to meet at ridge without overlapping (account for half beam thickness at peak)
  const roofBeamLength = (halfWidth - BEAM_SIZE/2) / Math.cos(roofAngle) // Length of angled roof beam
  
  // Panlat calculations - run from bottom beam top to top beam bottom
  const panlatHeight = shellHeight - BEAM_SIZE * 2 // Height between top and bottom horizontal beams
  
  return (
    <group ref={groupRef} position={shellPosition}>
      {/* Vertical corner posts - 4 corners */}
      {createBeam(
        [-halfWidth + BEAM_SIZE/2, 0, -halfDepth + BEAM_SIZE/2],
        [BEAM_SIZE, shellHeight, BEAM_SIZE],
        'post-front-left'
      )}
      {createBeam(
        [halfWidth - BEAM_SIZE/2, 0, -halfDepth + BEAM_SIZE/2],
        [BEAM_SIZE, shellHeight, BEAM_SIZE],
        'post-front-right'
      )}
      {createBeam(
        [-halfWidth + BEAM_SIZE/2, 0, halfDepth - BEAM_SIZE/2],
        [BEAM_SIZE, shellHeight, BEAM_SIZE],
        'post-back-left'
      )}
      {createBeam(
        [halfWidth - BEAM_SIZE/2, 0, halfDepth - BEAM_SIZE/2],
        [BEAM_SIZE, shellHeight, BEAM_SIZE],
        'post-back-right'
      )}
      
      {/* Horizontal top beams - front and back (connecting between vertical posts) */}
      {createBeam(
        [0, halfHeight - BEAM_SIZE/2, -halfDepth + BEAM_SIZE/2],
        [shellWidth - BEAM_SIZE * 2, BEAM_SIZE, BEAM_SIZE],
        'beam-top-front'
      )}
      {createBeam(
        [0, halfHeight - BEAM_SIZE/2, halfDepth - BEAM_SIZE/2],
        [shellWidth - BEAM_SIZE * 2, BEAM_SIZE, BEAM_SIZE],
        'beam-top-back'
      )}
      
      {/* Horizontal top beams - left and right (connecting between vertical posts) */}
      {createBeam(
        [-halfWidth + BEAM_SIZE/2, halfHeight - BEAM_SIZE/2, 0],
        [BEAM_SIZE, BEAM_SIZE, shellDepth - BEAM_SIZE * 2],
        'beam-top-left'
      )}
      {createBeam(
        [halfWidth - BEAM_SIZE/2, halfHeight - BEAM_SIZE/2, 0],
        [BEAM_SIZE, BEAM_SIZE, shellDepth - BEAM_SIZE * 2],
        'beam-top-right'
      )}
      
      {/* Horizontal bottom beams - front and back (connecting between vertical posts) */}
      {createBeam(
        [0, -halfHeight + BEAM_SIZE/2, -halfDepth + BEAM_SIZE/2],
        [shellWidth - BEAM_SIZE * 2, BEAM_SIZE, BEAM_SIZE],
        'beam-bottom-front'
      )}
      {createBeam(
        [0, -halfHeight + BEAM_SIZE/2, halfDepth - BEAM_SIZE/2],
        [shellWidth - BEAM_SIZE * 2, BEAM_SIZE, BEAM_SIZE],
        'beam-bottom-back'
      )}
      
      {/* Horizontal bottom beams - left and right (connecting between vertical posts) */}
      {createBeam(
        [-halfWidth + BEAM_SIZE/2, -halfHeight + BEAM_SIZE/2, 0],
        [BEAM_SIZE, BEAM_SIZE, shellDepth - BEAM_SIZE * 2],
        'beam-bottom-left'
      )}
      {createBeam(
        [halfWidth - BEAM_SIZE/2, -halfHeight + BEAM_SIZE/2, 0],
        [BEAM_SIZE, BEAM_SIZE, shellDepth - BEAM_SIZE * 2],
        'beam-bottom-right'
      )}
      
      {/* Roof frame */}
      {/* Ridge beam - running along the peak */}
      {createBeam(
        [0, halfHeight + roofHeight - BEAM_SIZE/2, 0],
        [BEAM_SIZE, BEAM_SIZE, shellDepth],
        'roof-ridge'
      )}
      
      {/* Left roof beam - wider to simulate angled cut, positioned lower */}
      <mesh 
        position={[-(halfWidth - BEAM_SIZE/2)/2, halfHeight + roofHeight/2 - BEAM_SIZE/2 - 0.01, -halfDepth + BEAM_SIZE/2]}
        rotation={[0, 0, roofAngle]}
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[roofBeamLength + 0.02, BEAM_SIZE * 1.4, BEAM_SIZE]} />
        {mainBeamMaterial}
      </mesh>
      
      {/* Right roof beam - wider to simulate angled cut, positioned lower */}
      <mesh 
        position={[(halfWidth - BEAM_SIZE/2)/2, halfHeight + roofHeight/2 - BEAM_SIZE/2 - 0.01, -halfDepth + BEAM_SIZE/2]}
        rotation={[0, 0, -roofAngle]}
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[roofBeamLength + 0.02, BEAM_SIZE * 1.4, BEAM_SIZE]} />
        {mainBeamMaterial}
      </mesh>
      
      {/* Back left roof beam - wider to simulate angled cut, positioned lower */}
      <mesh 
        position={[-(halfWidth - BEAM_SIZE/2)/2, halfHeight + roofHeight/2 - BEAM_SIZE/2 - 0.01, halfDepth - BEAM_SIZE/2]}
        rotation={[0, 0, roofAngle]}
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[roofBeamLength + 0.02, BEAM_SIZE * 1.4, BEAM_SIZE]} />
        {mainBeamMaterial}
      </mesh>
      
      {/* Back right roof beam - wider to simulate angled cut, positioned lower */}
      <mesh 
        position={[(halfWidth - BEAM_SIZE/2)/2, halfHeight + roofHeight/2 - BEAM_SIZE/2 - 0.01, halfDepth - BEAM_SIZE/2]}
        rotation={[0, 0, -roofAngle]}
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[roofBeamLength + 0.02, BEAM_SIZE * 1.4, BEAM_SIZE]} />
        {mainBeamMaterial}
      </mesh>
      
      {/* KONSTA Vuren Panlat beams for Zweeds rabat mounting */}
      {/* Front side panlat - left (48mm face toward camera) */}
      {createBeam(
        [-halfWidth + BEAM_SIZE + PANLAT_DEPTH/2, 0, -halfDepth + BEAM_SIZE/2 + PANLAT_WIDTH/2],
        [PANLAT_DEPTH, panlatHeight, PANLAT_WIDTH],
        'panlat-front-left',
        panlatMaterialV
      )}
      
      {/* Front side panlat - center (48mm face toward camera) */}
      {createBeam(
        [0, 0, -halfDepth + BEAM_SIZE/2 + PANLAT_WIDTH/2],
        [PANLAT_DEPTH, panlatHeight, PANLAT_WIDTH],
        'panlat-front-center',
        panlatMaterialV
      )}
      
      {/* Front side panlat - right (48mm face toward camera) */}
      {createBeam(
        [halfWidth - BEAM_SIZE - PANLAT_DEPTH/2, 0, -halfDepth + BEAM_SIZE/2 + PANLAT_WIDTH/2],
        [PANLAT_DEPTH, panlatHeight, PANLAT_WIDTH],
        'panlat-front-right',
        panlatMaterialV
      )}
      
      {/* Left side panlat - front (48mm face toward left side) */}
      {createBeam(
        [-halfWidth + BEAM_SIZE/2 + PANLAT_WIDTH/2, 0, -halfDepth + BEAM_SIZE + PANLAT_DEPTH/2],
        [PANLAT_WIDTH, panlatHeight, PANLAT_DEPTH],
        'panlat-left-front',
        panlatMaterialV
      )}
      
      {/* Left side panlat - back (48mm face toward left side) */}
      {createBeam(
        [-halfWidth + BEAM_SIZE/2 + PANLAT_WIDTH/2, 0, halfDepth - BEAM_SIZE - PANLAT_DEPTH/2],
        [PANLAT_WIDTH, panlatHeight, PANLAT_DEPTH],
        'panlat-left-back',
        panlatMaterialV
      )}
      
      {/* Right side panlat - front (48mm face toward right side) */}
      {createBeam(
        [halfWidth - BEAM_SIZE/2 - PANLAT_WIDTH/2, 0, -halfDepth + BEAM_SIZE + PANLAT_DEPTH/2],
        [PANLAT_WIDTH, panlatHeight, PANLAT_DEPTH],
        'panlat-right-front',
        panlatMaterialV
      )}
      
      {/* Right side panlat - back (48mm face toward right side) */}
      {createBeam(
        [halfWidth - BEAM_SIZE/2 - PANLAT_WIDTH/2, 0, halfDepth - BEAM_SIZE - PANLAT_DEPTH/2],
        [PANLAT_WIDTH, panlatHeight, PANLAT_DEPTH],
        'panlat-right-back',
        panlatMaterialV
      )}
    </group>
  )
}