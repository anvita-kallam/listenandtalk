# Quick Start Guide

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Verify CSV file is in place:**
   The CSV file should be located at: `public/Copy of CELF-P3 - Responses.csv`
   
   If it's not there, copy it:
   ```bash
   cp "Copy of CELF-P3 - Responses.csv" public/
   ```

## Running the Dashboard

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   The dashboard will automatically open at `http://localhost:3000`

## Using the Dashboard

1. **Select a Student:**
   - Use the dropdown (mobile) or tabs (desktop) to select a student
   - All charts and insights will update automatically

2. **View Test Scores:**
   - Each test shows a bell curve with the student's score
   - Hover over the score line to see exact values
   - Color-coded regions show normative ranges

3. **Review Insights:**
   - Check the right sidebar for automated insights
   - See areas needing support, relative strengths, and progress over time

4. **Export Reports:**
   - Click the "Export" button to download or print student reports

## Troubleshooting

**CSV file not loading?**
- Make sure the file is named exactly: `Copy of CELF-P3 - Responses.csv`
- Check that it's in the `public/` folder
- Verify the file has the correct column headers

**Charts not displaying?**
- Check browser console for errors
- Ensure all required columns are present in CSV
- Verify standard scores are numeric values

**No students showing?**
- Check that `LT_Id` column has valid student IDs
- Ensure `Child_Initials` column has student names
- Verify CSV parsing completed successfully

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support  
- Safari: Full support
- Mobile browsers: Responsive design supported
