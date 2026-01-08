# RAG-Style Retrieval System (Mockup)

## Overview

This is a **deterministic mockup** of a Retrieval-Augmented Generation (RAG) system for CELF-P3 clinical interpretations. It demonstrates how a future RAG pipeline would work, but currently uses only pre-written JSON content—no LLM integration.

## Architecture

### 1. Knowledge Base (`knowledgeBase/celf_interpretations.json`)

Structured JSON entries containing:
- Test-specific interpretations
- Score range conditions (z-score thresholds)
- Audience-specific content (clinician vs. family)
- Source citations
- Recommendations

**Example Entry:**
```json
{
  "id": "receptive_below_avg",
  "test_type": "Receptive Language Index",
  "test_abbreviation": "RLI",
  "score_range": { "max_z": -1.0 },
  "audience": "clinician",
  "title": "Below Average Receptive Language",
  "summary": "...",
  "source": "CELF-P3 Technical Manual"
}
```

### 2. Retrieval Engine (`retrievalEngine/retrievalEngine.js`)

**Current Implementation:**
- Exact matching based on:
  - Test name/abbreviation
  - Z-score ranges
  - Audience type
- Returns all matching JSON entries

**Future LLM Integration:**
```javascript
// TODO: Replace exact matching with semantic search
// 1. Generate embeddings for student scores + context
// 2. Query vector database (e.g., Pinecone, Weaviate)
// 3. Retrieve top-k most similar entries
// 4. Rerank by relevance score
```

### 3. Insight Assembler (`insightAssembler/insightAssembler.js`)

**Current Implementation:**
- Combines retrieved entries into structured responses
- Groups by test type
- Formats for display

**Future LLM Integration:**
```javascript
// TODO: Add LLM synthesis
// 1. Pass retrieved entries as context to LLM
// 2. Prompt: "Synthesize these interpretations into a coherent summary"
// 3. Generate natural language response
// 4. Maintain citations from source entries
```

## How It Works

1. **Student data** → Calculate z-scores from standard scores
2. **Retrieval** → Match z-scores to knowledge base entries
3. **Assembly** → Combine matches into structured insights
4. **Display** → Show in UI with citations

## Deterministic Behavior

- ✅ Same input → Same output (no randomness)
- ✅ All text comes from JSON (no generation)
- ✅ Fully explainable (can trace why each insight was retrieved)
- ✅ Debuggable (can inspect retrieval matches)

## Future Enhancements

### Phase 1: Semantic Search
- Replace exact matching with embedding-based similarity
- Use sentence transformers (e.g., `all-MiniLM-L6-v2`)
- Implement vector database

### Phase 2: LLM Integration
- Add OpenAI/Anthropic API calls
- Generate natural language summaries
- Maintain source citations

### Phase 3: Conversational Interface
- Multi-turn conversations
- Context-aware follow-ups
- Personalized recommendations

## Testing

To test the system:
1. Select a student with assessment data
2. Choose audience (Clinician/Family)
3. Click preset questions
4. Verify retrieved insights match score ranges
5. Check source citations are displayed
