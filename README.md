# Listen & Talk - CELF-P3 Assessment Dashboard

Interactive data dashboard for CELF-P3 assessment results visualization.

## Features

- Student-based navigation with searchable dropdown
- Test score visualization with normative ranges (bell curve, mean, SD markers)
- Automated insights (significantly below/above mean, receptive vs. expressive patterns)
- Clinical Insight Assistant with RAG-style retrieval system
- Export and print functionality
- Responsive design with modern UI

## Tech Stack

- React 18
- D3.js for data visualization
- Vite for build tooling
- PapaParse for CSV parsing

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deployment

This project is configured for Vercel deployment.

### Vercel Deployment Steps:

1. Push your code to GitHub/GitLab/Bitbucket
2. Import your repository in Vercel
3. Vercel will automatically detect Vite and use the configuration
4. Deploy!

The project includes:
- `vercel.json` configuration for SPA routing
- Proper build settings for Vite
- Static asset optimization

## File Structure

- `/public` - Static assets (CSV data file, logo)
- `/src` - React application source code
- `/src/components` - React components
- `/src/utils` - Utility functions
- `/src/knowledgeBase` - Clinical interpretation knowledge base
- `/src/retrievalEngine` - RAG-style retrieval system

## Data

The dashboard reads from `Copy of CELF-P3 - Responses.csv` located in the `/public` folder.
