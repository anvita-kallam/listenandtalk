# Listen & Talk CELF-P3 Assessment Dashboard - Technical Description

A comprehensive React-based dashboard for visualizing and analyzing CELF-P3 assessment results.

## Overview
A React-based interactive data visualization dashboard for analyzing and presenting CELF-P3 (Clinical Evaluation of Language Fundamentals - Preschool, 3rd Edition) assessment results for a non-profit organization. The dashboard provides clinicians and families with comprehensive insights into student language development through statistical analysis and visual representations.

## Technology Stack
- **Frontend Framework**: React 18.2.0 with functional components and hooks
- **Visualization**: D3.js 7.8.5 for statistical chart rendering
- **Data Processing**: PapaParse 5.4.1 for CSV parsing
- **Build Tool**: Vite 5.0.8
- **Styling**: CSS3 with CSS variables for theming

## Architecture

### Core Components
1. **App.jsx** - Main application container managing state, data loading, and component orchestration
2. **ScoreChart.jsx** - D3.js-powered bell curve visualization with normative range overlays
3. **StudentSwitcher.jsx** - Searchable student selection with recent students tracking (localStorage)
4. **ClinicalInsightAssistant.jsx** - RAG-style retrieval system for clinical interpretations
5. **InsightsPanel.jsx** - Automated insight generation based on score patterns
6. **KPICard.jsx** - Key performance indicator display components
7. **ExportButton.jsx** - Report generation and print functionality

### Data Flow
1. CSV file (`Copy of CELF-P3 - Responses.csv`) is fetched and parsed client-side
2. Data is processed through `dataParser.js` to extract student assessments
3. Scores are normalized using `scoreCalculator.js` (z-scores, normative bands)
4. Visualizations are rendered using D3.js with statistical overlays
5. Insights are generated deterministically based on score patterns

### Key Features

#### Statistical Visualization
- **Bell Curve Charts**: Each test score is displayed on a normal distribution curve
- **Normative Overlays**: Visual bands for ±1 SD, ±2 SD ranges with color coding
- **Score Interpretation**: Automatic categorization (Significantly Below Average, Below Average, Average, Above Average, Significantly Above Average)
- **Reference Lines**: Mean, ±1 SD, and ±2 SD markers for context

#### Clinical Insight Assistant
- **Knowledge Base**: JSON-based interpretation library (`celf_interpretations.json`)
- **Retrieval Engine**: Deterministic matching based on test type, z-score, and audience (clinician/family)
- **Insight Assembler**: Combines retrieved entries without LLM dependency
- **Collapsible Sidebar**: Persistent access during scrolling

#### Data Management
- **Student Tracking**: Recent students stored in localStorage
- **Multi-Assessment Support**: Handles students with multiple testing dates
- **Age Calculation**: Age at time of testing displayed in months
- **Test Mapping**: 27+ CELF-P3 subtests and composite scores

#### Export & Reporting
- **Text Reports**: Downloadable student assessment summaries
- **Print Reports**: Styled print-friendly reports matching dashboard theme
- **Logo Integration**: Branded reports with organization logo

### Styling & Design
- **Color Scheme**: Teal primary color (#44BBA4) with light teal backgrounds
- **Typography**: Google Fonts (Inter, Space Grotesk) for modern readability
- **Layout**: Responsive grid system with sharp corners (except avatars)
- **UI Scale**: 75% zoom for comprehensive overview
- **Fixed Elements**: Logo and insights tab remain visible during scroll

### Deployment
- **Platform**: Vercel-ready configuration
- **Static Assets**: CSV and logo files served from public directory
- **Build Output**: Optimized production build via Vite

## Data Structure
- **Input**: CSV with columns for student info, test scores (standard/scaled), dates, and ages
- **Processing**: Normalized to standard scores (Mean=100, SD=15) and scaled scores (Mean=10, SD=3)
- **Output**: Structured JSON objects with calculated z-scores, percentiles, and normative bands

## Performance Considerations
- Client-side data processing for fast initial load
- Memoized calculations using React.useMemo
- Efficient D3.js rendering with proper cleanup
- LocalStorage for recent student persistence

## Accessibility
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast color coding for score interpretations
- Responsive design for various screen sizes
