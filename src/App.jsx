import React, { useState, useEffect, useMemo } from 'react'
import Papa from 'papaparse'
import StudentSwitcher from './components/StudentSwitcher'
import ScoreChart from './components/ScoreChart'
import InsightsPanel from './components/InsightsPanel'
import ClinicalInsightAssistant from './components/ClinicalInsightAssistant'
import ExportButton from './components/ExportButton'
import KPICard from './components/KPICard'
import { calculateZScore, getNormativeBand } from './utils/scoreCalculator'
import { processCSVData, getUniqueStudents, TEST_NAMES } from './utils/dataParser'
import './App.css'

// Main application component for CELF-P3 Assessment Dashboard

function App() {
  const [data, setData] = useState([])
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isInsightPanelOpen, setIsInsightPanelOpen] = useState(false)

  useEffect(() => {
    // Load and parse CSV file
    fetch('/Copy of CELF-P3 - Responses.csv')
      .then(response => response.text())
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            try {
              const processedData = processCSVData(results.data)
              const uniqueStudents = getUniqueStudents(processedData)
              
              setData(processedData)
              setStudents(uniqueStudents)
              
              // Select first student by default
              if (uniqueStudents.length > 0) {
                setSelectedStudent(uniqueStudents[0])
              }
              
              setLoading(false)
            } catch (err) {
              console.error('Error processing data:', err)
              setError('Failed to process CSV data. Please check the file format.')
              setLoading(false)
            }
          },
          error: (err) => {
            console.error('CSV parsing error:', err)
            setError('Failed to parse CSV file.')
            setLoading(false)
          }
        })
      })
      .catch(err => {
        console.error('Error loading CSV:', err)
        setError('Failed to load CSV file. Make sure the file exists in the public folder.')
        setLoading(false)
      })
  }, [])

  const handleStudentChange = (studentId) => {
    const student = students.find(s => s.id === studentId)
    setSelectedStudent(student)
  }

  // Calculate student assessments and insights - must be before conditional returns
  const { studentAssessments, tests, insights, kpiMetrics } = useMemo(() => {
    // Default values when no student is selected
    if (!selectedStudent || !data || data.length === 0) {
      return {
        studentAssessments: [],
        tests: [],
        insights: [],
        kpiMetrics: null
      }
    }

    // Get all assessments for the selected student
    const assessments = data.filter(
      record => record.studentId === selectedStudent.id
    )

    // Get all unique tests for this student
    const uniqueTests = [
      ...new Set(assessments.flatMap(assessment => Object.keys(assessment.tests)))
    ].filter(test => test !== 'undefined' && test !== null)

    // Calculate insights for export
    const insightsList = []
    let kpiData = null
    
    if (assessments.length > 0) {
      const { mean, sd } = { mean: 100, sd: 15 } // CELF-P3 normative params
      const latestAssessment = assessments.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      )[0]
      
      // Calculate KPI metrics
      if (latestAssessment && latestAssessment.tests) {
        const cls = latestAssessment.tests.CLS?.standardScore
        const rli = latestAssessment.tests.RLI?.standardScore
        const eli = latestAssessment.tests.ELI?.standardScore
        
        // Get previous assessment for comparison
        const previousAssessment = assessments.length > 1 
          ? assessments.sort((a, b) => new Date(b.date) - new Date(a.date))[1]
          : null
        
        const prevCLS = previousAssessment?.tests.CLS?.standardScore
        const prevRLI = previousAssessment?.tests.RLI?.standardScore
        const prevELI = previousAssessment?.tests.ELI?.standardScore
        
        // Calculate changes
        const clsChange = cls && prevCLS ? ((cls - prevCLS) / prevCLS) * 100 : null
        const rliChange = rli && prevRLI ? ((rli - prevRLI) / prevRLI) * 100 : null
        const eliChange = eli && prevELI ? ((eli - prevELI) / prevELI) * 100 : null
        
        // Count tests in each band
        const testEntries = Object.entries(latestAssessment.tests || {})
        const belowAvgCount = testEntries.filter(([_, test]) => 
          test.standardScore !== null && test.standardScore < mean - sd
        ).length
        const avgCount = testEntries.filter(([_, test]) => 
          test.standardScore !== null && test.standardScore >= mean - sd && test.standardScore <= mean + sd
        ).length
        const aboveAvgCount = testEntries.filter(([_, test]) => 
          test.standardScore !== null && test.standardScore > mean + sd
        ).length
        
        kpiData = {
          coreLanguageScore: cls,
          coreLanguageChange: clsChange,
          receptiveLanguageIndex: rli,
          receptiveChange: rliChange,
          expressiveLanguageIndex: eli,
          expressiveChange: eliChange,
          totalTests: testEntries.length,
          belowAverageCount: belowAvgCount,
          averageCount: avgCount,
          aboveAverageCount: aboveAvgCount
        }
      }
      
      if (latestAssessment) {
        const testEntries = Object.entries(latestAssessment.tests || {})
        
        const belowAverage = testEntries
          .filter(([_, test]) => test.standardScore !== null && test.standardScore < mean - sd)
          .map(([key, test]) => ({
            test: test.testName || key,
            score: test.standardScore
          }))
        
        const aboveAverage = testEntries
          .filter(([_, test]) => test.standardScore !== null && test.standardScore > mean + sd)
          .map(([key, test]) => ({
            test: test.testName || key,
            score: test.standardScore
          }))
        
        if (belowAverage.length > 0) {
          insightsList.push({
            type: 'below-average',
            title: 'Areas Needing Support',
            items: belowAverage.map(item => `${item.test}: ${item.score}`)
          })
        }
        
        if (aboveAverage.length > 0) {
          insightsList.push({
            type: 'above-average',
            title: 'Relative Strengths',
            items: aboveAverage.map(item => `${item.test}: ${item.score}`)
          })
        }
      }
    }

    return {
      studentAssessments: assessments,
      tests: uniqueTests,
      insights: insightsList,
      kpiMetrics: kpiData
    }
  }, [selectedStudent, data])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading assessment data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    )
  }

  if (!selectedStudent || students.length === 0) {
    return (
      <div className="error-container">
        <h2>No Data Available</h2>
        <p>No student data found in the CSV file.</p>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="background-logo"></div>

      {/* Left sidebar tab button */}
      <button
        className={`insight-panel-tab ${isInsightPanelOpen ? 'panel-open' : ''}`}
        onClick={() => setIsInsightPanelOpen(!isInsightPanelOpen)}
        aria-label={isInsightPanelOpen ? 'Close Clinical Insight Assistant' : 'Open Clinical Insight Assistant'}
        aria-expanded={isInsightPanelOpen}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          {isInsightPanelOpen ? (
            <path d="M12.5 7.5L7.5 12.5M7.5 7.5L12.5 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          ) : (
            <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          )}
        </svg>
        <span className="tab-label">Insights</span>
      </button>

      {/* Clinical Insight Assistant Sidebar */}
      <aside className={`insight-panel-sidebar ${isInsightPanelOpen ? 'open' : ''}`}>
        <div className="insight-panel-content">
          <ClinicalInsightAssistant
            student={selectedStudent}
            assessments={studentAssessments}
          />
        </div>
      </aside>

      {/* Overlay when panel is open on mobile */}
      {isInsightPanelOpen && (
        <div 
          className="insight-panel-overlay"
          onClick={() => setIsInsightPanelOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className={`app-main ${isInsightPanelOpen ? 'insight-panel-open' : ''}`}>
        {/* Dashboard Header */}
        <div className="dashboard-header">
          <div className="header-title-section">
            <h1 className="dashboard-title">CELF-P3 Assessment Dashboard</h1>
            <p className="dashboard-subtitle">Listen & Talk</p>
          </div>
          <div className="header-actions">
            <ExportButton
              student={selectedStudent}
              assessments={studentAssessments}
              insights={insights}
            />
          </div>
        </div>

        {/* Student Selector */}
        <div className="navigation-section">
          <StudentSwitcher
            students={students}
            selectedStudent={selectedStudent}
            onStudentChange={handleStudentChange}
          />
        </div>

        {/* KPI Cards */}
        {kpiMetrics && (
          <div className="kpi-grid">
            {kpiMetrics.coreLanguageScore !== null && (
              <KPICard
                title="Core Language Score"
                value={kpiMetrics.coreLanguageScore}
                change={kpiMetrics.coreLanguageChange}
                changeType={kpiMetrics.coreLanguageChange >= 0 ? 'increase' : 'decrease'}
                color="purple"
              />
            )}
            {kpiMetrics.receptiveLanguageIndex !== null && (
              <KPICard
                title="Receptive Language"
                value={kpiMetrics.receptiveLanguageIndex}
                change={kpiMetrics.receptiveChange}
                changeType={kpiMetrics.receptiveChange >= 0 ? 'increase' : 'decrease'}
                color="blue"
              />
            )}
            {kpiMetrics.expressiveLanguageIndex !== null && (
              <KPICard
                title="Expressive Language"
                value={kpiMetrics.expressiveLanguageIndex}
                change={kpiMetrics.expressiveChange}
                changeType={kpiMetrics.expressiveChange >= 0 ? 'increase' : 'decrease'}
                color="blue"
              />
            )}
            <KPICard
              title="Tests Assessed"
              value={kpiMetrics.totalTests}
              color="green"
            />
            <KPICard
              title="Below Average"
              value={kpiMetrics.belowAverageCount}
              color="red"
            />
            <KPICard
              title="Above Average"
              value={kpiMetrics.aboveAverageCount}
              color="green"
            />
          </div>
        )}

        <div className="dashboard-content">
          <div className="charts-section">
            <div className="section-header">
              <h2 className="section-title">
                Assessment Results for {selectedStudent.name}
              </h2>
            </div>
            
            {tests.length === 0 ? (
              <div className="no-data-message">
                <p>No test scores available for this student.</p>
              </div>
            ) : (
              <div className="charts-grid">
                {tests.map(testName => {
                  // Get the most recent assessment for this test
                  const testAssessments = studentAssessments
                    .filter(a => a.tests[testName])
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                  
                  if (testAssessments.length === 0) return null
                  
                  const latestAssessment = testAssessments[0]
                  const testData = latestAssessment.tests[testName]
                  
                  // Get full test name from testData, fallback to TEST_NAMES mapping
                  const fullTestName = testData.testName || TEST_NAMES[testName] || testName
                  
                  return (
                    <div key={testName} className="chart-container">
                      <h3 className="chart-title">{fullTestName}</h3>
                      <ScoreChart
                        testName={fullTestName}
                        score={testData.standardScore}
                        percentile={testData.percentile}
                        date={latestAssessment.date}
                        age={latestAssessment.age}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <aside className="insights-section">
            <InsightsPanel
              student={selectedStudent}
              assessments={studentAssessments}
            />
          </aside>
        </div>
      </main>
    </div>
  )
}

export default App
