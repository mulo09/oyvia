# Olas y Vientos - Surf & Kite News Platform

A modern Angular application dedicated to the latest news and information about Surfing and Kitesurfing.

## Project Structure

### Components

1. **Home Component** (`src/app/home/`)
   - Main landing page
   - Contains video stage with hero video
   - Integrates TextAndDescription and ArticleGrid components

2. **TextAndDescription Component** (`src/app/text-and-description/`)
   - Displays title and description text
   - Customizable via @Input properties
   - Responsive design with Bootstrap

3. **ArticleGrid Component** (`src/app/articlegrid/`)
   - Displays articles in an alternating grid layout
   - Fetches articles from backend API
   - Shows article preview with image, title, description, and metadata
   - Responsive design with mobile support

### Models

- **Newsmodel** (`src/app/models/newsmodel.ts`)
  - Represents article/news data structure
  - Fields: id, name, description, fileList, date, author, category

- **Filesmodel** (`src/app/models/filesmodels.ts`)
  - Represents file/image data for articles

### Services

- **Conectionws2** (`src/app/services/conectionws.ts`)
  - HTTP service for API calls
  - Handles GET, POST, DELETE requests
  - Configurable endpoint

## Setup Instructions

1. Install dependencies:
   ```bash
   cd ~/workspace/oyvia
   npm install
   ```

2. Add your hero video:
   - Place a video file named `surf-kite.mp4` in `public/assets/videos/`
   - Format: MP4, landscape orientation recommended

3. Run development server:
   ```bash
   npm start
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Technologies

- **Angular** (latest version)
- **Bootstrap** (for responsive styling)
- **SCSS** (for styling)
- **TypeScript**

## API Configuration

The ArticleGrid component is configured to fetch articles from:
`http://51.92.169.204:8070/getarticles`

To change the API endpoint, modify the service call in `src/app/articlegrid/articlegrid.ts`

## Features

- ✅ Responsive video hero section
- ✅ Article grid with alternating layout
- ✅ Bootstrap integration
- ✅ SCSS styling
- ✅ TypeScript models
- ✅ HTTP service for API calls
- ✅ Routing configured
