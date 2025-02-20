import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import OpenAI from "openai";
import { insertMessageSchema } from "@shared/schema";

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Initialize Groq client as a backup
const groq = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY
});

const MODEL = "gpt-4o";
const GROQ_MODEL = "mixtral-8x7b-32768";

async function getAIResponse(messages: any[], context?: { workspace?: string }) {
  const basePrompt = context?.workspace 
    ? `You are a helpful AI assistant working on improving a sequence of steps. Your goal is to help refine and enhance the sequence based on user feedback.

Current sequence:
${context.workspace}

When editing:
1. Maintain the step format and numbering
2. Keep responses clear and concise
3. Ask follow-up questions if needed to better understand the user's needs
4. Suggest specific improvements while explaining your reasoning`
    : `You are a helpful AI assistant creating a sequence of steps based on user input. Your goal is to gather information and create a well-structured sequence.

When interacting:
1. Ask follow-up questions to understand:
   - The goal of the sequence
   - The target audience
   - Desired number of steps
   - Key points to include
2. Once you have enough information, generate a sequence using "Step X:" format
3. Keep each step clear and actionable
4. Maintain a conversational tone while being professional`;

  const systemMessage = {
    role: "system",
    content: basePrompt
  };

  const messageList = [systemMessage, ...messages];

  try {
    // Try OpenAI first
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: messageList,
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI error:", error);
    try {
      // Fallback to Groq if OpenAI fails
      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: messageList,
      });
      return response.choices[0].message.content;
    } catch (groqError) {
      console.error("Groq error:", groqError);
      throw new Error("Both AI services failed to respond");
    }
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const messages = await storage.getMessages(req.user.id);
    res.json(messages);
  });

  app.post("/api/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const result = insertMessageSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json(result.error);
    }

    const userMessage = await storage.createMessage({
      userId: req.user.id,
      content: result.data.content,
      role: "user"
    });

    try {
      // Get previous messages for context
      const messages = await storage.getMessages(req.user.id);
      const recentMessages = messages.slice(-5).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const aiResponse = await getAIResponse(
        recentMessages,
        req.body.context
      );

      const aiMessage = await storage.createMessage({
        userId: req.user.id,
        content: aiResponse || "I'm sorry, I couldn't generate a response.",
        role: "assistant"
      });

      res.json({ userMessage, aiMessage });
    } catch (error) {
      console.error("AI service error:", error);
      res.status(500).json({ message: "Failed to get AI response" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}