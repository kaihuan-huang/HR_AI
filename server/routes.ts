import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import OpenAI from "openai";
import { insertMessageSchema } from "@shared/schema";

// Initialize Groq as primary and OpenAI as backup
const groq = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const GROQ_MODEL = "mixtral-8x7b-32768";
const OPENAI_MODEL = "gpt-4o";

async function getAIResponse(messages: any[], context?: { workspace?: string }) {
  const basePrompt = context?.workspace 
    ? `You are an AI assistant helping improve a sequence of steps. Review the current sequence and user feedback to suggest improvements.

Current sequence:
${context.workspace}

Guidelines:
1. Keep the step numbering format (Step X:)
2. Make specific suggestions for improvements
3. Explain your reasoning briefly
4. Ask clarifying questions if needed`

    : `You are an AI assistant helping create a sequence of steps. Guide the user through creating an effective sequence.

Guidelines:
1. If this is a new conversation, ask about:
   - The goal/purpose of the sequence
   - Target audience
   - Desired tone and style
   - Preferred number of steps
2. Once you have enough information, generate a sequence using "Step X:" format
3. After generating, ask if they'd like any adjustments
4. Keep responses clear and actionful`;

  const systemMessage = { role: "system", content: basePrompt };
  const messageList = [systemMessage, ...messages];

  try {
    // Try Groq first
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: messageList,
    });
    return response.choices[0].message.content;
  } catch (groqError) {
    console.error("Groq error:", groqError);
    try {
      // Fallback to OpenAI
      const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: messageList,
      });
      return response.choices[0].message.content;
    } catch (openaiError) {
      console.error("OpenAI error:", openaiError);
      throw new Error("AI services failed to respond");
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
      // Get last 5 messages for context
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
        content: aiResponse || "I apologize, but I couldn't generate a response at this time. Please try again.",
        role: "assistant"
      });

      res.json({ userMessage, aiMessage });
    } catch (error) {
      console.error("AI service error:", error);
      res.status(500).json({ 
        message: "Failed to get AI response. Please try again in a moment."
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}