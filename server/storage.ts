import session from "express-session";
import createMemoryStore from "memorystore";
import { User, Message, InsertUser } from "@shared/schema";
import { nanoid } from "nanoid";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getMessages(userId: number): Promise<Message[]>;
  createMessage(message: Omit<Message, "id" | "createdAt">): Promise<Message>;
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, Message[]>;
  private currentId: number;
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    this.messages.set(id, []);
    return user;
  }

  async getMessages(userId: number): Promise<Message[]> {
    return this.messages.get(userId) || [];
  }

  async createMessage(message: Omit<Message, "id" | "createdAt">): Promise<Message> {
    const id = nanoid();
    const newMessage: Message = {
      ...message,
      id,
      createdAt: new Date()
    };
    
    const userMessages = this.messages.get(message.userId) || [];
    userMessages.push(newMessage);
    this.messages.set(message.userId, userMessages);
    
    return newMessage;
  }
}

export const storage = new MemStorage();
