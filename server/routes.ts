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
  const systemMessage = {
    role: "system",
    content: context?.workspace
      ? "You are a helpful AI assistant working on a sequence of steps. When editing, maintain the step format and numbering. Provide clear and concise responses."
      : "You are a helpful AI assistant. Based on the user's input, gather necessary information by asking questions. Once you have enough information, generate a clear sequence of steps. Each step should start with 'Step X:' and be on a new line. Keep your responses focused on helping create and refine the sequence."
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