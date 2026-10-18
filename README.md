# TripWise – Smart Travel Planner

TripWise is a zero-dependency web application for discovering countries in an interactive **WebGL2 3D Circular Gallery**, checking real-time weather in each capital, reading live Wikipedia summaries, and building a persistent travel itinerary stored locally on your device.

## Features

- **3D WebGL2 Circular Gallery:** Drag, scroll, or use keyboard arrow keys to spin through country flags rendered with custom GLSL vertex/fragment shaders and physics-based momentum.
- **Search & Multi-Filter:** Search by country name, capital, or ISO code; filter by continent and population range (`5m`, `200k`); sort by name or size; or jump to a random destination.
- **Live Country Dock:** Displays capital, continent, population/area, currency, languages, live capital weather (Open-Meteo), and summary extracts (Wikipedia REST API).
- **Offline-Resilient & Private:** Caches country data (`tripwise.countries.v2`) with built-in fallback datasets and stores saved trips (`tripwise.itinerary.v1`) in `localStorage` with zero cookies or tracking.
- **Procedural Topographic Background:** Custom HTML5 Canvas marching-squares contour map that respects `prefers-reduced-motion`.

## Tech Stack & Data Sources

- **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6+), WebGL2 (GLSL ES 3.00), Canvas 2D
- **APIs Used:**
  - [REST Countries API](https://restcountries.com) & Flagcdn
  - [Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/) (CC BY-SA 4.0)
  - [Open-Meteo Weather API](https://open-meteo.com/) (CC BY 4.0)

## Running Locally

No build tools or package managers are required.
1. Clone this repository:
   ```bash
   git clone [https://github.com/](https://github.com/)<your-username>/tripwise.git
# Tripwise
