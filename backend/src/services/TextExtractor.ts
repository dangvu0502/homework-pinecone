import fs from 'fs/promises';
import { logger } from '../utils/logger.ts';
// import pdfParse from 'pdf-parse'; // Temporarily disabled due to library issues

// Simplified text extraction for MVP
export class TextExtractor {
  
  async extractText(filePath: string, contentType: string): Promise<string> {
    try {
      logger.info('Starting text extraction', { filePath, contentType });

      switch (contentType) {
        case 'text/plain':
        case 'text/csv':
          return await this.extractTextFile(filePath);
        
        case 'application/pdf':
          // Temporarily disable PDF processing due to library issues
          logger.warn('PDF processing temporarily disabled');
          return 'PDF processing temporarily disabled - please upload text files for now';
        
        case 'image/png':
        case 'image/jpeg':
          // For MVP, we'll skip OCR and return placeholder
          logger.warn('OCR not implemented in MVP', { contentType });
          return 'Image content - OCR processing not available in MVP version';
        
        default:
          logger.warn('Unsupported content type for extraction', { contentType });
          return 'Unsupported file type for text extraction';
      }

    } catch (error: unknown) {
      logger.error('Text extraction failed', {
        filePath,
        contentType,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractTextFile(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8');
    return content.trim();
  }

  private async extractPDF(filePath: string): Promise<string> {
    try {
      logger.info('Attempting to read PDF file', { filePath });
      
      // Check if file exists first
      try {
        await fs.access(filePath);
      } catch {
        throw new Error(`File does not exist: ${filePath}`);
      }

      // PDF processing temporarily disabled
      throw new Error('PDF processing temporarily disabled');

    } catch (error: unknown) {
      logger.error('PDF extraction failed', { 
        error: error instanceof Error ? error.message : 'Unknown error', 
        stack: error instanceof Error ? error.stack : undefined,
        filePath 
      });
      throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Simple text chunking for MVP
  chunkText(text: string, maxTokens: number = 1000): string[] {
    // Simple word-based chunking (not token-accurate but good for MVP)
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    
    for (let i = 0; i < words.length; i += maxTokens) {
      const chunk = words.slice(i, i + maxTokens).join(' ');
      if (chunk.trim()) {
        chunks.push(chunk.trim());
      }
    }

    return chunks.length > 0 ? chunks : [text];
  }
}