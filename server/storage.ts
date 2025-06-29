import { 
  users, 
  kaleidoscopeSubmissions,
  type User, 
  type InsertUser,
  type KaleidoscopeSubmission,
  type InsertKaleidoscopeSubmission
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Kaleidoscope submissions
  createKaleidoscopeSubmission(submission: InsertKaleidoscopeSubmission): Promise<KaleidoscopeSubmission>;
  getAllKaleidoscopeSubmissions(): Promise<KaleidoscopeSubmission[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private kaleidoscopeSubmissions: Map<number, KaleidoscopeSubmission>;
  currentUserId: number;
  currentSubmissionId: number;

  constructor() {
    this.users = new Map();
    this.kaleidoscopeSubmissions = new Map();
    this.currentUserId = 1;
    this.currentSubmissionId = 1;
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
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createKaleidoscopeSubmission(submission: InsertKaleidoscopeSubmission): Promise<KaleidoscopeSubmission> {
    const id = this.currentSubmissionId++;
    const kaleidoscopeSubmission: KaleidoscopeSubmission = {
      id,
      ...submission,
      createdAt: new Date()
    };
    this.kaleidoscopeSubmissions.set(id, kaleidoscopeSubmission);
    return kaleidoscopeSubmission;
  }

  async getAllKaleidoscopeSubmissions(): Promise<KaleidoscopeSubmission[]> {
    return Array.from(this.kaleidoscopeSubmissions.values())
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime()); // Most recent first
  }
}

export const storage = new MemStorage();
