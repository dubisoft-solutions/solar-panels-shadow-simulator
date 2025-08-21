/**
 * Service for handling coordinate system transformations in the 3D shadow simulation.
 * 
 * Handles conversion between:
 * - Edge-based coordinates (human-friendly config format)
 * - Center-based coordinates (Three.js native format)
 */

export interface Position3D {
  x: number
  y: number
  z: number
}

export interface Dimensions3D {
  width: number
  height: number
  depth: number
}

export class CoordinateTransformationService {
  /**
   * Converts edge-based position to center-based position for Three.js.
   * 
   * @param edgePosition Position from edge (config format)
   * @param dimensions Object dimensions
   * @returns Center position for Three.js mesh positioning
   * 
   * @example
   * // Object at west edge (x=0) with width=2m becomes center at x=1m
   * const centerPos = edgeToCenter({x: 0, y: 0, z: 0}, {width: 2, height: 1, depth: 1})
   * // Result: {x: 1, y: 0.5, z: 0.5}
   */
  static edgeToCenter(
    edgePosition: Position3D, 
    dimensions: Dimensions3D
  ): Position3D {
    return {
      x: edgePosition.x + dimensions.width / 2,
      y: edgePosition.y + dimensions.height / 2,
      z: edgePosition.z + dimensions.depth / 2
    }
  }

  /**
   * Calculates relative position within a parent coordinate system.
   * Useful for nested components where child positions are relative to parent.
   * 
   * @param parentCenter Parent's center position in world coordinates
   * @param childEdgePosition Child's edge position relative to parent's edge
   * @param childDimensions Child's dimensions
   * @returns Relative center position for Three.js group positioning
   */
  static calculateRelativePosition(
    parentCenter: Position3D,
    childEdgePosition: Position3D,
    childDimensions: Dimensions3D
  ): Position3D {
    const childCenter = this.edgeToCenter(childEdgePosition, childDimensions)
    return {
      x: childCenter.x - parentCenter.x,
      y: childCenter.y - parentCenter.y,
      z: childCenter.z - parentCenter.z
    }
  }

  /**
   * Converts center-based position back to edge-based position.
   * Useful for reverse calculations or debugging.
   * 
   * @param centerPosition Center position (Three.js format)
   * @param dimensions Object dimensions
   * @returns Edge position (config format)
   */
  static centerToEdge(
    centerPosition: Position3D,
    dimensions: Dimensions3D
  ): Position3D {
    return {
      x: centerPosition.x - dimensions.width / 2,
      y: centerPosition.y - dimensions.height / 2,
      z: centerPosition.z - dimensions.depth / 2
    }
  }

  /**
   * Calculates the center position for an array of objects positioned edge-to-edge.
   * Useful for solar panel arrays, roof objects, etc.
   * 
   * @param baseEdgePosition Starting edge position
   * @param objectDimensions Dimensions of each object
   * @param spacing Gap between objects
   * @param index Index of the object in the array (0-based)
   * @param axis Axis along which objects are arranged ('x' | 'y' | 'z')
   * @returns Center position for the object at given index
   */
  static calculateArrayItemCenter(
    baseEdgePosition: Position3D,
    objectDimensions: Dimensions3D,
    spacing: number,
    index: number,
    axis: 'x' | 'y' | 'z'
  ): Position3D {
    const dimensionKey = axis === 'x' ? 'width' : axis === 'y' ? 'height' : 'depth'
    const objectSize = objectDimensions[dimensionKey]
    
    const edgePosition = {
      ...baseEdgePosition,
      [axis]: baseEdgePosition[axis] + index * (objectSize + spacing)
    }
    
    return this.edgeToCenter(edgePosition, objectDimensions)
  }

  /**
   * Helper method to convert Position3D to Three.js position array format.
   * 
   * @param position Position3D object
   * @returns Three.js position array [x, y, z]
   */
  static toThreeJsPosition(position: Position3D): [number, number, number] {
    return [position.x, position.y, position.z]
  }

  /**
   * Helper method to convert Three.js position array to Position3D.
   * 
   * @param position Three.js position array [x, y, z]
   * @returns Position3D object
   */
  static fromThreeJsPosition(position: [number, number, number]): Position3D {
    return {
      x: position[0],
      y: position[1],
      z: position[2]
    }
  }

  /**
   * Convenience method that combines edgeToCenter and toThreeJsPosition.
   * Converts edge-based position directly to Three.js position array format.
   * 
   * @param edgePosition Position from edge (config format)
   * @param dimensions Object dimensions
   * @returns Three.js position array [x, y, z] ready for use
   * 
   * @example
   * // Instead of:
   * // const center = CoordinateTransformationService.edgeToCenter(edgePos, dims)
   * // const position = CoordinateTransformationService.toThreeJsPosition(center)
   * 
   * // Use:
   * const position = CoordinateTransformationService.edgeToThreeJs(edgePos, dims)
   */
  static edgeToThreeJs(
    edgePosition: Position3D,
    dimensions: Dimensions3D
  ): [number, number, number] {
    const centerPosition = this.edgeToCenter(edgePosition, dimensions)
    return this.toThreeJsPosition(centerPosition)
  }
}