'use client'

import { useState } from 'react'
import { houseSettings, getDisplayDimensions } from '@/config/houseSettings'

interface ControlsProps {
  date: Date
  time: number
  sunPosition: {
    azimuth: number
    elevation: number
  }
  onDateChange: (date: Date) => void
  onTimeChange: (time: number) => void
}

export default function Controls({ date, time, sunPosition, onDateChange, onTimeChange }: ControlsProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const displayDimensions = getDisplayDimensions(houseSettings)

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const handleDateChange = (dateString: string) => {
    onDateChange(new Date(dateString))
  }

  const formatTime = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.floor((hours - h) * 60)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  const getDayOfYear = (date: Date) => {
    const start = new Date(date.getFullYear(), 0, 0)
    const diff = date.getTime() - start.getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4 w-80">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Shadow Simulator</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-600 hover:text-gray-800"
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formatDate(date)}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Day {getDayOfYear(date)} of {date.getFullYear()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time: {formatTime(time)}
            </label>
            <input
              type="range"
              min="6"
              max="22"
              step="0.25"
              value={time}
              onChange={(e) => onTimeChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>22:00</span>
            </div>
          </div>

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

          <div className="text-xs text-gray-500">
            <p>View: North is up, East is right, West is left</p>
            <p>At 7:00 AM, sun should be on the RIGHT (east)</p>
            <p>At 17:00 PM, sun should be on the LEFT (west)</p>
          </div>
        </div>
      )}
    </div>
  )
}