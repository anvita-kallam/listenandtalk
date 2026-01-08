/**
 * Score calculation utilities for CELF-P3 assessments
 * 
 * Computes z-scores, normative bands, and other derived metrics
 * from raw assessment scores.
 */

/**
 * CELF-P3 normative parameters
 */
export const NORMATIVE_PARAMS = {
  standard: { mean: 100, sd: 15 },
  scaled: { mean: 10, sd: 3 }
}

/**
 * Calculate z-score from a standard score
 * @param {number} score - Standard score
 * @param {string} type - 'standard' or 'scaled' (default: 'standard')
 * @returns {number|null} - Z-score, or null if score is invalid
 */
export function calculateZScore(score, type = 'standard') {
  if (score === null || score === undefined || isNaN(score)) {
    return null
  }
  
  const params = NORMATIVE_PARAMS[type] || NORMATIVE_PARAMS.standard
  return (score - params.mean) / params.sd
}

/**
 * Determine normative band from z-score
 * @param {number} zScore - Z-score
 * @returns {string} - Normative band label
 */
export function getNormativeBand(zScore) {
  if (zScore === null || zScore === undefined || isNaN(zScore)) {
    return 'No Data'
  }
  
  if (zScore <= -2) {
    return 'Significantly Below Average'
  } else if (zScore <= -1) {
    return 'Below Average'
  } else if (zScore <= 1) {
    return 'Average'
  } else if (zScore <= 2) {
    return 'Above Average'
  } else {
    return 'Significantly Above Average'
  }
}

/**
 * Get simplified normative band (for matching with knowledge base)
 * @param {number} zScore - Z-score
 * @returns {string} - Simplified band: 'below', 'average', or 'above'
 */
export function getSimplifiedBand(zScore) {
  if (zScore === null || zScore === undefined || isNaN(zScore)) {
    return null
  }
  
  if (zScore < -1) {
    return 'below'
  } else if (zScore <= 1) {
    return 'average'
  } else {
    return 'above'
  }
}

/**
 * Calculate percentile from z-score
 * @param {number} zScore - Z-score
 * @returns {number|null} - Percentile rank
 */
export function zScoreToPercentile(zScore) {
  if (zScore === null || zScore === undefined || isNaN(zScore)) {
    return null
  }
  
  // Using error function approximation
  const percentile = 0.5 * (1 + erf(zScore / Math.sqrt(2))) * 100
  return Math.round(percentile * 10) / 10
}

/**
 * Error function approximation (Abramowitz and Stegun)
 */
function erf(x) {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const sign = x < 0 ? -1 : 1
  x = Math.abs(x)

  const t = 1.0 / (1.0 + p * x)
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

  return sign * y
}
