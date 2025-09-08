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
      
      // Handle PDF files using pdfjs-dist library
      if (mimeType === 'application/pdf') {
        logger.info('Extracting text from PDF using pdfjs-dist', { filePath, mimeType });
        
        try {
          // Dynamic import to avoid initialization issues
          const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
          
          // Read the PDF file
          const data = new Uint8Array(await fs.readFile(filePath));
          
          // Load the PDF document
          const loadingTask = pdfjsLib.getDocument({ data });
          const pdfDoc = await loadingTask.promise;
          
          let fullText = '';
          const numPages = pdfDoc.numPages;
          
          // Extract text from each page
          for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ');
            fullText += pageText + '\n\n';
          }
          
          logger.info('PDF text extraction completed', {
            filePath,
            pages: numPages,
            textLength: fullText.length
          });
          
          return fullText.trim();
        } catch (pdfError) {
          logger.error('PDF parsing failed', { filePath, error: pdfError });
          // Fallback to a simple message if PDF parsing fails
          return `[PDF Document]\n\nUnable to extract text from this PDF file. The file may be corrupted or contain only images.\n\nFile: ${filePath}`;
        }
      }
      
      // For images and other supported documents, use GPT-4 Vision
      if (!mimeType.startsWith('image/')) {
        logger.warn('Unsupported file type for GPT-4 Vision', { filePath, mimeType });
        throw new Error(`Unsupported file type: ${mimeType}. Only text and image files are supported.`);
      }
      
      logger.info('Extracting text from image using GPT-4 Vision', { filePath, mimeType });
      
      const fileContent = await fs.readFile(filePath);
      const base64 = fileContent.toString('base64');
      
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o', // Updated to current vision model
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text content from this image. Include tables, headers, paragraphs, and all readable text. Preserve the structure and formatting where possible. Return only the extracted text content.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64}`
              }
            }
          ]
        }],
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
   * Semantic chunking using GPT with batch processing for large documents
   */
  async chunk(text: string, filename: string): Promise<ChunkingResult> {
    try {
      const documentType = this.detectDocumentType(filename);
      
      logger.info('Starting chunking', {
        filename,
        documentType,
        textLength: text.length
      });

      let textParts: string[];
      
      // Determine how to split the document
      if (text.length > 50000) {
        // For very large documents, split by word limit
        logger.info('Large document detected, splitting by word limit', { textLength: text.length });
        const wordLimit = 6000;
        textParts = this.splitDocumentByWordLimit(text, wordLimit);
      } else {
        // For smaller documents, use as single part or split if needed
        const maxTextLength = 30000;
        if (text.length > maxTextLength) {
          textParts = [
            text.substring(0, maxTextLength) + '\n\n[Note: This is a large document. Additional content follows similar patterns.]',
            text.substring(maxTextLength)
          ];
        } else {
          textParts = [text];
        }
      }
      
      logger.info('Document split into parts', { partCount: textParts.length });
      
      // Process all parts in parallel using Promise.all
      const partPromises = textParts.map(async (part, index) => {
        const partName = textParts.length > 1 ? `${filename}-part${index + 1}` : filename;
        
        try {
          return await this.chunkTextWithOpenAI(part, documentType, partName);
        } catch (error) {
          logger.error(`Processing failed for ${partName}, using fallback`, { error });
          return this.fallbackChunking(part);
        }
      });
      
      // Wait for all parts to complete
      const allPartChunks = await Promise.all(partPromises);
      const allChunks = allPartChunks.flat();
      
      logger.info('Chunking completed', { 
        totalChunks: allChunks.length,
        averageChunkSize: Math.round(text.length / allChunks.length)
      });
      
      return {
        chunks: allChunks,
        metadata: {
          chunkCount: allChunks.length,
          averageChunkSize: Math.round(text.length / allChunks.length),
          documentType
        }
      };
    } catch (error) {
      logger.error('Chunking failed, using fallback', { filename, error });
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
   * Chunk a single text using OpenAI
   */
  private async chunkTextWithOpenAI(text: string, documentType: string, partName: string): Promise<string[]> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: `You are an expert at chunking documents semantically. Create chunks that:
1. Preserve semantic meaning and context
2. Keep related information together
3. Target 500-1000 tokens per chunk for optimal embedding
4. Maintain natural boundaries (paragraphs, topics)
5. Include context clues at chunk boundaries

Return as JSON with structure: {"chunks": ["chunk1", "chunk2", ...]}`
        },
        {
          role: 'user',
          content: `Document Type: ${documentType}
${partName.includes('part') ? `Part: ${partName}` : ''}

Please chunk this document intelligently:

${text}

Return chunks as a JSON array.`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    });
    
    const result = JSON.parse(response.choices[0].message.content || '{"chunks":[]}');
    return result.chunks || this.fallbackChunking(text);
  }

  /**
   * Split document by word limit for batch processing
   */
  private splitDocumentByWordLimit(text: string, wordLimit: number): string[] {
    const parts: string[] = [];
    const words = text.split(/\s+/);
    let currentPart: string[] = [];
    let currentWordCount = 0;
    
    for (const word of words) {
      // If adding this word would exceed the limit and we have content, save current part
      if (currentWordCount + 1 > wordLimit && currentPart.length > 0) {
        parts.push(currentPart.join(' '));
        currentPart = [word];
        currentWordCount = 1;
      } else {
        currentPart.push(word);
        currentWordCount++;
      }
    }
    
    // Add the last part if it has content
    if (currentPart.length > 0) {
      parts.push(currentPart.join(' '));
    }
    
    logger.info('Document split by word limit', {
      totalWords: words.length,
      wordLimit,
      partsCreated: parts.length,
      averageWordsPerPart: Math.round(words.length / parts.length)
    });
    
    return parts;
  }

  
  /**
   * Generate a summary for document chunks
   */
  async generateSummary(chunks: string[]): Promise<string> {
    try {
      logger.info('Generating summary', { chunkCount: chunks.length });
      
      // For documents with many chunks, use a smarter sampling strategy
      let selectedChunks: string[];
      
      if (chunks.length <= 5) {
        // Use all chunks for small documents
        selectedChunks = chunks;
      } else if (chunks.length <= 15) {
        // For medium documents, use first, middle, and last chunks
        const firstChunk = chunks[0];
        const middleChunk = chunks[Math.floor(chunks.length / 2)];
        const lastChunk = chunks[chunks.length - 1];
        selectedChunks = [firstChunk, middleChunk, lastChunk];
      } else {
        // For large documents, sample more strategically
        const step = Math.floor(chunks.length / 6);
        selectedChunks = [
          chunks[0], // Introduction/first chapter
          chunks[step], 
          chunks[step * 2],
          chunks[step * 3],
          chunks[step * 4],
          chunks[chunks.length - 1] // Conclusion/last chapter
        ];
      }
      
      const combinedText = selectedChunks.join('\n\n---\n\n');
      
      const prompt = `Please provide a comprehensive summary of this document. The content represents key sections from throughout the document. Focus on:

1. Main topics and themes
2. Key points and important information  
3. Overall structure and flow
4. Any conclusions or key takeaways

Keep the summary informative but concise (3-5 sentences).

Document content:
${combinedText}`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that creates comprehensive, informative summaries of documents. You understand that the content may be sampled from different sections of a larger document.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300, // Increased for better summaries
        temperature: 0.3,
      });

      const summary = response.choices[0]?.message?.content || 'Unable to generate summary.';
      logger.info('Summary generated successfully', { 
        chunkCount: chunks.length, 
        selectedChunks: selectedChunks.length,
        summaryLength: summary.length 
      });
      
      return summary;
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