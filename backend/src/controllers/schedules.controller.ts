import { Response } from "express";
import { ObjectId } from "mongodb";
import { getDb } from "../config/db";
import { writeAuditLog } from "../services/audit.service";
import {
  validate,
  ScheduleCreateSchema,
  ScheduleUpdateSchema,
} from "../lib/validation";
import { getNextRun } from "../lib/schedule-utils";
import { AuthRequest, paramId } from "../types";

export async function create(req: AuthRequest, res: Response) {
  const { data, error } = validate(ScheduleCreateSchema, req.body);
  if (error) return res.status(error.status).json({ error: error.message });

  const db = await getDb();
  const userId = req.user!.id;
  const now = new Date();

  const timezone = data.timezone || "Asia/Kolkata";

  const doc: Record<string, unknown> = {
    name: data.name,
    accountId: data.accountId,
    userId,
    times: data.times,
    timezone,
    mode: data.mode,
    contentTemplate: data.contentTemplate ?? null,
    nextRunAt: getNextRun(data.times, new Date(), timezone),
    lastRunAt: null,
    isActive: true,
    createdAt: now,
  };

  const result = await db.collection("schedules").insertOne(doc);
  writeAuditLog({
    action: "schedule.created",
    entityType: "schedule",
    entityId: result.insertedId.toString(),
    userId,
    metadata: { mode: data.mode },
  });
  res.status(201).json({ ok: true, id: result.insertedId.toString() });
}

export async function getById(req: AuthRequest, res: Response) {
  const db = await getDb();
  const schedule = await db.collection("schedules").findOne({
    _id: new ObjectId(paramId(req)),
    userId: req.user!.id,
  });

  if (!schedule) return res.status(404).json({ error: "Schedule not found" });

  res.json({
    ...schedule,
    id: schedule._id.toString(),
    _id: undefined,
    createdAt: schedule.createdAt?.toISOString?.() || schedule.createdAt,
    nextRunAt: schedule.nextRunAt?.toISOString?.() || schedule.nextRunAt,
    lastRunAt: schedule.lastRunAt?.toISOString?.() || schedule.lastRunAt,
  });
}

export async function list(req: AuthRequest, res: Response) {
  const db = await getDb();
  const schedules = await db
    .collection("schedules")
    .find({ userId: req.user!.id }, { sort: { createdAt: -1 } })
    .toArray();

  // Batch fetch account names
  const accountIds = [...new Set(schedules.map((s) => s.accountId).filter(Boolean))];
  const accounts = accountIds.length
    ? await db
        .collection("accounts")
        .find(
          { _id: { $in: accountIds.map((id) => new ObjectId(id)) } },
          { projection: { name: 1 } }
        )
        .toArray()
    : [];
  const accountMap = new Map(
    accounts.map((a) => [a._id.toString(), a.name])
  );

  const serialized = schedules.map((s) => {
    const accountId = s.accountId?.toString?.() || s.accountId;
    const accountName = accountMap.get(accountId) || null;
    return {
      ...s,
      id: s._id.toString(),
      _id: undefined,
      createdAt: s.createdAt?.toISOString?.() || s.createdAt,
      nextRunAt: s.nextRunAt?.toISOString?.() || s.nextRunAt,
      lastRunAt: s.lastRunAt?.toISOString?.() || s.lastRunAt,
      account: accountName ? { name: accountName } : null,
    };
  });

  res.json(serialized);
}

export async function update(req: AuthRequest, res: Response) {
  const { data, error } = validate(ScheduleUpdateSchema, req.body);
  if (error) return res.status(error.status).json({ error: error.message });

  const db = await getDb();
  const setPayload: Record<string, unknown> = {};
  if (data.name !== undefined) setPayload.name = data.name;
  if (data.accountId !== undefined) setPayload.accountId = data.accountId;
  if (data.mode !== undefined) setPayload.mode = data.mode;
  if (data.contentTemplate !== undefined) setPayload.contentTemplate = data.contentTemplate;
  if (data.isActive !== undefined) setPayload.isActive = data.isActive;
  if (data.times !== undefined) {
    setPayload.times = data.times;
    setPayload.timezone = data.timezone || "Asia/Kolkata";
    setPayload.nextRunAt = getNextRun(data.times, new Date(), data.timezone || "Asia/Kolkata");
  } else if (data.timezone !== undefined) {
    setPayload.timezone = data.timezone;
  }

  try {
    await db.collection("schedules").updateOne(
      { _id: new ObjectId(paramId(req)), userId: req.user!.id },
      { $set: setPayload }
    );
    writeAuditLog({
      action: "schedule.updated",
      entityType: "schedule",
      entityId: paramId(req),
      metadata: setPayload,
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
    await db.collection("schedules").deleteOne({
      _id: new ObjectId(paramId(req)),
      userId: req.user!.id,
    });
    writeAuditLog({
      action: "schedule.deleted",
      entityType: "schedule",
      entityId: paramId(req),
      userId: req.user!.id,
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: "Delete failed" });
  }
}

export async function toggle(req: AuthRequest, res: Response) {
  const db = await getDb();
  const oid = new ObjectId(paramId(req));
  const schedule = await db
    .collection("schedules")
    .findOne({ _id: oid, userId: req.user!.id });

  if (!schedule) return res.status(404).json({ error: "Not found" });

  const newActive = !schedule.isActive;
  await db
    .collection("schedules")
    .updateOne({ _id: oid, userId: req.user!.id }, { $set: { isActive: newActive } });

  writeAuditLog({
    action: newActive ? "schedule.resumed" : "schedule.paused",
    entityType: "schedule",
    entityId: paramId(req),
    userId: req.user!.id,
  });

  res.json({ ok: true });
}
