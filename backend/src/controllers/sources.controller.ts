import { Response } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../config/db";
import { writeAuditLog } from "../services/audit.service";
import {
  validate,
  SourceCreateSchema,
  SourceUpdateSchema,
  BulkImportSchema,
} from "../lib/validation";
import {
  parseSourceContent,
  normalizeContent,
} from "../lib/sources";
import { AuthRequest, paramId } from "../types";

export async function create(req: AuthRequest, res: Response) {
  const { data, error } = validate(SourceCreateSchema, req.body);
  if (error) return res.status(error.status).json({ error: error.message });

  const db = await getDb();
  const result = await db.collection("contentSources").insertOne({
    ...data,
    isActive: true,
    userId: req.user!.id,
    createdAt: new Date(),
  });

  writeAuditLog({
    action: "source.created",
    entityType: "source",
    entityId: result.insertedId.toString(),
    userId: req.user!.id,
  });

  res.status(201).json({ ok: true, id: result.insertedId.toString() });
}

export async function getById(req: AuthRequest, res: Response) {
  const db = await getDb();
  const source = await db.collection("contentSources").findOne({
    _id: new ObjectId(paramId(req)),
    userId: req.user!.id,
  });

  if (!source) return res.status(404).json({ error: "Source not found" });

  res.json({
    ...source,
    id: source._id.toString(),
    _id: undefined,
    createdAt: source.createdAt?.toISOString?.() || source.createdAt,
  });
}

export async function list(req: AuthRequest, res: Response) {
  const db = await getDb();
  const sources = await db
    .collection("contentSources")
    .find({ userId: req.user!.id }, { sort: { createdAt: -1 } })
    .toArray();

  const serialized = sources.map((s) => ({
    ...s,
    id: s._id.toString(),
    _id: undefined,
    createdAt: s.createdAt?.toISOString?.() || s.createdAt,
  }));

  res.json(serialized);
}

export async function update(req: AuthRequest, res: Response) {
  const { data, error } = validate(SourceUpdateSchema, req.body);
  if (error) return res.status(error.status).json({ error: error.message });

  const db = await getDb();
  const setPayload: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) setPayload.name = data.name;
  if (data.sourceType !== undefined) setPayload.sourceType = data.sourceType;
  if (data.content !== undefined) setPayload.content = data.content;

  try {
    await db.collection("contentSources").updateOne(
      { _id: new ObjectId(paramId(req)), userId: req.user!.id },
      { $set: setPayload }
    );
    writeAuditLog({
      action: "source.updated",
      entityType: "source",
      entityId: paramId(req),
      userId: req.user!.id,
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Update failed" });
  }
}

export async function remove(req: AuthRequest, res: Response) {
  const db = await getDb();
  try {
    await db.collection("contentSources").deleteOne({
      _id: new ObjectId(paramId(req)),
      userId: req.user!.id,
    });
    writeAuditLog({
      action: "source.deleted",
      entityType: "source",
      entityId: paramId(req),
      userId: req.user!.id,
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Delete failed" });
  }
}

export async function importSource(req: AuthRequest, res: Response) {
  const db = await getDb();
  const userId = req.user!.id;
  const source = await db.collection("contentSources").findOne({
    _id: new ObjectId(paramId(req)),
    userId,
  });

  if (!source)
    return res.status(404).json({ error: "Source not found" });

  const parsed = parseSourceContent(source as any);
  if (parsed.error)
    return res.status(400).json({ error: parsed.error });
  if (!parsed.contents.length)
    return res.json({ imported: 0, skipped: 0, message: "No content found" });

  // Dedup
  const normalized = parsed.contents.map((c) => normalizeContent(c));
  const existing = (await db
    .collection("posts")
    .find(
      { userId, source: "imported_asset", content: { $in: normalized } },
      { projection: { content: 1 } }
    )
    .toArray()) as unknown as { content: string }[];
  const existingSet = new Set(existing.map((p) => normalizeContent(p.content)));
  const unique = parsed.contents.filter(
    (_, i) => !existingSet.has(normalized[i])
  );

  if (!unique.length)
    return res.json({
      imported: 0,
      skipped: parsed.contents.length,
      message: "All content already imported",
    });

  const now = new Date();
  const docs = unique.map((c) => ({
    content: c,
    status: "draft",
    source: "imported_asset",
    userId,
    createdAt: now,
    updatedAt: now,
    accountId: null,
    scheduledAt: null,
    postedAt: null,
    likes: 0,
    comments: 0,
  }));

  const result = await db.collection("posts").insertMany(docs);

  writeAuditLog({
    action: "source.imported",
    entityType: "source",
    entityId: paramId(req),
    metadata: {
      imported: result.insertedCount,
      skipped: parsed.contents.length - unique.length,
    },
    userId,
  });

  res.json({
    imported: result.insertedCount,
    skipped: parsed.contents.length - unique.length,
  });
}

export async function importAll(req: AuthRequest, res: Response) {
  const db = await getDb();
  const userId = req.user!.id;

  const sources = await db
    .collection("contentSources")
    .find({ userId, isActive: { $ne: false } })
    .toArray();

  if (!sources.length)
    return res.json({ imported: 0, skipped: 0, failedSources: 0 });

  const allContents: string[] = [];
  let failedSources = 0;

  for (const source of sources) {
    const parsed = parseSourceContent(source as any);
    if (parsed.error) {
      failedSources++;
      continue;
    }
    allContents.push(...parsed.contents);
  }

  if (!allContents.length)
    return res.json({ imported: 0, skipped: 0, failedSources });

  const normalized = allContents.map((c) => normalizeContent(c));
  const existing = (await db
    .collection("posts")
    .find(
      { userId, source: "imported_asset", content: { $in: normalized } },
      { projection: { content: 1 } }
    )
    .toArray()) as unknown as { content: string }[];
  const existingSet = new Set(existing.map((p) => normalizeContent(p.content)));
  const unique = allContents.filter((_, i) => !existingSet.has(normalized[i]));

  if (!unique.length)
    return res.json({
      imported: 0,
      skipped: allContents.length,
      failedSources,
    });

  const now = new Date();
  const docs = unique.map((c) => ({
    content: c,
    status: "draft",
    source: "imported_asset",
    userId,
    createdAt: now,
    updatedAt: now,
    accountId: null,
    scheduledAt: null,
    postedAt: null,
    likes: 0,
    comments: 0,
  }));

  const result = await db.collection("posts").insertMany(docs);

  writeAuditLog({
    action: "source.import_all",
    entityType: "source",
    metadata: {
      imported: result.insertedCount,
      skipped: allContents.length - unique.length,
      failedSources,
    },
    userId,
  });

  res.json({
    imported: result.insertedCount,
    skipped: allContents.length - unique.length,
    failedSources,
    totalSources: sources.length,
  });
}

export async function bulkImport(req: AuthRequest, res: Response) {
  const { data, error } = validate(BulkImportSchema, req.body);
  if (error) return res.status(error.status).json({ error: error.message });

  const db = await getDb();
  const userId = req.user!.id;
  const now = new Date();

  const docs = data.items.map((item) => ({
    name: item.name,
    sourceType: "imported_json",
    content: item.content,
    isActive: true,
    userId,
    createdAt: now,
  }));

  const result = await db.collection("contentSources").insertMany(docs);
  writeAuditLog({
    action: "source.bulk_imported",
    entityType: "source",
    metadata: { count: result.insertedCount },
    userId,
  });

  res.status(201).json({ ok: true, count: result.insertedCount });
}
