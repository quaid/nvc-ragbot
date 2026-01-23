import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import 'dotenv/config'

// NVC Content Files
import nvcData from './nvc_data.json';
import nvcFeelings from './nvc_feelings.json';
import nvcNeeds from './nvc_needs.json';
import nvcScenarios from './nvc_scenarios.json';

import { SimilarityMetric } from "../app/hooks/useConfiguration";

const ZERODB_API_URL = process.env.ZERODB_API_URL!;
const ZERODB_PROJECT_ID = process.env.ZERODB_PROJECT_ID!;
const ZERODB_EMAIL = process.env.ZERODB_EMAIL!;
const ZERODB_PASSWORD = process.env.ZERODB_PASSWORD!;

// NVC namespace - configurable via env
const NVC_NAMESPACE = process.env.ZERODB_NAMESPACE || 'nvc_knowledge_base';

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

const similarityMetrics: SimilarityMetric[] = [
  'cosine',
];

// NVC content types for loading
interface NVCContent {
  url: string;
  title: string;
  content: string;
  content_type?: string;
  category?: string;
  difficulty?: string;
  feeling_family?: string;
  needs_met?: boolean;
  mode?: string;
  focus_component?: string;
}

// Get JWT token from ZeroDB
async function getAuthToken(): Promise<string> {
  const response = await fetch(`${ZERODB_API_URL}/v1/public/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `username=${encodeURIComponent(ZERODB_EMAIL)}&password=${encodeURIComponent(ZERODB_PASSWORD)}`
  });

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

const loadNVCContent = async (
  contentArray: NVCContent[],
  contentLabel: string,
  similarity_metric: SimilarityMetric = 'cosine'
) => {
  console.log(`\n📚 Loading ${contentLabel}...`);

  const texts: string[] = [];
  const metadata_list: any[] = [];

  for (const item of contentArray) {
    const chunks = await splitter.splitText(item.content);
    let i = 0;

    for (const chunk of chunks) {
      texts.push(chunk);
      metadata_list.push({
        document_id: `${item.url}-${i}`,
        url: item.url,
        title: item.title,
        content_type: item.content_type || 'general',
        category: item.category || 'general',
        difficulty: item.difficulty || 'beginner',
        feeling_family: item.feeling_family,
        needs_met: item.needs_met,
        mode: item.mode,
        focus_component: item.focus_component,
        similarity_metric,
      });
      i++;
    }
  }

  // Get JWT token
  console.log('  Authenticating with ZeroDB...');
  const token = await getAuthToken();

  // Use ZeroDB's embed-and-store endpoint
  console.log(`  Embedding and storing ${texts.length} chunks from ${contentArray.length} documents...`);

  const response = await fetch(`${ZERODB_API_URL}/v1/public/${ZERODB_PROJECT_ID}/embeddings/embed-and-store`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      texts,
      metadata_list,
      namespace: NVC_NAMESPACE,
      model: "BAAI/bge-small-en-v1.5",
      project_id: ZERODB_PROJECT_ID,
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ZeroDB embed-and-store failed: ${response.status} - ${error}`);
  }

  const result = await response.json();
  console.log(`  ✅ Success! Stored ${result.vectors_stored} vectors`);
  console.log(`     Model: ${result.model}, Dimensions: ${result.dimensions}`);
  console.log(`     Processing time: ${result.processing_time_ms}ms`);
};

// Main seeding function
(async () => {
  console.log('🌱 Starting NVC RAGbot Knowledge Base Population...\n');
  console.log(`   API: ${ZERODB_API_URL}`);
  console.log(`   Project ID: ${ZERODB_PROJECT_ID}`);
  console.log(`   Namespace: ${NVC_NAMESPACE}`);

  try {
    // Load all NVC content types
    await loadNVCContent(nvcData as NVCContent[], 'NVC Core Concepts & Principles');
    await loadNVCContent(nvcFeelings as NVCContent[], 'NVC Feelings Vocabulary');
    await loadNVCContent(nvcNeeds as NVCContent[], 'Universal Human Needs');
    await loadNVCContent(nvcScenarios as NVCContent[], 'Practice Scenarios');

    console.log('\n🎉 NVC Knowledge Base loaded successfully!\n');
    console.log('Content summary:');
    console.log(`  - Core concepts: ${nvcData.length} documents`);
    console.log(`  - Feelings: ${nvcFeelings.length} documents`);
    console.log(`  - Needs: ${nvcNeeds.length} documents`);
    console.log(`  - Scenarios: ${nvcScenarios.length} documents`);
    console.log(`\nTotal: ${nvcData.length + nvcFeelings.length + nvcNeeds.length + nvcScenarios.length} documents\n`);
  } catch (error) {
    console.error('❌ Error loading NVC content:', error);
    process.exit(1);
  }
})();
