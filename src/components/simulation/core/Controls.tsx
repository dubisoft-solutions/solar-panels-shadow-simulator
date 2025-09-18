'use client'

import { houseSettings, getDisplayDimensions } from '@/config/houseSettings'

interface ControlsProps {
  sunPosition: {
    azimuth: number
    elevation: number
  }
  connectorLength: number
  layout: 'current' | 'sw-reposition' | 'sw-portrait'
  onConnectorLengthChange: (length: number) => void
  onLayoutChange: (layout: 'current' | 'sw-reposition' | 'sw-portrait') => void
}

export default function Controls({ sunPosition, connectorLength, layout, onConnectorLengthChange, onLayoutChange }: ControlsProps) {
  const displayDimensions = getDisplayDimensions(houseSettings)

  return (
    <div className="collapse collapse-plus bg-white/90 backdrop-blur-sm rounded-lg shadow-lg absolute top-4 left-4 w-80">
      <input type="checkbox" />
      <div className="collapse-title text-lg font-semibold text-gray-800">House specification</div>
      <div className="collapse-content">
        <div className="space-y-4">

          <div className="bg-gray-50 p-3 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Sun Position</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Azimuth</p>
                <p className="text-lg font-mono">{sunPosition.azimuth.toFixed(1)}°</p>
                <p className="text-xs text-gray-400">
                  {sunPosition.azimuth >= 0 && sunPosition.azimuth < 90 ? 'NE' :
                   sunPosition.azimuth >= 90 && sunPosition.azimuth < 180 ? 'SE' :
                   sunPosition.azimuth >= 180 && sunPosition.azimuth < 270 ? 'SW' : 'NW'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Elevation</p>
                <p className="text-lg font-mono">{sunPosition.elevation.toFixed(1)}°</p>
                <p className="text-xs text-gray-400">
                  {sunPosition.elevation > 0 ? 'Above horizon' : 'Below horizon'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">House Specifications</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <p>West side: {displayDimensions.westSide} (longest)</p>
              <p>North side: {displayDimensions.northSide}</p>
              <p>Height: {displayDimensions.height}</p>
              <p>Rotation: {displayDimensions.rotation}</p>
              <p>Location: {houseSettings.location.city}, {houseSettings.location.country}</p>
            </div>
          </div>

          <div className="bg-green-50 p-3 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Solar Panel Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Connector Length
                </label>
                <select
                  value={connectorLength}
                  onChange={(e) => onConnectorLengthChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value={1.320}>1320mm (Default)</option>
                  <option value={1.500}>1500mm</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Row pitch: {(connectorLength * 1000).toFixed(0)}mm between panel centers
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Layout
                </label>
                <select
                  value={layout}
                  onChange={(e) => onLayoutChange(e.target.value as 'current' | 'sw-reposition' | 'sw-portrait')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="current">Current</option>
                  <option value="sw-reposition">SW Reposition</option>
                  <option value="sw-portrait">SW Portrait</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {layout === 'current' && 'Current layout with all panels'}
                  {layout === 'sw-reposition' && 'SW panels will be repositioned (coming soon)'}
                  {layout === 'sw-portrait' && 'SW panels in portrait orientation (coming soon)'}
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            <p>View: North is up, East is right, West is left</p>
            <p>At 7:00 AM, sun should be on the RIGHT (east)</p>
            <p>At 17:00 PM, sun should be on the LEFT (west)</p>
          </div>
        </div>
      </div>
    </div>
  )
}