// Using node-fetch for Meta Llama API calls (avoiding OpenAI SDK undici timeout issues)
import nodeFetch from 'node-fetch';
import { detectPracticeMode } from '@/lib/practice-mode';

// Note: Using node-fetch directly instead of OpenAI SDK to avoid undici timeout issues
// Note: Using ZeroDB's embedding API instead of loading transformers locally (to avoid Netlify timeout)

const ZERODB_API_URL = process.env.ZERODB_API_URL!;
const ZERODB_PROJECT_ID = process.env.ZERODB_PROJECT_ID!;
const ZERODB_API_KEY = process.env.ZERODB_API_KEY!;
const ZERODB_NAMESPACE = process.env.ZERODB_NAMESPACE || 'nvc_knowledge_base';
const ZERODB_TOP_K = parseInt(process.env.ZERODB_TOP_K || '5');
const ZERODB_SIMILARITY_THRESHOLD = parseFloat(process.env.ZERODB_SIMILARITY_THRESHOLD || '0.7');

// Removed generateEmbedding function - using semantic search directly instead

export async function POST(req: Request) {
  try {
    const {messages, useRag, llm, similarityMetric} = await req.json();

    const latestMessage = messages[messages?.length - 1]?.content;

    // Detect if user is requesting practice mode
    const practiceMode = detectPracticeMode(latestMessage || '');

    let docContext = '';
    let sources: string[] = [];
    if (useRag) {
      console.log('🔍 Searching ZeroDB knowledge base with semantic search...');
      // Use semantic search endpoint (handles embedding generation automatically)
      const searchResponse = await nodeFetch(`${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': ZERODB_API_KEY,
        },
        body: JSON.stringify({
          query: latestMessage,
          limit: ZERODB_TOP_K,  // Correct parameter name per API docs
          threshold: ZERODB_SIMILARITY_THRESHOLD,  // Correct parameter name per API docs
          namespace: ZERODB_NAMESPACE,
          model: 'BAAI/bge-small-en-v1.5'  // Specify model explicitly
        })
      });

      if (!searchResponse.ok) {
        const error = await searchResponse.text();
        console.error(`❌ ZeroDB search failed: ${searchResponse.status} - ${error}`);
        // NO GRACEFUL DEGRADATION - Return error to user
        return new Response(
          JSON.stringify({
            error: 'NVC knowledge base temporarily unavailable. Please try again in a moment.'
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      const searchResults = await searchResponse.json();
      const documents = searchResults.results || searchResults.vectors || [];
      console.log(`✅ Found ${documents.length} relevant documents`);

      // Debug: log first document structure
      if (documents.length > 0) {
        console.log('Sample document structure:', JSON.stringify(documents[0], null, 2).substring(0, 500));
      }

      if (documents.length === 0) {
        // NO GRACEFUL DEGRADATION - If no documents found, inform user
        return new Response(
          "I couldn't find specific NVC content related to your question in my knowledge base. I can help with topics like the four components of NVC (Observations, Feelings, Needs, Requests), feelings and needs vocabulary, empathy practice, and conflict resolution. Could you try rephrasing your question or ask about a specific aspect of Nonviolent Communication?",
          {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
          }
        );
      }

      // Extract sources - show top 3-5 most relevant
      sources = documents.slice(0, 5).map((doc: any, idx: number) => {
        // Try to get title from metadata first
        const metadataTitle = doc.vector_metadata?.title || doc.vector_metadata?.source || doc.vector_metadata?.name;
        if (metadataTitle) return metadataTitle;

        const text = doc.document || '';  // API returns 'document' field
        const lines = text.split('\n').filter((l: string) => l.trim().length > 0);

        // Find the first meaningful line (skip separators and very short lines)
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.length > 15 && trimmed !== '---' && !trimmed.startsWith('http')) {
            return trimmed.length > 50 ? trimmed.substring(0, 50) + '...' : trimmed;
          }
        }

        return `Source ${idx + 1}`;
      });

      docContext = `
        START CONTEXT
        ${documents.map((doc: any) => doc.document || '').join("\n\n---\n\n")}
        END CONTEXT
      `;
    }

    // Build practice mode instructions if detected
    let practiceModeInstructions = '';
    if (practiceMode.isPracticeMode) {
      const componentFocus = practiceMode.focusComponent
        ? `Focus specifically on the "${practiceMode.focusComponent}" component of NVC.`
        : 'Cover all OFNR components as needed.';

      const difficultyLevel = practiceMode.difficulty
        ? `Adjust complexity for ${practiceMode.difficulty} level learners.`
        : 'Gauge the user\'s level and adapt accordingly.';

      const conversationStyle = practiceMode.conversationMode === 'multi'
        ? 'Guide the user step-by-step through the practice, asking questions and providing feedback at each stage.'
        : 'Provide a complete practice scenario with guidance in a single response.';

      if (practiceMode.mode === 'translate') {
        practiceModeInstructions = `
        PRACTICE MODE ACTIVE: Translation Exercise
        The user wants to translate a statement into NVC. ${componentFocus} ${difficultyLevel}
        ${conversationStyle}

        TRANSLATION EXERCISE FORMAT:
        1. Acknowledge the original statement
        2. Identify the evaluations, judgments, or demands present
        3. Guide the transformation using OFNR:
           - Observation: What would a camera record?
           - Feeling: What emotion is present?
           - Need: What universal need is unmet?
           - Request: What specific, doable action would help?
        4. Provide the complete NVC translation
        5. Explain the key learning from this exercise
        `;
      } else {
        practiceModeInstructions = `
        PRACTICE MODE ACTIVE: Interactive Practice
        The user wants to practice NVC skills. ${componentFocus} ${difficultyLevel}
        ${conversationStyle}

        PRACTICE SESSION FORMAT:
        1. Present a realistic scenario appropriate to the difficulty level
        2. Ask the user to try applying NVC
        3. Provide constructive feedback on their attempt
        4. Offer model answers and alternatives
        5. Highlight key learnings

        Use scenarios from the knowledge base context when available.
        `;
      }
    }

    const ragPrompt = [
      {
        role: 'system',
        content: `You are an NVC Practice Companion, trained in Marshall Rosenberg's Nonviolent Communication framework. You help users understand, practice, and apply NVC in their daily lives. Format responses using markdown where applicable.

        CRITICAL INSTRUCTION: Base your responses on the NVC knowledge provided in the context below. Your guidance should align with NVC principles.

        ${docContext}
        ${practiceModeInstructions}

        YOUR CORE CAPABILITIES:
        1. Explain NVC concepts (Observations, Feelings, Needs, Requests)
        2. Help translate "jackal" language into "giraffe" language
        3. Provide feelings and needs vocabulary
        4. Guide users through practice scenarios
        5. Model empathic listening and reflection
        6. Support conflict resolution using NVC principles

        GUIDELINES FOR RESPONSES:
        - Use the NVC knowledge base context to inform your responses
        - When users share situations, first offer empathy before giving advice
        - Help users distinguish observations from evaluations
        - Help users identify true feelings (not thoughts disguised as feelings)
        - Connect feelings to underlying universal human needs
        - Encourage requests over demands
        - Use a warm, compassionate, non-judgmental tone
        - Format responses with markdown for clarity
        - When appropriate, offer practice exercises or reflections

        EMPATHY FIRST PRINCIPLE:
        When someone shares a difficult situation, prioritize empathic reflection:
        - "It sounds like you're feeling [feeling] because you need [need]..."
        - "Are you experiencing [feeling] right now?"
        - Validate before advising

        NVC TRANSLATION HELP:
        When asked to translate statements, use the OFNR format:
        - Observation: What specifically happened (camera-like)
        - Feeling: The emotion experienced
        - Need: The universal human need connected to the feeling
        - Request: A specific, doable, positive action

        Remember: Everyone's feelings and needs are valid. There are no "wrong" feelings or needs - only more or less effective strategies for meeting needs.
      `,
      },
    ]

    // Clean messages - only keep role and content, remove any extra properties
    const cleanMessages = [...ragPrompt, ...messages].map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    console.log('Sending to Meta Llama:', JSON.stringify({
      model: llm ?? process.env.META_MODEL,
      messageCount: cleanMessages.length,
      messages: cleanMessages
    }, null, 2));

    // Use node-fetch with AbortController for reliable timeout handling
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const apiResponse = await nodeFetch(`${process.env.META_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.META_API_KEY}`,
      },
      body: JSON.stringify({
        model: llm ?? process.env.META_MODEL ?? 'Llama-4-Maverick-17B-128E-Instruct-FP8',
        messages: cleanMessages,
        max_tokens: 1000,
      }),
      signal: controller.signal as any,
    });

    clearTimeout(timeout);

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      throw new Error(`Meta Llama API error: ${apiResponse.status} - ${errorText}`);
    }

    const data = await apiResponse.json();
    let content = data.choices[0]?.message?.content || '';

    // Append sources if RAG was used - using special delimiter for frontend parsing
    if (useRag && sources.length > 0) {
      const uniqueSources = Array.from(new Set(sources)); // Remove duplicates
      console.log('Unique sources:', uniqueSources);

      if (uniqueSources.length > 0) {
        // Add sources as JSON after a special delimiter
        content += `\n\n___SOURCES___\n${JSON.stringify(uniqueSources.slice(0, 5))}`;
      }
    }

    return new Response(content, {
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (e: any) {
    console.error('API Error:', e);
    return new Response(
      JSON.stringify({
        error: e.message || 'Internal server error',
        details: e.toString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
