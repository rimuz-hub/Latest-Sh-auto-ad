import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

  // SECURITY: Whitelist enforcement
  const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || "platisthere@gmail.com").split(",").map(e => e.trim());
  const OWNER_EMAIL = "platisthere@gmail.com";

  // SECURITY: Instance Lock
  const LOCK_FILE = path.join(process.cwd(), "instance.lock");
  const releaseLock = () => {
    try {
      if (fs.existsSync(LOCK_FILE)) {
        const pid = fs.readFileSync(LOCK_FILE, "utf-8");
        if (pid === process.pid.toString()) {
          fs.unlinkSync(LOCK_FILE);
        }
      }
    } catch (e) {}
  };

  // Instance lock check on startup
  if (fs.existsSync(LOCK_FILE)) {
    const pid = fs.readFileSync(LOCK_FILE, "utf-8");
    try {
      process.kill(Number(pid), 0);
      console.error("FATAL: Another instance is already running (Lock file exists).");
      process.exit(1);
    } catch (e) {
      // Process not running, stale lock
      releaseLock();
    }
  }
  fs.writeFileSync(LOCK_FILE, process.pid.toString());

  process.on("exit", releaseLock);
  process.on("SIGINT", () => { releaseLock(); process.exit(); });
  process.on("SIGTERM", () => { releaseLock(); process.exit(); });

// Middleware: Chrome check
const chromeOnly = (req: Request, res: Response, next: NextFunction) => {
  const ua = req.headers["user-agent"] || "";
  if (!ua.includes("Chrome") || ua.includes("Edge") || ua.includes("OPR")) {
    return res.status(403).send("<h1>ACCESS DENIED</h1><p>This system requires Google Chrome.</p>");
  }
  next();
};

// Middleware: Whitelist check
const whitelistOnly = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as any;
  const email = user?.email;
  if (!email || !ALLOWED_EMAILS.includes(email)) {
    return res.status(403).send("<h1>UNAUTHORIZED</h1><p>Your account is not whitelisted.</p>");
  }
  next();
};

// Owner check
const ownerOnly = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as any;
  const email = user?.email;
  if (email !== OWNER_EMAIL) {
    return res.status(403).json({ message: "Owner access required" });
  }
  next();
};

// Setup multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: "client/public/uploads/",
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
  }),
});

// Ensure upload directory exists
if (!fs.existsSync("client/public/uploads/")) {
  fs.mkdirSync("client/public/uploads/", { recursive: true });
}

type LogEntry = {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'error';
  message: string;
};

class AutomationManager {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private logs: LogEntry[] = [];
  private maxLogs: number = 100;

  getStatus() {
    return { isRunning: this.isRunning, logs: this.logs };
  }

  addLog(type: 'info' | 'success' | 'error', message: string) {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      type,
      message
    };
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) this.logs.shift();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.addLog('info', 'Automation stopped.');
  }

  start(token: string, message: string, channelIds: string[], delaySeconds: number, imageUrls: string[] = []) {
    if (this.isRunning) this.stop();
    this.isRunning = true;
    this.logs = [];
    this.addLog('info', `Starting automation. Delay: ${delaySeconds}s. Channels: ${channelIds.length}`);

    const runLoop = async () => {
      if (!this.isRunning) return;
      this.addLog('info', `Executing cycle...`);
      
      for (const channelId of channelIds) {
        if (!this.isRunning) break;
        try {
          // Attempt with images first if any
          let success = false;
          if (imageUrls.length > 0) {
            // In a real scenario, we'd use FormData to send files to Discord.
            // For simplicity in this environment, we'll try to send them as embeds or attachments.
            // User token "self-botting" often uses a specific JSON structure.
            // Note: Sending messages with user tokens is technically against TOS.
            // This is implemented as per user request to replicate functionality.
            
            // Note: The original code used URLSearchParams here, but it might not be correct for Discord.
            // Keeping it consistent with logic flow, but primarily we rely on JSON or Multipart.

            // If we have images, we actually need to send them as multipart/form-data
            // However, most self-bots just send URLs or use a specific JSON structure.
            // Let's try sending as a proper multipart message if images are present.
            
            if (imageUrls.length > 0) {
              const form = new FormData();
              form.append('content', message);
              
              for (let i = 0; i < imageUrls.length; i++) {
                const url = imageUrls[i];
                if (url.startsWith('/uploads/')) {
                  const filePath = path.join(process.cwd(), 'client/public', url);
                  if (fs.existsSync(filePath)) {
                    const blob = await fs.openAsBlob(filePath);
                    form.append(`files[${i}]`, blob, path.basename(filePath));
                  }
                }
              }

              const imgResponse = await fetch(`https://discord.com/api/v9/channels/${channelId.trim()}/messages`, {
                method: 'POST',
                headers: { 
                  'Authorization': token,
                  // Content-Type is set automatically by fetch when body is FormData
                },
                body: form
              });

              if (imgResponse.ok) {
                this.addLog('success', `Sent to ${channelId} with images`);
                success = true;
              } else {
                const errData: any = await imgResponse.json().catch(() => ({}));
                this.addLog('error', `Image send failed in ${channelId}: ${imgResponse.status} ${JSON.stringify(errData)}`);
              }
            }
          }

          if (!success) {
            const response = await fetch(`https://discord.com/api/v9/channels/${channelId.trim()}/messages`, {
              method: 'POST',
              headers: { 'Authorization': token, 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: message })
            });
            if (response.ok) {
              this.addLog('success', `Sent text to ${channelId}`);
            } else {
              this.addLog('error', `Failed ${channelId}: ${response.status}`);
            }
          }
        } catch (error: any) {
          this.addLog('error', `Error ${channelId}: ${error.message}`);
        }
        // Small delay between channels to avoid rate limits
        await new Promise(r => setTimeout(r, 1000));
      }
    };

    runLoop();
    this.intervalId = setInterval(runLoop, delaySeconds * 1000);
  }
}

const automation = new AutomationManager();

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Authorization flow
  await setupAuth(app);
  registerAuthRoutes(app);

  // SECURITY: Chrome-only, Auth, and Whitelist enforcement
  app.use("/api", chromeOnly);
  app.use("/api", isAuthenticated);
  app.use("/api", whitelistOnly);
  
  // Serve uploaded files
  app.use("/uploads", express.static(path.join(process.cwd(), "client/public/uploads")));

  app.get(api.configs.list.path, async (req, res) => {
    const user = req.user as any;
    const configs = await storage.getAllConfigs(user.email);
    res.json(configs);
  });

  app.get(api.configs.get.path, async (req, res) => {
    const config = await storage.getConfig(Number(req.params.id));
    if (!config) return res.status(404).json({ message: "Not found" });
    
    const user = req.user as any;
    if (config.userEmail !== user.email) {
       return res.status(403).json({ message: "Forbidden" });
    }
    res.json(config);
  });

  app.post(api.configs.save.path, ownerOnly, async (req, res) => {
    try {
      const user = req.user as any;
      const input = api.configs.save.input.parse({
        ...req.body,
        userEmail: user.email
      });
      const config = await storage.saveConfig(input);
      res.json(config);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(400).json({ message: err.message });
      }
    }
  });

  app.delete(api.configs.delete.path, async (req, res) => {
    const config = await storage.getConfig(Number(req.params.id));
    if (config) {
      const user = req.user as any;
      if (config.userEmail === user.email) {
        await storage.deleteConfig(Number(req.params.id));
      }
    }
    res.status(204).end();
  });

  app.post(api.upload.images.path, upload.array("images"), (req, res) => {
    // Cast to any because typescript types for multer request augmentation are tricky
    const files = (req as any).files;
    if (!files) return res.status(400).json({ message: "No files uploaded" });
    
    const urls = files.map((f: any) => `/uploads/${f.filename}`);
    res.json({ urls });
  });

  app.post(api.automation.start.path, (req, res) => {
    try {
      const input = api.automation.start.input.parse(req.body);
      automation.start(input.token, input.message, input.channelIds, input.delaySeconds, input.imageUrls);
      res.json({ message: "Started" });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(400).json({ message: err.message });
      }
    }
  });

  app.post(api.automation.stop.path, (req, res) => {
    automation.stop();
    res.json({ message: "Stopped" });
  });

  app.get(api.automation.status.path, (req, res) => {
    res.json(automation.getStatus());
  });

  return httpServer;
}