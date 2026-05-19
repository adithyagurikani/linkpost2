import { z } from "zod";

export const BulkScheduleSchema = z.object({
  contents: z.array(z.string().min(1)).min(1, "At least one post is required").max(500, "Maximum 500 posts per batch"),
  accountId: z.string().min(1, "Account is required"),
  startDate: z.string().min(1, "Start date is required"),
  times: z.array(z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)")).min(1, "At least one posting time is required"),
  postsPerDay: z.number().int().min(1).max(10).default(1),
  timezone: z.string().optional().default("UTC"),
});

const CONTENT_MAX = 3000;

export const PostCreateSchema = z.object({
  content: z.string().min(1, "Content is required").max(CONTENT_MAX, `Content must be under ${CONTENT_MAX} characters`),
  accountId: z.string().optional(),
  accountIds: z.array(z.string()).optional(),
  scheduledAt: z.string().nullable().optional(),
});

export const PostUpdateSchema = z.object({
  content: z.string().min(1).max(CONTENT_MAX).optional(),
  accountId: z.string().nullable().optional(),
  status: z.enum(["draft", "scheduled", "queued", "posting", "posted", "failed"]).optional(),
  scheduledAt: z.string().nullable().optional(),
});

export const PostQuerySchema = z.object({
  status: z.string().optional(),
  view: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().min(1).catch(1),
  limit: z.coerce.number().int().min(1).max(500).catch(50),
});

export const SourceCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  sourceType: z.enum(["text", "csv", "json", "imported_json"]).default("text"),
  content: z.string().min(1, "Content is required"),
});

export const SourceUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  sourceType: z.enum(["text", "csv", "json", "imported_json"]).optional(),
  content: z.string().min(1).optional(),
});

export const BulkImportSchema = z.object({
  items: z.array(z.object({
    name: z.string().min(1).max(200),
    content: z.string().min(1).max(10000, "Content must be under 10,000 characters"),
  })).min(1, "At least one item is required").max(100, "Maximum 100 items per bulk import"),
});

export const ScheduleCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  accountId: z.string().min(1, "Account is required"),
  times: z.array(z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)")).min(1, "At least one posting time is required"),
  contentTemplate: z.string().min(1, "Content template is required"),
  timezone: z.string().optional().default("Asia/Kolkata"),
});

export const ScheduleUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  accountId: z.string().optional(),
  times: z.array(z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)")).optional(),
  contentTemplate: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  timezone: z.string().optional(),
});

export const AIGenerateSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  mode: z.enum(["refine", "expand", "hashtags", "schedule"]).optional().default("refine"),
});

export const PasswordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const ScheduleDraftsSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  startDate: z.string().min(1, "Start date is required"),
  times: z.array(z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)")).min(1, "At least one posting time is required"),
  postsPerDay: z.number().int().min(1).max(10).default(3),
  timezone: z.string().optional().default("Asia/Kolkata"),
});

export const RegisterSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(50),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const BriefSchema = z.object({
  query: z.string().optional(),
  days: z.number().int().min(1).max(90).optional().default(7),
});

export const SchedulePlanSchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
});

export const RescheduleSchema = z.object({
  ids: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  times: z.array(z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format (HH:MM)")).min(1).default(["09:00", "13:00", "17:00"]),
  postsPerDay: z.number().int().min(1).max(10).default(3),
  timezone: z.string().optional().default("Asia/Kolkata"),
});
