import React, { useState, useMemo } from 'react'
import { retrieveAllInterpretations } from '../retrievalEngine/retrievalEngine'
import { assembleCompleteReport } from '../insightAssembler/insightAssembler'
import './ClinicalInsightAssistant.css'

/**
 * Clinical Insight Assistant (RAG Preview)
 * 
 * This component demonstrates a RAG-style system that:
 * 1. Retrieves relevant interpretation content from knowledge base
 * 2. Assembles insights based on student scores
 * 3. Displays grounded, explainable insights with citations
 * 
 * Future LLM Integration:
 * - Replace retrieval with semantic search (embeddings)
 * - Add LLM for natural language synthesis
 * - Implement conversational interface
 */
function ClinicalInsightAssistant({ student, assessments }) {
  const [audience, setAudience] = useState('clinician')
  const [selectedQuestion, setSelectedQuestion] = useState(null)

  // Preset questions for quick access
  const presetQuestions = [
    { id: 'overview', label: 'What stands out?', description: 'Key findings across all tests' },
    { id: 'receptive', label: 'Receptive Language', description: 'Understanding skills' },
    { id: 'expressive', label: 'Expressive Language', description: 'Speaking skills' },
    { id: 'comparison', label: 'Receptive vs Expressive', description: 'Compare understanding and speaking' }
  ]

  // Retrieve and assemble insights
  const report = useMemo(() => {
    if (!student || !assessments || assessments.length === 0) {
      return null
    }

    // Retrieve all matching interpretations
    const retrievedEntries = retrieveAllInterpretations({
      assessments,
      audience
    })

    // Assemble into structured report
    const assembledReport = assembleCompleteReport({
      student,
      assessments,
      allRetrievedEntries: retrievedEntries,
      audience
    })

    return assembledReport
  }, [student, assessments, audience])

  // Filter insights based on selected question
  const displayedInsights = useMemo(() => {
    if (!report) return null

    if (!selectedQuestion) {
      // Show overview - all insights
      return report
    }

    if (selectedQuestion === 'receptive') {
      return {
        ...report,
        testInsights: report.testInsights.filter(t => 
          t.testAbbreviation === 'RLI' || t.test.includes('Receptive')
        ),
        comparisons: []
      }
    }

    if (selectedQuestion === 'expressive') {
      return {
        ...report,
        testInsights: report.testInsights.filter(t => 
          t.testAbbreviation === 'ELI' || t.test.includes('Expressive')
        ),
        comparisons: []
      }
    }

    if (selectedQuestion === 'comparison') {
      return {
        ...report,
        testInsights: [],
        comparisons: report.comparisons
      }
    }

    return report
  }, [report, selectedQuestion])

  if (!student || !assessments || assessments.length === 0) {
    return (
      <div className="clinical-insight-assistant">
        <h3 className="assistant-title">Clinical Insight Assistant (Preview)</h3>
        <p className="no-data-message">No assessment data available for insights.</p>
      </div>
    )
  }

  return (
    <div className="clinical-insight-assistant">
      <div className="assistant-header">
        <h3 className="assistant-title">Clinical Insight Assistant (Preview)</h3>
      </div>

      {/* Audience selector */}
      <div className="audience-selector">
        <label className="audience-label">Audience:</label>
        <div className="audience-buttons">
          <button
            type="button"
            className={`audience-btn ${audience === 'clinician' ? 'active' : ''}`}
            onClick={() => setAudience('clinician')}
          >
            Clinician
          </button>
          <button
            type="button"
            className={`audience-btn ${audience === 'family' ? 'active' : ''}`}
            onClick={() => setAudience('family')}
          >
            Family
          </button>
        </div>
      </div>

      {/* Preset questions */}
      <div className="preset-questions">
        <label className="questions-label">Quick Questions:</label>
        <div className="questions-grid">
          {presetQuestions.map(q => (
            <button
              key={q.id}
              type="button"
              className={`preset-question ${selectedQuestion === q.id ? 'active' : ''}`}
              onClick={() => setSelectedQuestion(selectedQuestion === q.id ? null : q.id)}
            >
              <span className="question-label">{q.label}</span>
              <span className="question-desc">{q.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Display insights */}
      {displayedInsights && (
        <div className="insights-display">
          {displayedInsights.testInsights.length === 0 && 
           displayedInsights.comparisons.length === 0 ? (
            <div className="no-insights">
              <p>No matching interpretations found for selected criteria.</p>
              <p className="hint">Try selecting a different question or audience.</p>
            </div>
          ) : (
            <>
              {/* Test-specific insights */}
              {displayedInsights.testInsights.map((testInsight, idx) => (
                <div key={idx} className="insight-section">
                  <div className="insight-section-header">
                    <h4 className="insight-test-name">{testInsight.test}</h4>
                    <div className="insight-meta">
                      <span className="insight-score">Score: {testInsight.score}</span>
                      <span className={`insight-band insight-band-${testInsight.normativeBand.toLowerCase().replace(/\s+/g, '-')}`}>{testInsight.normativeBand}</span>
                    </div>
                  </div>
                  
                  {testInsight.insights.map((insight, i) => (
                    <div key={i} className="insight-card">
                      <h5 className="insight-title">{insight.title}</h5>
                      <p className="insight-summary">{insight.summary}</p>
                      {insight.details && (
                        <p className="insight-details">{insight.details}</p>
                      )}
                      
                      {insight.recommendations && insight.recommendations.length > 0 && (
                        <div className="insight-recommendations">
                          <strong>Recommendations:</strong>
                          <ul>
                            {insight.recommendations.map((rec, j) => (
                              <li key={j}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="insight-source">
                        <span className="source-label">Source:</span>
                        <span className="source-text">{insight.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* Composite comparisons */}
              {displayedInsights.comparisons.map((comparison, idx) => (
                <div key={idx} className="insight-section comparison-section">
                  <div className="insight-section-header">
                    <h4 className="insight-test-name">Receptive vs Expressive Language</h4>
                    <div className="insight-meta">
                      <span>RLI: {comparison.receptiveScore} | ELI: {comparison.expressiveScore}</span>
                      {comparison.zDifference && (
                        <span>Difference: {comparison.zDifference} SD</span>
                      )}
                    </div>
                  </div>
                  
                  {comparison.insights.map((insight, i) => (
                    <div key={i} className="insight-card">
                      <h5 className="insight-title">{insight.title}</h5>
                      <p className="insight-summary">{insight.summary}</p>
                      {insight.details && (
                        <p className="insight-details">{insight.details}</p>
                      )}
                      
                      {insight.recommendations && insight.recommendations.length > 0 && (
                        <div className="insight-recommendations">
                          <strong>Recommendations:</strong>
                          <ul>
                            {insight.recommendations.map((rec, j) => (
                              <li key={j}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="insight-source">
                        <span className="source-label">Source:</span>
                        <span className="source-text">{insight.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {/* Retrieval metadata */}
              <div className="retrieval-metadata">
                <p className="metadata-text">
                  Retrieved {displayedInsights.totalRetrieved} interpretation{displayedInsights.totalRetrieved !== 1 ? 's' : ''} from knowledge base
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default ClinicalInsightAssistant
