import type { Response } from 'express';
import { logger } from '../utils/logger.ts';

interface DocumentStatusUpdate {
  documentId: string;
  status: 'processing' | 'processed' | 'failed';
  filename?: string;
  chunkCount?: number;
  error?: string;
}

class NotificationService {
  private clients: Map<string, Response> = new Map();

  // Add a client to receive notifications
  addClient(clientId: string, res: Response): void {
    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

    // Store the client
    this.clients.set(clientId, res);

    logger.info('SSE client connected', { clientId, totalClients: this.clients.size });

    // Handle client disconnect
    res.on('close', () => {
      this.clients.delete(clientId);
      logger.info('SSE client disconnected', { clientId, totalClients: this.clients.size });
    });

    // Keep connection alive with periodic heartbeat
    const heartbeat = setInterval(() => {
      if (this.clients.has(clientId)) {
        try {
          res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);
        } catch (error) {
          logger.error('Failed to send heartbeat', { clientId, error });
          this.clients.delete(clientId);
          clearInterval(heartbeat);
        }
      } else {
        clearInterval(heartbeat);
      }
    }, 30000); // 30 seconds
  }

  // Notify all clients about document status updates
  notifyDocumentUpdate(update: DocumentStatusUpdate): void {
    const message = {
      type: 'document_status',
      data: update,
      timestamp: new Date().toISOString()
    };

    const messageString = `data: ${JSON.stringify(message)}\n\n`;

    logger.info('Broadcasting document status update', { 
      documentId: update.documentId, 
      status: update.status, 
      clients: this.clients.size 
    });

    // Send to all connected clients
    for (const [clientId, res] of this.clients.entries()) {
      try {
        res.write(messageString);
      } catch (error) {
        logger.error('Failed to send notification to client', { clientId, error });
        this.clients.delete(clientId);
      }
    }
  }

  // Get number of connected clients
  getClientCount(): number {
    return this.clients.size;
  }

  // Remove a specific client
  removeClient(clientId: string): void {
    const res = this.clients.get(clientId);
    if (res) {
      try {
        res.end();
      } catch (error) {
        logger.error('Error closing client connection', { clientId, error });
      }
      this.clients.delete(clientId);
    }
  }
}

export const notificationService = new NotificationService();
export type { DocumentStatusUpdate };