# Solar Panel Shadow Simulator

A 3D interactive solar panel shadow simulator built with Next.js, React Three Fiber, and Three.js. This application visualizes solar panel installations on rooftops and simulates realistic shadows based on accurate sun position calculations.

## Features

- **Real-time 3D visualization** of solar panels and shadows
- **Accurate sun positioning** using SunCalc library with GPS coordinates
- **Multiple installation layouts** (landscape, portrait, repositioned)
- **Interactive controls** for date, time, and configuration parameters
- **Configurable panel spacing** with adjustable connector lengths
- **Shadow analysis** for different times of day and seasons

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the simulator.

## Configuration

The simulator uses configuration files in `/src/config/`:

- `houseSettings.ts` - House dimensions, GPS location, roof specifications
- `solarPanelInstallationSettings.ts` - Panel dimensions, platform specs, visual settings
- `simulatorSettings.ts` - Default date/time settings

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

This project is configured for deployment to GitHub Pages:

1. **Automatic Deployment**: Push to main/master branch triggers automatic deployment via GitHub Actions
2. **Manual Deployment**: Use the "Actions" tab in your GitHub repository to manually trigger deployment
3. **Local Build**: Run `npm run build` to generate static files in the `out/` directory

### Setup GitHub Pages

1. Go to your repository Settings → Pages
2. Set Source to "GitHub Actions"
3. The site will be available at `https://yourusername.github.io/shadow-simulator`

## Architecture

The application follows a modular architecture with separate services for coordinate transformation and panel spacing calculations. The 3D scene is rendered using React Three Fiber with real-time shadow casting and camera controls.
