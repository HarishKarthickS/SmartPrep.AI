let embeddingPipeline: any = null;

export const getEmbeddingPipeline = async () => {
  if (!embeddingPipeline) {
    // Ensure process.env is an object to prevent "Cannot convert undefined or null to object" in transformers.js
    if (typeof window !== 'undefined') {
      (window as any).process = (window as any).process || {};
      (window as any).process.env = (window as any).process.env || {};
    }

    // Dynamic import to avoid SSR/Turbopack issues during module evaluation
    const { pipeline, env } = await import('@huggingface/transformers');
    
    // Configure environment
    env.allowLocalModels = false;
    env.useBrowserCache = true;
    
    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embeddingPipeline;
};

export const generateEmbedding = async (text: string): Promise<number[]> => {
  const generate = await getEmbeddingPipeline();
  const output = await generate(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
};

export const chunkText = (text: string, chunkSize: number = 500, overlap: number = 50): string[] => {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
    if (i + chunkSize >= words.length) break;
  }
  
  return chunks;
};

export const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  let dotProduct = 0;
  let mA = 0;
  let mB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    mA += vecA[i] * vecA[i];
    mB += vecB[i] * vecB[i];
  }
  mA = Math.sqrt(mA);
  mB = Math.sqrt(mB);
  return dotProduct / (mA * mB);
};

export const searchLibraryChunks = async (query: string, libraryItemIds: string[], topK: number = 5) => {
  const queryEmbedding = await generateEmbedding(query);
  const { db } = await import('../db/dexie');
  
  // Get all chunks for the specified library items
  const allChunks = await db.documentChunks
    .where('libraryItemId')
    .anyOf(libraryItemIds)
    .toArray();

  if (allChunks.length === 0) return [];

  // Calculate similarity and sort
  const scoredChunks = allChunks.map(chunk => ({
    ...chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding)
  }));

  return scoredChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
};
