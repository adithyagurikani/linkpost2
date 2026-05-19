import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { cronAuthMiddleware } from "../middleware/cron-auth";
import { apiLimiter, aiLimiter, authLimiter, cronLimiter } from "../middleware/rate-limit";

// Controllers
import * as authCtrl from "../controllers/auth.controller";
import * as postsCtrl from "../controllers/posts.controller";
import * as accountsCtrl from "../controllers/accounts.controller";
import * as schedulesCtrl from "../controllers/schedules.controller";
import * as sourcesCtrl from "../controllers/sources.controller";
import * as aiCtrl from "../controllers/ai.controller";
import * as analyticsCtrl from "../controllers/analytics.controller";
import * as dashboardCtrl from "../controllers/dashboard.controller";
import * as settingsCtrl from "../controllers/settings.controller";
import * as systemCtrl from "../controllers/system.controller";
import * as cronCtrl from "../controllers/cron.controller";
import * as cronConfigCtrl from "../controllers/cron-config.controller";
import * as userCtrl from "../controllers/user.controller";
import * as logsCtrl from "../controllers/logs.controller";
import { adminMiddleware } from "../middleware/admin";

const router = Router();

// ─── Public routes (no auth) ───
router.get("/health", systemCtrl.health);

// ─── Auth routes ───
const authRouter = Router();
authRouter.use(authLimiter);
authRouter.post("/login", authCtrl.login);
authRouter.post("/register", authCtrl.register);
authRouter.post("/refresh", authCtrl.refresh);
router.use("/auth", authRouter);

// ─── LinkedIn OAuth callback (no JWT auth — uses OAuth state) ───
router.get("/accounts/callback", accountsCtrl.callback);

// ─── Cron routes (cron auth, not JWT) ───
const cronRouter = Router();
cronRouter.use(cronAuthMiddleware);
cronRouter.use(cronLimiter);
cronRouter.post("/daily", cronCtrl.daily);
router.use("/cron", cronRouter);

// ─── All remaining routes require JWT auth ───
router.use(authMiddleware);
router.use(apiLimiter);

// Posts
const postsRouter = Router();
postsRouter.get("/", postsCtrl.list);
postsRouter.post("/", postsCtrl.create);
postsRouter.get("/:id", postsCtrl.getById);
postsRouter.put("/:id", postsCtrl.update);
postsRouter.delete("/:id", postsCtrl.remove);
postsRouter.post("/:id/post-now", postsCtrl.postNow);
postsRouter.post("/bulk-schedule", postsCtrl.bulkSchedule);
postsRouter.post("/schedule-drafts", postsCtrl.scheduleDrafts);
postsRouter.post("/batch-delete", postsCtrl.batchDelete);
postsRouter.post("/reschedule", postsCtrl.reschedule);
router.use("/posts", postsRouter);

// Accounts
const accountsRouter = Router();
accountsRouter.get("/", accountsCtrl.listAccounts);
accountsRouter.get("/connect", accountsCtrl.connect);
accountsRouter.post("/:id/toggle", accountsCtrl.toggle);
accountsRouter.post("/:id/disconnect", accountsCtrl.disconnect);
router.use("/accounts", accountsRouter);

// Schedules
const schedulesRouter = Router();
schedulesRouter.get("/", schedulesCtrl.list);
schedulesRouter.get("/:id", schedulesCtrl.getById);
schedulesRouter.post("/", schedulesCtrl.create);
schedulesRouter.put("/:id", schedulesCtrl.update);
schedulesRouter.delete("/:id", schedulesCtrl.remove);
schedulesRouter.post("/:id/toggle", schedulesCtrl.toggle);
router.use("/schedules", schedulesRouter);

// Sources
const sourcesRouter = Router();
sourcesRouter.get("/", sourcesCtrl.list);
sourcesRouter.get("/:id", sourcesCtrl.getById);
sourcesRouter.post("/", sourcesCtrl.create);
sourcesRouter.put("/:id", sourcesCtrl.update);
sourcesRouter.delete("/:id", sourcesCtrl.remove);
sourcesRouter.post("/:id/import", sourcesCtrl.importSource);
sourcesRouter.post("/import-all", sourcesCtrl.importAll);
sourcesRouter.post("/bulk-import", sourcesCtrl.bulkImport);
router.use("/sources", sourcesRouter);

// AI (with stricter rate limiting)
const aiRouter = Router();
aiRouter.use(aiLimiter);
aiRouter.post("/generate", aiCtrl.generate);
aiRouter.post("/brief", aiCtrl.brief);
aiRouter.post("/schedule-plan", aiCtrl.schedulePlan);
router.use("/ai", aiRouter);

// Analytics
const analyticsRouter = Router();
analyticsRouter.get("/data", analyticsCtrl.getData);
router.use("/analytics", analyticsRouter);

// Dashboard
router.get("/dashboard/stats", dashboardCtrl.getStats);

// Users (admin only)
const usersRouter = Router();
usersRouter.use(adminMiddleware);
usersRouter.get("/", userCtrl.listUsers);
usersRouter.post("/", userCtrl.createUser);
usersRouter.delete("/:id", userCtrl.deleteUser);
usersRouter.put("/:id/reset-password", userCtrl.resetPassword);
router.use("/users", usersRouter);

// Settings
const settingsRouter = Router();
settingsRouter.put("/password", settingsCtrl.changePassword);
settingsRouter.get("/prompts", settingsCtrl.getPromptsHandler);
settingsRouter.put("/prompts", settingsCtrl.updatePromptsHandler);
settingsRouter.get("/cron", cronConfigCtrl.getConfig);
settingsRouter.put("/cron", cronConfigCtrl.updateConfig);
router.use("/settings", settingsRouter);

// System
const systemRouter = Router();
systemRouter.post("/optimize", systemCtrl.optimize);
systemRouter.post("/sync-analytics", systemCtrl.syncAnalytics);
router.use("/system", systemRouter);

// Logs
router.get("/logs", logsCtrl.getLogs);

export default router;
