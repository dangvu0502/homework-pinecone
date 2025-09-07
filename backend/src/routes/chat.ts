import express from 'express';
import ChatMessageModel from '../models/ChatMessage.ts';
import ChatSessionModel from '../models/ChatSession.ts';
import { pineconeDB, type SearchResult } from '../services/PineconeService.ts';
import { OpenAIService } from '../services/OpenAI.ts';
import { logger } from '../utils/logger.ts';

const router = express.Router();
const openAI = new OpenAIService();

// POST /api/chat/sessions - Create new chat session
router.post('/sessions', async (req, res) => {
  try {
    const { documentIds = [] } = req.body;

    const session = await ChatSessionModel.create({
      document_ids: documentIds
    });

    logger.info('Chat session created', {
      sessionId: session.id,
      documentCount: documentIds.length
    });

    return res.status(201).json({
      id: session.id,
      createdAt: session.created_at,
      documentIds: session.document_ids
    });

  } catch (error: unknown) {
    logger.error('Failed to create chat session', { error: error instanceof Error ? error.message : 'Unknown error' });
    
    return res.status(500).json({
      error: {
        code: 'SESSION_CREATION_FAILED',
        message: 'Failed to create chat session'
      }
    });
  }
});

// GET /api/chat/sessions/:id - Get session details
router.get('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await ChatSessionModel.findById(id);

    if (!session) {
      return res.status(404).json({
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Chat session not found'
        }
      });
    }

    return res.json({
      id: session.id,
      createdAt: session.created_at,
      documentIds: session.document_ids
    });

  } catch (error: unknown) {
    logger.error('Failed to get chat session', {
      sessionId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return res.status(500).json({
      error: {
        code: 'SESSION_FETCH_FAILED',
        message: 'Failed to retrieve chat session'
      }
    });
  }
});

// POST /api/chat/sessions/:id/messages - Send message and get streaming response
router.post('/sessions/:id/messages', async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const { message, useRag = true } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: {
          code: 'INVALID_MESSAGE',
          message: 'Message is required and must be a string'
        }
      });
    }

    // Verify session exists and get document IDs
    const session = await ChatSessionModel.findById(sessionId);

    if (!session) {
      return res.status(404).json({
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Chat session not found'
        }
      });
    }
    const documentIds = session.document_ids || [];

    // Save user message
    const userMessage = await ChatMessageModel.create({
      session_id: parseInt(sessionId),
      role: 'user',
      content: message
    });

    logger.info('User message saved', {
      sessionId,
      messageId: userMessage.id,
      messageLength: message.length,
      useRag,
      documentCount: documentIds.length
    });

    // Set up Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');

    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`);

    let assistantResponse = '';
    let sources: SearchResult[] = [];

    try {
      // Get context from Pinecone if using RAG
      if (useRag && documentIds.length > 0) {
        // Use text-based search with integrated inference
        const searchResults = await pineconeDB.searchSimilarWithText(
          message,
          5,
          { documentId: { $in: documentIds.map(String) } }
        );
        
        sources = searchResults;
        
        // Send sources to client
        res.write(`data: ${JSON.stringify({
          type: 'source',
          sources: searchResults.map(result => ({
            documentId: result.documentId,
            filename: result.filename,
            snippet: result.text.substring(0, 200) + '...',
            relevanceScore: result.relevanceScore
          }))
        })}\n\n`);
        
        // Generate context for answer
        const context = searchResults.map(r => r.text).join('\n\n');
        
        // Stream answer generation
        for await (const token of openAI.streamAnswer(message, context)) {
          assistantResponse += token;
          res.write(`data: ${JSON.stringify({
            type: 'token',
            content: token
          })}\n\n`);
        }
      } else {
        // Simple response without RAG
        for await (const token of openAI.streamAnswer(message, '')) {
          assistantResponse += token;
          res.write(`data: ${JSON.stringify({
            type: 'token',
            content: token
          })}\n\n`);
        }
      }

      // Save assistant response to database
      await ChatMessageModel.create({
        session_id: parseInt(sessionId),
        role: 'assistant',
        content: assistantResponse,
        sources
      });

      // Send final close message
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);

    } catch (streamError: unknown) {
      logger.error('Streaming error', {
        sessionId,
        error: streamError instanceof Error ? streamError.message : 'Unknown streaming error'
      });

      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: 'An error occurred during response generation',
        code: 'STREAM_ERROR'
      })}\n\n`);
    }

    return res.end();

  } catch (error: unknown) {
    logger.error('Chat message error', {
      sessionId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    // If response hasn't started, send JSON error
    if (!res.headersSent) {
      return res.status(500).json({
        error: {
          code: 'CHAT_ERROR',
          message: 'Failed to process chat message'
        }
      });
    } else {
      // If streaming has started, send error through SSE
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: 'An error occurred',
        code: 'INTERNAL_ERROR'
      })}\n\n`);
      return res.end();
    }
  }
});

// GET /api/chat/sessions/:id/messages - Get message history
router.get('/sessions/:id/messages', async (req, res) => {
  try {
    const { id: sessionId } = req.params;

    const messages = await ChatMessageModel.findBySessionId(sessionId);

    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      sources: msg.sources,
      createdAt: msg.created_at
    }));

    return res.json({
      sessionId,
      messages: formattedMessages,
      count: formattedMessages.length
    });

  } catch (error: unknown) {
    logger.error('Failed to get message history', {
      sessionId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return res.status(500).json({
      error: {
        code: 'MESSAGES_FETCH_FAILED',
        message: 'Failed to retrieve message history'
      }
    });
  }
});

export default router;