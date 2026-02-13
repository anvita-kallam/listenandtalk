/**
 * Export utilities for charts and reports
 * 
 * Supports text file export and print-friendly HTML reports
 */

/**
 * Export a chart as PNG image
 */
export function exportChartAsPNG(svgElement, filename = 'chart.png') {
  if (!svgElement) return

  // Get SVG data
  const svgData = new XMLSerializer().serializeToString(svgElement)
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)

  // Create image
  const img = new Image()
  img.onload = () => {
    // Create canvas
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    
    // Draw image on canvas
    ctx.drawImage(img, 0, 0)
    
    // Convert to PNG and download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 'image/png')
    
    URL.revokeObjectURL(url)
  }
  img.src = url
}

/**
 * Export student report as text file
 */
export function exportStudentReport(student, assessments, insights) {
  if (!student || !assessments || assessments.length === 0) return

  const latestAssessment = assessments.sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  )[0]

  let report = `CELF-P3 Assessment Report\n`
  report += `========================\n\n`
  report += `Student: ${student.name} (ID: ${student.id})\n`
  report += `Report Date: ${new Date().toLocaleDateString()}\n\n`

  if (latestAssessment) {
    report += `Most Recent Assessment\n`
    report += `Date: ${latestAssessment.date.toLocaleDateString()}\n`
    if (latestAssessment.age) {
      report += `Age at Testing: ${latestAssessment.age} months\n`
    }
    report += `\n`

    report += `Test Scores:\n`
    report += `------------\n`
    const tests = Object.entries(latestAssessment.tests || {})
    for (const [key, test] of tests) {
      if (test.standardScore !== null) {
        report += `${test.testName || key}:\n`
        report += `  Standard Score: ${test.standardScore}\n`
        if (test.percentile !== null) {
          report += `  Percentile: ${test.percentile}%\n`
        }
        if (test.scaledScore !== null) {
          report += `  Scaled Score: ${test.scaledScore}\n`
        }
        report += `\n`
      }
    }
  }

  if (insights && insights.length > 0) {
    report += `Insights:\n`
    report += `---------\n`
    for (const insight of insights) {
      report += `${insight.title}:\n`
      for (const item of insight.items) {
        report += `  • ${item}\n`
      }
      report += `\n`
    }
  }

  // Create and download file
  const blob = new Blob([report], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${student.name.replace(/\s+/g, '_')}_CELF-P3_Report.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Print student report
 */
export function printStudentReport(student, assessments) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups to print the report')
    return
  }

  const latestAssessment = assessments.sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  )[0]

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>CELF-P3 Report - ${student.name}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
          background: #ffffff;
          color: #1f2937;
          line-height: 1.6;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #7AC9B8;
        }
        
        .logo {
          width: 120px;
          height: 120px;
          background-image: url('/logo.png');
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          opacity: 0.6;
        }
        
        h1 {
          font-family: 'Space Grotesk', sans-serif;
          color: #44BBA4;
          font-size: 2rem;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.02em;
        }
        
        .subtitle {
          color: #6b7280;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }
        
        h2 {
          font-family: 'Space Grotesk', sans-serif;
          color: #1f2937;
          margin-top: 30px;
          font-size: 1.375rem;
          font-weight: 600;
          letter-spacing: -0.01em;
        }
        
        .info-section {
          background: #E8F8F6;
          padding: 1.5rem;
          border: 2px solid #7AC9B8;
          margin: 20px 0;
        }
        
        .info-section p {
          margin: 0.5rem 0;
          color: #1f2937;
        }
        
        .info-section strong {
          color: #44BBA4;
          font-weight: 600;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          border: 2px solid #7AC9B8;
        }
        
        th, td {
          border: 2px solid #7AC9B8;
          padding: 12px;
          text-align: left;
        }
        
        th {
          background-color: #D1F0EB;
          font-weight: 600;
          color: #1f2937;
          font-family: 'Space Grotesk', sans-serif;
        }
        
        td {
          background-color: #ffffff;
        }
        
        tr:nth-child(even) td {
          background-color: #E8F8F6;
        }
        
        .score-below {
          color: #dc2626;
          font-weight: 600;
        }
        
        .score-average {
          color: #d97706;
          font-weight: 600;
        }
        
        .score-above {
          color: #059669;
          font-weight: 600;
        }
        
        @media print {
          body { 
            padding: 20px;
          }
          .header {
            page-break-inside: avoid;
          }
          table {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>CELF-P3 Assessment Report</h1>
          <p class="subtitle">Listen & Talk</p>
        </div>
        <div class="logo"></div>
      </div>
      
      <div class="info-section">
        <h2 style="margin-top: 0;">Student Information</h2>
        <p><strong>Name:</strong> ${student.name}</p>
        <p><strong>ID:</strong> ${student.id}</p>
        ${latestAssessment ? `
          <p><strong>Assessment Date:</strong> ${latestAssessment.date.toLocaleDateString()}</p>
          ${latestAssessment.age ? `<p><strong>Age at Testing:</strong> ${latestAssessment.age} months</p>` : ''}
        ` : ''}
      </div>
      
      ${latestAssessment ? `
        <h2>Test Scores</h2>
        <table>
          <thead>
            <tr>
              <th>Test</th>
              <th>Standard Score</th>
              <th>Percentile</th>
              <th>Scaled Score</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(latestAssessment.tests || {})
              .filter(([_, test]) => test.standardScore !== null)
              .map(([key, test]) => {
                const score = test.standardScore;
                const mean = 100;
                const sd = 15;
                let scoreClass = 'score-average';
                if (score < mean - sd) scoreClass = 'score-below';
                else if (score > mean + sd) scoreClass = 'score-above';
                
                return `
                <tr>
                  <td>${test.testName || key}</td>
                  <td class="${scoreClass}">${test.standardScore}</td>
                  <td>${test.percentile !== null ? test.percentile + '%' : 'N/A'}</td>
                  <td>${test.scaledScore !== null ? test.scaledScore : 'N/A'}</td>
                </tr>
              `;
              }).join('')}
          </tbody>
        </table>
      ` : ''}
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  
  // Wait for content to load before printing
  setTimeout(() => {
    printWindow.print()
  }, 250)
}
