/**
 * RAG-style Retrieval Engine (Mockup)
 * 
 * This module simulates a retrieval-augmented generation system by:
 * 1. Matching student scores to knowledge base entries
 * 2. Filtering by test type, score range, and audience
 * 3. Returning relevant interpretation entries
 * 
 * Future LLM Integration:
 * - Replace exact matching with semantic similarity (embeddings)
 * - Use vector database for efficient retrieval
 * - Add reranking based on relevance scores
 * 
 * Currently uses deterministic matching logic
 */

import interpretations from '../knowledgeBase/celf_interpretations.json'
import { calculateZScore } from '../utils/scoreCalculator'

/**
 * Check if a z-score falls within a specified range
 * @param {number} zScore - Student's z-score
 * @param {Object} range - Range object with min_z and/or max_z
 * @returns {boolean} - True if z-score matches range
 */
function matchesScoreRange(zScore, range) {
  if (zScore === null || zScore === undefined || isNaN(zScore)) {
    return false
  }
  
  if (range.min_z !== undefined && zScore < range.min_z) {
    return false
  }
  
  if (range.max_z !== undefined && zScore > range.max_z) {
    return false
  }
  
  return true
}

/**
 * Check if z-score difference matches range (for composite comparisons)
 * @param {number} zDiff - Difference between two z-scores
 * @param {Object} range - Range object with min_z_diff and/or max_z_diff
 * @returns {boolean} - True if difference matches range
 */
function matchesZDiffRange(zDiff, range) {
  if (zDiff === null || zDiff === undefined || isNaN(zDiff)) {
    return false
  }
  
  if (range.min_z_diff !== undefined && zDiff < range.min_z_diff) {
    return false
  }
  
  if (range.max_z_diff !== undefined && zDiff > range.max_z_diff) {
    return false
  }
  
  return true
}

/**
 * Retrieve interpretation entries for a specific test
 * @param {Object} params - Retrieval parameters
 * @param {string} params.testName - Test name (e.g., "Receptive Language Index")
 * @param {string} params.testAbbreviation - Test abbreviation (e.g., "RLI")
 * @param {number} params.standardScore - Student's standard score
 * @param {string} params.audience - 'clinician' or 'family'
 * @returns {Array} - Array of matching interpretation entries
 */
export function retrieveTestInterpretations({ testName, testAbbreviation, standardScore, audience = 'clinician' }) {
  if (!standardScore || isNaN(standardScore)) {
    return []
  }
  
  const zScore = calculateZScore(standardScore, 'standard')
  
  // Filter interpretations by:
  // 1. Test type match (name or abbreviation)
  // 2. Score range match
  // 3. Audience match
  const matches = interpretations.filter(entry => {
    // Check test type match
    const testMatch = 
      entry.test_type === testName ||
      entry.test_abbreviation === testAbbreviation ||
      entry.test_type === 'Composite Comparison' // Special case for comparisons
    
    if (!testMatch) return false
    
    // Check audience match
    if (entry.audience !== audience) return false
    
    // Check score range match
    if (entry.score_range) {
      // For composite comparisons, we need z-score differences
      if (entry.test_type === 'Composite Comparison') {
        // This will be handled separately in retrieveCompositeComparisons
        return false
      }
      
      return matchesScoreRange(zScore, entry.score_range)
    }
    
    return false
  })
  
  return matches
}

/**
 * Retrieve composite comparison interpretations
 * @param {Object} params - Comparison parameters
 * @param {number} params.receptiveZScore - Receptive Language Index z-score
 * @param {number} params.expressiveZScore - Expressive Language Index z-score
 * @param {string} params.audience - 'clinician' or 'family'
 * @returns {Array} - Array of matching comparison entries
 */
export function retrieveCompositeComparisons({ receptiveZScore, expressiveZScore, audience = 'clinician' }) {
  if (receptiveZScore === null || expressiveZScore === null) {
    return []
  }
  
  const zDiff = receptiveZScore - expressiveZScore
  
  // Filter for composite comparison entries
  const matches = interpretations.filter(entry => {
    if (entry.test_type !== 'Composite Comparison') return false
    if (entry.audience !== audience) return false
    
    if (entry.score_range) {
      return matchesZDiffRange(zDiff, entry.score_range)
    }
    
    return false
  })
  
  return matches
}

/**
 * Retrieve all relevant interpretations for a student
 * @param {Object} params - Student assessment data
 * @param {Object} params.assessments - Array of assessment records
 * @param {string} params.audience - 'clinician' or 'family'
 * @returns {Array} - All matching interpretation entries
 */
export function retrieveAllInterpretations({ assessments, audience = 'clinician' }) {
  if (!assessments || assessments.length === 0) {
    return []
  }
  
  // Get most recent assessment
  const latestAssessment = assessments.sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  )[0]
  
  if (!latestAssessment || !latestAssessment.tests) {
    return []
  }
  
  const allMatches = []
  
  // Retrieve interpretations for each test
  for (const [testKey, testData] of Object.entries(latestAssessment.tests)) {
    if (!testData.standardScore) continue
    
    const testName = testData.testName || testKey
    const matches = retrieveTestInterpretations({
      testName,
      testAbbreviation: testKey,
      standardScore: testData.standardScore,
      audience
    })
    
    allMatches.push(...matches)
  }
  
  // Retrieve composite comparisons if we have RLI and ELI
  const rliTest = latestAssessment.tests.RLI
  const eliTest = latestAssessment.tests.ELI
  
  if (rliTest?.standardScore && eliTest?.standardScore) {
    const receptiveZ = calculateZScore(rliTest.standardScore)
    const expressiveZ = calculateZScore(eliTest.standardScore)
    
    const comparisons = retrieveCompositeComparisons({
      receptiveZScore: receptiveZ,
      expressiveZScore: expressiveZ,
      audience
    })
    
    allMatches.push(...comparisons)
  }
  
  return allMatches
}
