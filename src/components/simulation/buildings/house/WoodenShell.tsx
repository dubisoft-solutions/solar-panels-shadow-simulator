'use client'

import { useRef } from 'react'
import * as THREE from 'three'
import { WoodenShellProps } from '@/interfaces/WoodenShellTypes'

export default function WoodenShell({ configuration, materials }: WoodenShellProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { position, shellDimensions, beamSize, panlatSpecs } = configuration
  
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

  // Create default materials if not provided
  const defaultMaterials = {
    mainBeam: (() => {
      const mainBeamTexture = createWoodTexture(64, 64, 'vertical')
      return <meshLambertMaterial map={mainBeamTexture} color="#D2B48C" />
    })(),
    panlatH: (() => {
      const panlatTextureH = createWoodTexture(64, 64, 'horizontal')
      return <meshLambertMaterial map={panlatTextureH} color="#F5DEB3" />
    })(),
    panlatV: (() => {
      const panlatTextureV = createWoodTexture(64, 64, 'vertical')
      return <meshLambertMaterial map={panlatTextureV} color="#F5DEB3" />
    })()
  }

  const activeMaterials = { ...defaultMaterials, ...materials }
  
  // Helper function to create a beam
  const createBeam = (
    position: [number, number, number],
    size: [number, number, number],
    key: string,
    material = activeMaterials.mainBeam
  ) => (
    <mesh key={key} position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      {material}
    </mesh>
  )

  // Calculate beam positions relative to shell center
  const halfWidth = shellDimensions.width / 2
  const halfHeight = shellDimensions.height / 2
  const halfDepth = shellDimensions.depth / 2
  
  // Roof calculations
  const roofAngle = 20 * Math.PI / 180 // 20 degrees in radians
  const roofHeight = halfWidth * Math.tan(roofAngle) // Height of roof peak from top of frame
  // Adjust beam length to meet at ridge without overlapping (account for half beam thickness at peak)
  const roofBeamLength = (halfWidth - beamSize/2) / Math.cos(roofAngle) // Length of angled roof beam

  // Panlat calculations - run from bottom beam top to top beam bottom
  const panlatHeight = shellDimensions.height - beamSize * 2 // Height between top and bottom horizontal beams

  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      {/* Vertical corner posts - 4 corners */}
      {createBeam(
        [-halfWidth + beamSize/2, 0, -halfDepth + beamSize/2],
        [beamSize, shellDimensions.height, beamSize],
        'post-front-left'
      )}
      {createBeam(
        [halfWidth - beamSize/2, 0, -halfDepth + beamSize/2],
        [beamSize, shellDimensions.height, beamSize],
        'post-front-right'
      )}
      {createBeam(
        [-halfWidth + beamSize/2, 0, halfDepth - beamSize/2],
        [beamSize, shellDimensions.height, beamSize],
        'post-back-left'
      )}
      {createBeam(
        [halfWidth - beamSize/2, 0, halfDepth - beamSize/2],
        [beamSize, shellDimensions.height, beamSize],
        'post-back-right'
      )}
      
      {/* Horizontal top beams - front and back (connecting between vertical posts) */}
      {createBeam(
        [0, halfHeight - beamSize/2, -halfDepth + beamSize/2],
        [shellDimensions.width - beamSize * 2, beamSize, beamSize],
        'beam-top-front'
      )}
      {createBeam(
        [0, halfHeight - beamSize/2, halfDepth - beamSize/2],
        [shellDimensions.width - beamSize * 2, beamSize, beamSize],
        'beam-top-back'
      )}
      
      {/* Horizontal top beams - left and right (connecting between vertical posts) */}
      {createBeam(
        [-halfWidth + beamSize/2, halfHeight - beamSize/2, 0],
        [beamSize, beamSize, shellDimensions.depth - beamSize * 2],
        'beam-top-left'
      )}
      {createBeam(
        [halfWidth - beamSize/2, halfHeight - beamSize/2, 0],
        [beamSize, beamSize, shellDimensions.depth - beamSize * 2],
        'beam-top-right'
      )}
      
      {/* Horizontal bottom beams - front and back (connecting between vertical posts) */}
      {createBeam(
        [0, -halfHeight + beamSize/2, -halfDepth + beamSize/2],
        [shellDimensions.width - beamSize * 2, beamSize, beamSize],
        'beam-bottom-front'
      )}
      {createBeam(
        [0, -halfHeight + beamSize/2, halfDepth - beamSize/2],
        [shellDimensions.width - beamSize * 2, beamSize, beamSize],
        'beam-bottom-back'
      )}
      
      {/* Horizontal bottom beams - left and right (connecting between vertical posts) */}
      {createBeam(
        [-halfWidth + beamSize/2, -halfHeight + beamSize/2, 0],
        [beamSize, beamSize, shellDimensions.depth - beamSize * 2],
        'beam-bottom-left'
      )}
      {createBeam(
        [halfWidth - beamSize/2, -halfHeight + beamSize/2, 0],
        [beamSize, beamSize, shellDimensions.depth - beamSize * 2],
        'beam-bottom-right'
      )}
      
      {/* Roof frame */}
      {/* Ridge beam - running along the peak */}
      {createBeam(
        [0, halfHeight + roofHeight - beamSize/2, 0],
        [beamSize, beamSize, shellDimensions.depth],
        'roof-ridge'
      )}
      
      {/* Left roof beam - wider to simulate angled cut, positioned lower */}
      <mesh 
        position={[-(halfWidth - beamSize/2)/2, halfHeight + roofHeight/2 - beamSize/2 - 0.01, -halfDepth + beamSize/2]}
        rotation={[0, 0, roofAngle]}
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[roofBeamLength + 0.02, beamSize * 1.4, beamSize]} />
        {activeMaterials.mainBeam}
      </mesh>
      
      {/* Right roof beam - wider to simulate angled cut, positioned lower */}
      <mesh 
        position={[(halfWidth - beamSize/2)/2, halfHeight + roofHeight/2 - beamSize/2 - 0.01, -halfDepth + beamSize/2]}
        rotation={[0, 0, -roofAngle]}
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[roofBeamLength + 0.02, beamSize * 1.4, beamSize]} />
        {activeMaterials.mainBeam}
      </mesh>
      
      {/* Back left roof beam - wider to simulate angled cut, positioned lower */}
      <mesh 
        position={[-(halfWidth - beamSize/2)/2, halfHeight + roofHeight/2 - beamSize/2 - 0.01, halfDepth - beamSize/2]}
        rotation={[0, 0, roofAngle]}
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[roofBeamLength + 0.02, beamSize * 1.4, beamSize]} />
        {activeMaterials.mainBeam}
      </mesh>
      
      {/* Back right roof beam - wider to simulate angled cut, positioned lower */}
      <mesh 
        position={[(halfWidth - beamSize/2)/2, halfHeight + roofHeight/2 - beamSize/2 - 0.01, halfDepth - beamSize/2]}
        rotation={[0, 0, -roofAngle]}
        castShadow 
        receiveShadow
      >
        <boxGeometry args={[roofBeamLength + 0.02, beamSize * 1.4, beamSize]} />
        {activeMaterials.mainBeam}
      </mesh>
      
      {/* KONSTA Vuren Panlat beams for Zweeds rabat mounting */}
      {/* Front side panlat - left (48mm face toward camera) */}
      {createBeam(
        [-halfWidth + beamSize + panlatSpecs.depth/2, 0, -halfDepth + beamSize/2 + panlatSpecs.width/2],
        [panlatSpecs.depth, panlatHeight, panlatSpecs.width],
        'panlat-front-left',
        activeMaterials.panlatV
      )}
      
      {/* Front side panlat - center (48mm face toward camera) */}
      {createBeam(
        [0, 0, -halfDepth + beamSize/2 + panlatSpecs.width/2],
        [panlatSpecs.depth, panlatHeight, panlatSpecs.width],
        'panlat-front-center',
        activeMaterials.panlatV
      )}
      
      {/* Front side panlat - right (48mm face toward camera) */}
      {createBeam(
        [halfWidth - beamSize - panlatSpecs.depth/2, 0, -halfDepth + beamSize/2 + panlatSpecs.width/2],
        [panlatSpecs.depth, panlatHeight, panlatSpecs.width],
        'panlat-front-right',
        activeMaterials.panlatV
      )}
      
      {/* Left side panlat - front (48mm face toward left side) */}
      {createBeam(
        [-halfWidth + beamSize/2 + panlatSpecs.width/2, 0, -halfDepth + beamSize + panlatSpecs.depth/2],
        [panlatSpecs.width, panlatHeight, panlatSpecs.depth],
        'panlat-left-front',
        activeMaterials.panlatV
      )}
      
      {/* Left side panlat - back (48mm face toward left side) */}
      {createBeam(
        [-halfWidth + beamSize/2 + panlatSpecs.width/2, 0, halfDepth - beamSize - panlatSpecs.depth/2],
        [panlatSpecs.width, panlatHeight, panlatSpecs.depth],
        'panlat-left-back',
        activeMaterials.panlatV
      )}
      
      {/* Right side panlat - front (48mm face toward right side) */}
      {createBeam(
        [halfWidth - beamSize/2 - panlatSpecs.width/2, 0, -halfDepth + beamSize + panlatSpecs.depth/2],
        [panlatSpecs.width, panlatHeight, panlatSpecs.depth],
        'panlat-right-front',
        activeMaterials.panlatV
      )}
      
      {/* Right side panlat - back (48mm face toward right side) */}
      {createBeam(
        [halfWidth - beamSize/2 - panlatSpecs.width/2, 0, halfDepth - beamSize - panlatSpecs.depth/2],
        [panlatSpecs.width, panlatHeight, panlatSpecs.depth],
        'panlat-right-back',
        activeMaterials.panlatV
      )}
    </group>
  )
}