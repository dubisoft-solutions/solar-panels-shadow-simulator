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
3. The site will be available at `https://yourusername.github.io/solar-panels-shadow-simulator`

### Troubleshooting

If the app doesn't load resources:
- Ensure your repository name matches the `basePath` in `next.config.ts` (currently set to `/solar-panels-shadow-simulator`)
- If you use a different repository name, update the `basePath` and `assetPrefix` in `next.config.ts`
- Check that GitHub Actions deployment completed successfully
- The `.nojekyll` file is included to prevent GitHub Pages from ignoring `_next` folder

## Architecture

The application follows a modular architecture with separate services for coordinate transformation and panel spacing calculations. The 3D scene is rendered using React Three Fiber with real-time shadow casting and camera controls.

## Construction Notes

### Panlat Connection Methods (22×48mm to 50×50mm main frame)

For connecting KONSTA Vuren panlat beams to the main wooden frame, here are 5 practical methods:

**1. Metal angle brackets:**
- Small 90° brackets screwed to both the main beam and panlat
- Hidden behind the panlat, won't interfere with rabat mounting
- Clean, professional look

**2. Long screws at an angle:**
- 80-100mm screws driven at 45° through the panlat into the main beam
- Pre-drill to avoid splitting
- Countersink so heads are flush

**3. Construction adhesive + screws:**
- Strong polyurethane adhesive on contact surfaces
- Plus a few screws for clamping while it cures
- Very strong permanent bond

**4. Pocket screws:**
- Use a Kreg jig to drill angled holes through the panlat
- Screws go into the main beam at angle
- Very strong connection, holes are hidden

**5. French cleats:**
- Small wooden cleats screwed to both pieces
- Allows easy removal if needed later
- Good for temporary or adjustable installations

**Recommended:** Method #1 (metal brackets) or #3 (adhesive + screws) for best strength and durability.

### Wooden Shell Roof Beam Cutting Angles

For the pitched roof construction, the following sawing angles are required:

**Roof Beams (50×50mm):**
- **Bottom cut:** 30° angle cut to sit on horizontal frame beams
- **Top cut:** 60° angle cut at the ridge end
- **Geometry check:** 30° + 30° + 120° = 180° (the 120° peak angle is formed by two 60° cuts meeting)

**Ridge Beam (50×50mm):**
- **Standard cuts:** Square cuts at both ends
- **Length:** Full depth of shell frame (310mm)

**Construction Notes:**
- Use a miter saw set to 30° for bottom cuts
- Use a miter saw set to 60° for top cuts at ridge
- The two roof beams meeting at ridge will form a 120° angle
- Pre-drill pilot holes to prevent splitting
- All cuts should be made with the beam lying flat for safety
