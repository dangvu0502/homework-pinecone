import OpenAI from 'openai';
import { logger } from '../utils/logger.ts';

export class EmbeddingService {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required when initializing EmbeddingService');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      logger.info('Generating embedding', { textLength: text.length });

      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.trim(),
      });

      const embedding = response.data[0]?.embedding;
      
      if (!embedding) {
        throw new Error('No embedding received from OpenAI');
      }
      
      logger.info('Embedding generated successfully', {
        dimensions: embedding.length,
        tokens: response.usage?.total_tokens
      });

      return embedding;

    } catch (error: any) {
      logger.error('Embedding generation failed', {
        error: error.message,
        textLength: text.length
      });

      // Handle rate limiting
      if (error.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Please try again later.');
      }

      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const text of texts) {
      try {
        const embedding = await this.generateEmbedding(text);
        embeddings.push(embedding);
        
        // Simple rate limiting for MVP
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        logger.error('Failed to generate embedding for chunk', { error });
        throw error;
      }
    }

    return embeddings;
  }
}