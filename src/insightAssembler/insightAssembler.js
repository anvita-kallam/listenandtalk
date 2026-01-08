/**
 * Insight Assembler (RAG-style)
 * 
 * Combines retrieved interpretation entries into structured responses.
 * This simulates the "generation" phase of RAG, but uses only pre-written
 * content from the knowledge base.
 * 
 * Future LLM Integration:
 * - Replace this with LLM that synthesizes retrieved entries
 * - Add natural language generation from structured data
 * - Implement citation tracking and source attribution
 */

import { calculateZScore, getNormativeBand } from '../utils/scoreCalculator'

/**
 * Assemble insights for a specific test
 * @param {Object} params - Assembly parameters
 * @param {string} params.testName - Test name
 * @param {string} params.testAbbreviation - Test abbreviation
 * @param {number} params.standardScore - Student's score
 * @param {Array} params.retrievedEntries - Retrieved interpretation entries
 * @returns {Object} - Structured insight response
 */
export function assembleTestInsights({ testName, testAbbreviation, standardScore, retrievedEntries }) {
  if (!retrievedEntries || retrievedEntries.length === 0) {
    return null
  }
  
  const zScore = calculateZScore(standardScore)
  const normativeBand = getNormativeBand(zScore)
  
  // Transform retrieved entries into insight format
  const insights = retrievedEntries.map(entry => ({
    title: entry.title,
    summary: entry.summary,
    details: entry.details || entry.summary,
    source: entry.source,
    recommendations: entry.recommendations || []
  }))
  
  return {
    test: testName,
    testAbbreviation,
    score: standardScore,
    zScore: zScore?.toFixed(2) || null,
    normativeBand,
    insights,
    retrievedCount: retrievedEntries.length
  }
}

/**
 * Assemble composite comparison insights
 * @param {Object} params - Comparison parameters
 * @param {number} params.receptiveScore - RLI standard score
 * @param {number} params.expressiveScore - ELI standard score
 * @param {Array} params.retrievedEntries - Retrieved comparison entries
 * @returns {Object|null} - Structured comparison response
 */
export function assembleComparisonInsights({ receptiveScore, expressiveScore, retrievedEntries }) {
  if (!retrievedEntries || retrievedEntries.length === 0) {
    return null
  }
  
  const receptiveZ = calculateZScore(receptiveScore)
  const expressiveZ = calculateZScore(expressiveScore)
  const zDiff = receptiveZ - expressiveZ
  
  const insights = retrievedEntries.map(entry => ({
    title: entry.title,
    summary: entry.summary,
    details: entry.details || entry.summary,
    source: entry.source,
    recommendations: entry.recommendations || []
  }))
  
  return {
    type: 'composite_comparison',
    receptiveScore,
    expressiveScore,
    zDifference: zDiff?.toFixed(2) || null,
    insights,
    retrievedCount: retrievedEntries.length
  }
}

/**
 * Assemble complete insight report for a student
 * @param {Object} params - Student data
 * @param {Object} params.student - Student object
 * @param {Array} params.assessments - Assessment records
 * @param {Array} params.allRetrievedEntries - All retrieved interpretation entries
 * @param {string} params.audience - 'clinician' or 'family'
 * @returns {Object} - Complete insight report
 */
export function assembleCompleteReport({ student, assessments, allRetrievedEntries, audience = 'clinician' }) {
  if (!assessments || assessments.length === 0 || !allRetrievedEntries || allRetrievedEntries.length === 0) {
    return {
      student: student?.name || 'Unknown',
      audience,
      testInsights: [],
      comparisons: [],
      totalRetrieved: 0,
      timestamp: new Date().toISOString()
    }
  }
  
  const latestAssessment = assessments.sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  )[0]
  
  // Group entries by test type
  const testInsights = []
  const comparisonEntries = []
  
  for (const entry of allRetrievedEntries) {
    if (entry.test_type === 'Composite Comparison') {
      comparisonEntries.push(entry)
    } else {
      // Find matching test data
      const testKey = entry.test_abbreviation
      const testData = latestAssessment.tests[testKey]
      
      if (testData && testData.standardScore) {
        // Check if we already have insights for this test
        let existing = testInsights.find(t => t.testAbbreviation === testKey)
        
        if (!existing) {
          existing = {
            test: entry.test_type,
            testAbbreviation: testKey,
            score: testData.standardScore,
            zScore: calculateZScore(testData.standardScore)?.toFixed(2) || null,
            normativeBand: getNormativeBand(calculateZScore(testData.standardScore)),
            insights: [],
            retrievedCount: 0
          }
          testInsights.push(existing)
        }
        
        existing.insights.push({
          title: entry.title,
          summary: entry.summary,
          details: entry.details || entry.summary,
          source: entry.source,
          recommendations: entry.recommendations || []
        })
        existing.retrievedCount++
      }
    }
  }
  
  // Assemble comparison insights
  const comparisons = []
  if (comparisonEntries.length > 0) {
    const rliTest = latestAssessment.tests.RLI
    const eliTest = latestAssessment.tests.ELI
    
    if (rliTest?.standardScore && eliTest?.standardScore) {
      const comparison = assembleComparisonInsights({
        receptiveScore: rliTest.standardScore,
        expressiveScore: eliTest.standardScore,
        retrievedEntries: comparisonEntries
      })
      
      if (comparison) {
        comparisons.push(comparison)
      }
    }
  }
  
  return {
    student: student?.name || 'Unknown',
    studentId: student?.id || null,
    audience,
    assessmentDate: latestAssessment.date?.toISOString() || null,
    testInsights,
    comparisons,
    totalRetrieved: allRetrievedEntries.length,
    timestamp: new Date().toISOString()
  }
}
