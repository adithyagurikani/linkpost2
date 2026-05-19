import { Request } from "express";
import { ObjectId } from "mongodb";

// ─── Post Status ───
export type PostStatus =
  | "draft"
  | "scheduled"
  | "queued"
  | "posting"
  | "posted"
  | "failed";

// ─── Database Documents ───
export interface UserDoc {
  _id: ObjectId;
  username: string;
  passwordHash: string;
  role: "admin" | "user";
  createdAt: Date;
}

export interface PostDoc {
  _id: ObjectId;
  content: string;
  status: PostStatus;
  scheduledAt: Date | null;
  postedAt: Date | null;
  accountId: string | null;
  linkedinPostId?: string;
  shareUrl?: string;
  errorMessage?: string;
  source: string;
  likes: number;
  comments: number;
  analyticsLastSync?: Date | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountDoc {
  _id: ObjectId;
  linkedinUserId: string;
  name: string;
  avatarUrl: string | null;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt: Date;
  refreshTokenExpiresAt?: Date | null;
  isActive: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ScheduleMode = "template" | "drafts";

export interface ScheduleDoc {
  _id: ObjectId;
  name: string;
  accountId: string;
  userId: string;
  times: string[];
  timezone: string;
  mode: ScheduleMode;
  contentTemplate?: string;
  cronExpression?: string;
  nextRunAt: Date | null;
  lastRunAt: Date | null;
  isActive: boolean;
  createdAt: Date;
}

export interface ContentSourceDoc {
  _id: ObjectId;
  name: string;
  sourceType: "text" | "csv" | "json" | "imported_json";
  content: string;
  isActive: boolean;
  userId: string;
  createdAt: Date;
}

export interface AuditEntry {
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  error?: string;
  userId?: string;
}

export interface SettingsDoc {
  _id: string;
  [key: string]: unknown;
}

// ─── JWT ───
export interface JwtPayload {
  id: string;
  username: string;
  role: "admin" | "user";
}

// ─── Express Extension ───
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/** Safely extract a single route param as string (Express v5 returns string|string[]) */
export function paramId(req: Request, key = "id"): string {
  const val = req.params[key];
  return Array.isArray(val) ? val[0] : val;
}

// ─── API Responses ───
export interface PublishResult {
  ok: boolean;
  linkedinPostId?: string;
  shareUrl?: string;
  error?: string;
  statusCode?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ─── LinkedIn ───
export interface LinkedInTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
}

export interface LinkedInUserInfo {
  sub: string;
  name: string;
  picture?: string;
}
