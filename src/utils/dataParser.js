/**
 * Data parsing utilities for CELF-P3 CSV data
 * 
 * CELF-P3 normative assumptions:
 * - Standard scores: Mean = 100, SD = 15
 * - Scaled scores: Mean = 10, SD = 3
 */

// Test name mappings from CSV column prefixes to display names
export const TEST_NAMES = {
  SC: 'Sentence Comprehension',
  WS: 'Word Structure',
  EV: 'Expressive Vocabulary',
  FD: 'Formulated Sentences',
  RS: 'Recalling Sentences',
  BC: 'Basic Concepts',
  WC: 'Word Classes',
  PA: 'Phonological Awareness',
  DPP: 'Following Directions',
  PRS: 'Understanding Spoken Paragraphs',
  CLS: 'Core Language Score',
  RLI: 'Receptive Language Index',
  ELI: 'Expressive Language Index',
  LCI: 'Language Content Index',
  LSI: 'Language Structure Index',
  ALRI: 'Academic Language Readiness Index',
  ErLi: 'Early Literacy Index'
}

/**
 * Parse a date string (handles various formats)
 */
function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null
  
  // Try different date formats
  const formats = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // M/D/YYYY
    /(\d{4})-(\d{1,2})-(\d{1,2})/,   // YYYY-MM-DD
  ]
  
  for (const format of formats) {
    const match = dateStr.match(format)
    if (match) {
      if (format === formats[0]) {
        // M/D/YYYY
        const [, month, day, year] = match
        return new Date(year, month - 1, day)
      } else {
        // YYYY-MM-DD
        const [, year, month, day] = match
        return new Date(year, month - 1, day)
      }
    }
  }
  
  return null
}

/**
 * Parse a number, handling empty strings and invalid values
 */
function parseNumber(value) {
  if (!value || value === '' || value === '#N/A' || value === '-1') {
    return null
  }
  const num = parseFloat(value)
  return isNaN(num) ? null : num
}

/**
 * Extract test data from a CSV row
 */
function extractTestData(row, prefix) {
  const standardScore = parseNumber(row[`${prefix}_StandardScore`])
  const scaledScore = parseNumber(row[`${prefix}_ScaledScore`])
  const percentile = parseNumber(row[`${prefix}_PctRank`])
  const rawScore = parseNumber(row[`${prefix}_RawScore`])
  
  // Only include if we have at least a standard score or scaled score
  if (standardScore === null && scaledScore === null) {
    return null
  }
  
  return {
    standardScore: standardScore,
    scaledScore: scaledScore,
    percentile: percentile,
    rawScore: rawScore,
    testName: TEST_NAMES[prefix] || prefix
  }
}

/**
 * Process raw CSV data into structured format
 */
export function processCSVData(rawData) {
  const processed = []
  
  for (const row of rawData) {
    // Skip empty rows
    if (!row.LT_Id || row.LT_Id.trim() === '' || row.LT_Id === '#N/A') {
      continue
    }
    
    const studentId = row.LT_Id.trim()
    const studentName = row.Child_Initials?.trim() || `Student ${studentId}`
    const date = parseDate(row.AssessmentDate)
    const age = parseNumber(row.Age)
    
    // Extract all test data
    const tests = {}
    const testPrefixes = Object.keys(TEST_NAMES)
    
    for (const prefix of testPrefixes) {
      const testData = extractTestData(row, prefix)
      if (testData) {
        tests[prefix] = testData
      }
    }
    
    // Only add if we have at least one test score
    if (Object.keys(tests).length > 0) {
      processed.push({
        studentId,
        studentName,
        date: date || new Date(),
        age: age,
        tests
      })
    }
  }
  
  return processed
}

/**
 * Get unique students from processed data
 */
export function getUniqueStudents(data) {
  const studentMap = new Map()
  
  for (const record of data) {
    if (!studentMap.has(record.studentId)) {
      studentMap.set(record.studentId, {
        id: record.studentId,
        name: record.studentName
      })
    }
  }
  
  return Array.from(studentMap.values()).sort((a, b) => 
    a.name.localeCompare(b.name)
  )
}

/**
 * Get normative distribution parameters for a test
 */
export function getNormativeParams(testType = 'standard') {
  if (testType === 'scaled') {
    return { mean: 10, sd: 3 }
  }
  // Default: standard scores
  return { mean: 100, sd: 15 }
}

/**
 * Calculate percentile from standard score
 */
export function scoreToPercentile(score, mean = 100, sd = 15) {
  if (score === null || score === undefined) return null
  
  // Z-score
  const z = (score - mean) / sd
  
  // Approximate percentile using error function
  // Using a simplified approximation
  const percentile = 0.5 * (1 + erf(z / Math.sqrt(2))) * 100
  
  return Math.round(percentile * 10) / 10
}

/**
 * Error function approximation
 */
function erf(x) {
  // Abramowitz and Stegun approximation
  const a1 =  0.254829592
  const a2 = -0.284496736
  const a3 =  1.421413741
  const a4 = -1.453152027
  const a5 =  1.061405429
  const p  =  0.3275911

  const sign = x < 0 ? -1 : 1
  x = Math.abs(x)

  const t = 1.0 / (1.0 + p * x)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

  return sign * y
}

/**
 * Get interpretation label for a score
 */
export function getScoreInterpretation(score, mean = 100, sd = 15) {
  if (score === null || score === undefined) return 'No Data'
  
  const z = (score - mean) / sd
  
  if (z <= -2) return 'Significantly Below Average'
  if (z <= -1) return 'Below Average'
  if (z <= 1) return 'Average'
  if (z <= 2) return 'Above Average'
  return 'Significantly Above Average'
}
