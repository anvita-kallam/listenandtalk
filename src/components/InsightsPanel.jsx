import React, { useMemo } from 'react'
import { getScoreInterpretation, getNormativeParams } from '../utils/dataParser'
import './InsightsPanel.css'

// Automated insights panel for score analysis

function InsightsPanel({ student, assessments }) {
  const insights = useMemo(() => {
    if (!assessments || assessments.length === 0) return []

    const { mean, sd } = getNormativeParams('standard')
    const insightsList = []

    // Get the most recent assessment
    const latestAssessment = assessments.sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    )[0]

    if (!latestAssessment) return []

    const tests = latestAssessment.tests || {}
    const testEntries = Object.entries(tests)

    // Find significantly below average scores (≤ -1 SD)
    const belowAverage = testEntries
      .filter(([_, test]) => test.standardScore !== null && test.standardScore < mean - sd)
      .map(([key, test]) => ({
        test: test.testName || key,
        score: test.standardScore,
        interpretation: getScoreInterpretation(test.standardScore)
      }))
      .sort((a, b) => a.score - b.score)

    // Find significantly above average scores (≥ +1 SD)
    const aboveAverage = testEntries
      .filter(([_, test]) => test.standardScore !== null && test.standardScore > mean + sd)
      .map(([key, test]) => ({
        test: test.testName || key,
        score: test.standardScore,
        interpretation: getScoreInterpretation(test.standardScore)
      }))
      .sort((a, b) => b.score - a.score)

    // Compare Receptive vs Expressive
    const receptiveTests = ['RLI', 'SC', 'BC', 'WC', 'DPP', 'PRS']
    const expressiveTests = ['ELI', 'WS', 'EV', 'FD', 'RS']

    const receptiveScores = testEntries
      .filter(([key]) => receptiveTests.includes(key))
      .map(([_, test]) => test.standardScore)
      .filter(score => score !== null)

    const expressiveScores = testEntries
      .filter(([key]) => expressiveTests.includes(key))
      .map(([_, test]) => test.standardScore)
      .filter(score => score !== null)

    const avgReceptive = receptiveScores.length > 0
      ? receptiveScores.reduce((a, b) => a + b, 0) / receptiveScores.length
      : null

    const avgExpressive = expressiveScores.length > 0
      ? expressiveScores.reduce((a, b) => a + b, 0) / expressiveScores.length
      : null

    // Progress over time
    const progressInsights = []
    if (assessments.length > 1) {
      const sortedAssessments = [...assessments].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      )

      // Compare first and last assessment for each test
      const firstAssessment = sortedAssessments[0]
      const lastAssessment = sortedAssessments[sortedAssessments.length - 1]

      const testKeys = new Set([
        ...Object.keys(firstAssessment.tests || {}),
        ...Object.keys(lastAssessment.tests || {})
      ])

      for (const testKey of testKeys) {
        const firstScore = firstAssessment.tests[testKey]?.standardScore
        const lastScore = lastAssessment.tests[testKey]?.standardScore

        if (firstScore !== null && lastScore !== null) {
          const change = lastScore - firstScore
          const testName = firstAssessment.tests[testKey]?.testName || testKey

          if (Math.abs(change) >= 5) { // Significant change (≥ 5 points)
            progressInsights.push({
              test: testName,
              change: change,
              firstScore,
              lastScore,
              firstDate: firstAssessment.date,
              lastDate: lastAssessment.date
            })
          }
        }
      }
    }

    // Build insights array
    if (belowAverage.length > 0) {
      insightsList.push({
        type: 'below-average',
        title: 'Areas Needing Support',
        items: belowAverage.map(item => 
          `${item.test}: ${item.score} (${item.interpretation})`
        )
      })
    }

    if (aboveAverage.length > 0) {
      insightsList.push({
        type: 'above-average',
        title: 'Relative Strengths',
        items: aboveAverage.map(item => 
          `${item.test}: ${item.score} (${item.interpretation})`
        )
      })
    }

    if (avgReceptive !== null && avgExpressive !== null) {
      const difference = Math.abs(avgReceptive - avgExpressive)
      if (difference >= 10) { // Significant difference
        const stronger = avgReceptive > avgExpressive ? 'Receptive' : 'Expressive'
        insightsList.push({
          type: 'receptive-expressive',
          title: 'Receptive vs Expressive Comparison',
          items: [
            `Average Receptive: ${avgReceptive.toFixed(1)}`,
            `Average Expressive: ${avgExpressive.toFixed(1)}`,
            `${stronger} language skills are ${difference.toFixed(1)} points higher`
          ]
        })
      }
    }

    if (progressInsights.length > 0) {
      insightsList.push({
        type: 'progress',
        title: 'Progress Over Time',
        items: progressInsights.map(item => {
          const direction = item.change > 0 ? 'improved' : 'declined'
          const changeStr = Math.abs(item.change)
          return `${item.test}: ${direction} by ${changeStr} points (${item.firstScore} → ${item.lastScore})`
        })
      })
    }

    return insightsList
  }, [assessments])

  if (insights.length === 0) {
    return (
      <aside className="insights-panel">
        <h2 className="insights-title">Insights</h2>
        <div className="insights-content">
          <p className="no-insights">No significant patterns detected at this time.</p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="insights-panel" aria-label="Assessment insights">
      <h2 className="insights-title">Insights</h2>
      <div className="insights-content">
        {insights.map((insight, index) => (
          <div key={index} className={`insight-card insight-${insight.type}`}>
            <h3 className="insight-title">{insight.title}</h3>
            <ul className="insight-list">
              {insight.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  )
}

export default InsightsPanel
