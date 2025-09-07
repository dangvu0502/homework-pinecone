import OpenAI from 'openai';
import fs from 'fs/promises';
import { logger } from '../utils/logger.ts';

export interface ChunkingResult {
  chunks: string[];
  metadata?: {
    chunkCount: number;
    averageChunkSize: number;
    documentType: string;
  };
}

export class OpenAIService {
  private client: OpenAI;
  
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is required');
    }
    
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  
  /**
   * Extract text from any file using appropriate method
   * For text files, read directly. For images/PDFs, use GPT-4 Vision
   */
  async extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
    try {
      // For plain text files, just read the content directly
      if (mimeType === 'text/plain' || mimeType === 'text/csv') {
        logger.info('Reading text file directly', { filePath, mimeType });
        const textContent = await fs.readFile(filePath, 'utf-8');
        
        logger.info('Text extraction completed', {
          filePath,
          textLength: textContent.length
        });
        
        return textContent;
      }
      
      // For images and other documents, use GPT-4 Vision
      logger.info('Extracting text from file using GPT-4 Vision', { filePath, mimeType });
      
      const fileContent = await fs.readFile(filePath);
      const base64 = fileContent.toString('base64');
      
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o', // Updated to current vision model
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text content from this document. Include tables, headers, paragraphs, and all readable text. Preserve the structure and formatting where possible. Return only the extracted text content.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64}`
              }
            }
          ]
        }],
        max_tokens: 4096
      });
      
      const extractedText = response.choices[0].message.content || '';
      
      logger.info('Text extraction completed', {
        filePath,
        textLength: extractedText.length
      });
      
      return extractedText;
    } catch (error) {
      logger.error('Text extraction failed', { filePath, error });
      throw new Error(`Failed to extract text from file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * 
   * Intelligent semantic chunking using GPT
   */
  async intelligentChunk(text: string, filename: string): Promise<ChunkingResult> {
    try {
      const documentType = this.detectDocumentType(filename);
      
      logger.info('Starting intelligent chunking', {
        filename,
        documentType,
        textLength: text.length
      });
      
      const response = await this.client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert at chunking documents semantically. Create chunks that:
1. Preserve semantic meaning and context
2. Keep related information together
3. Target 500-1000 tokens per chunk for optimal embedding
4. Maintain natural boundaries (sections, paragraphs, topics)
5. Include context clues at chunk boundaries

Return as JSON with structure: {"chunks": ["chunk1", "chunk2", ...]}`
          },
          {
            role: 'user',
            content: `Document Type: ${documentType}
            
Please chunk this document intelligently:

${text.substring(0, 10000)}${text.length > 10000 ? '...[truncated]' : ''}

Return chunks as a JSON array.`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      });
      
      const result = JSON.parse(response.choices[0].message.content || '{"chunks":[]}');
      const chunks = result.chunks || this.fallbackChunking(text);
      
      logger.info('Intelligent chunking completed', {
        chunkCount: chunks.length,
        averageChunkSize: Math.round(text.length / chunks.length)
      });
      
      return {
        chunks,
        metadata: {
          chunkCount: chunks.length,
          averageChunkSize: Math.round(text.length / chunks.length),
          documentType
        }
      };
    } catch (error) {
      logger.error('Intelligent chunking failed, using fallback', { filename, error });
      return {
        chunks: this.fallbackChunking(text),
        metadata: {
          chunkCount: 0,
          averageChunkSize: 0,
          documentType: 'unknown'
        }
      };
    }
  }
  
  /**
   * Generate a summary for document chunks
   */
  async generateSummary(chunks: string[]): Promise<string> {
    try {
      const combinedText = chunks.slice(0, 5).join('\n\n'); // Use first 5 chunks for summary
      const prompt = `Please provide a concise summary of the following document content. Focus on the main topics, key points, and important information. Keep the summary between 2-4 sentences.

Document content:
${combinedText}

Summary:`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that creates concise, informative summaries of documents.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.3,
      });

      return response.choices[0]?.message?.content || 'Unable to generate summary.';
    } catch (error) {
      logger.error('Failed to generate summary', { error });
      return 'Summary generation failed. Please try again later.';
    }
  }
  
  /**
   * Stream answer generation
   */
  async* streamAnswer(query: string, context: string): AsyncGenerator<string> {
    try {
      const prompt = context
        ? `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer:`
        : `Question: ${query}\n\nAnswer:`;
      
      const stream = await this.client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        temperature: 0.7
      });
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      logger.error('Stream answer failed', { query, error });
      throw error;
    }
  }
  
  // Helper methods
  private detectDocumentType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    const typeMap: Record<string, string> = {
      'pdf': 'pdf',
      'docx': 'document',
      'doc': 'document',
      'xlsx': 'spreadsheet',
      'xls': 'spreadsheet',
      'csv': 'spreadsheet',
      'pptx': 'presentation',
      'ppt': 'presentation',
      'txt': 'text',
      'md': 'markdown',
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image'
    };
    
    return typeMap[ext || ''] || 'unknown';
  }
  
  private fallbackChunking(text: string): string[] {
    const chunkSize = 1000;
    const overlap = 200;
    const chunks: string[] = [];
    
    for (let i = 0; i < text.length; i += chunkSize - overlap) {
      chunks.push(text.substring(i, i + chunkSize));
    }
    
    return chunks;
  }
}