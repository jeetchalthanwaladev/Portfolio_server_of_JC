import "dotenv/config";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import MongoStore from "connect-mongo";
import express from "express";
import rateLimit from "express-rate-limit";
import session from "express-session";
import { readFile } from "node:fs/promises";
import dns from "node:dns";
import mongoose from "mongoose";
import multer from "multer";
import nodemailer from "nodemailer";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import defaultPortfolioContent from "../client/src/data/defaultPortfolioContent.js";
import AdminUser from "./models/AdminUser.js";
import PortfolioContent from "./models/PortfolioContent.js";

const app = express();
const port = Number(process.env.PORT || 3001);
const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const projectRoot = path.resolve(currentDir, "..");
const mongoUri = process.env.MONGODB_URI?.trim();
const mongoUriHasPlaceholders = Boolean(mongoUri && /<[^>]+>/.test(mongoUri));
const mongoDatabaseName = process.env.MONGODB_DB_NAME?.trim()
  || (mongoUri ? decodeURIComponent(new URL(mongoUri).pathname.replace(/^\/+/, "").split("/")[0] || "jeet_portfolio") : "jeet_portfolio");
let databaseReady = false;
let adminAccountReady = false;
const configuredDnsServers = process.env.MONGODB_DNS_SERVERS
  ?.split(",")
  .map((server) => server.trim())
  .filter(Boolean);

if (configuredDnsServers?.length) {
  try {
    dns.setServers(configuredDnsServers);
    console.log(`Using ${configuredDnsServers.length} configured DNS resolver(s).`);
  } catch (error) {
    console.error(`Configured DNS resolvers were ignored: ${error.message}`);
  }
}

if (mongoUri && !mongoUriHasPlaceholders) {
  try {
    await mongoose.connect(mongoUri, { dbName: mongoDatabaseName, serverSelectionTimeoutMS: 7000 });
    databaseReady = true;
    console.log(`Connected to MongoDB Atlas database "${mongoDatabaseName}".`);
    const bootstrapUsername = process.env.ADMIN_USERNAME?.trim().toLowerCase();
    const bootstrapPasswordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
    const bootstrapPassword = process.env.ADMIN_PASSWORD || "";
    const existingAdminCount = await AdminUser.countDocuments();

    if (existingAdminCount === 0 && bootstrapUsername && (bootstrapPasswordHash || bootstrapPassword)) {
      const validBcryptHash = /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(bootstrapPasswordHash || "");
      const passwordHash = validBcryptHash
        ? bootstrapPasswordHash
        : bootstrapPassword
          ? await bcrypt.hash(bootstrapPassword, 12)
          : "";
      if (passwordHash) {
        try {
          await AdminUser.create({ username: bootstrapUsername, passwordHash });
          console.log("Created the initial admin account in MongoDB.");
          adminAccountReady = true;
        } catch (error) {
          if (error.code !== 11000 || !(await AdminUser.exists({ username: bootstrapUsername }))) throw error;
          console.log("The initial admin account already exists in MongoDB.");
          adminAccountReady = true;
        }
      } else {
        console.warn("The admin password hash is invalid; provide a valid bcrypt hash or bootstrap password.");
      }
    } else {
      adminAccountReady = existingAdminCount > 0;
      if (!adminAccountReady) console.warn("No admin account exists; configure ADMIN_USERNAME and a bootstrap password in .env.");
    }
  } catch (error) {
    if (mongoose.connection.readyState === 1) {
      console.error(`Initial admin setup failed: ${error.message}`);
    } else {
      console.error(`MongoDB connection failed: ${error.message}`);
    }
  }
} else if (mongoUriHasPlaceholders) {
  console.error("MongoDB connection string still contains placeholder values; replace them in .env.");
}

app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(express.json({ limit: "256kb" }));
app.use(session({
  name: "jc-admin-session",
  secret: process.env.ADMIN_SESSION_SECRET || randomBytes(32).toString("hex"),
  store: databaseReady ? MongoStore.create({
    client: mongoose.connection.getClient(),
    collectionName: "admin_sessions",
    ttl: 8 * 60 * 60,
  }) : undefined,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 8 * 60 * 60 * 1000,
  },
}));

const adminConfigured = Boolean(
  databaseReady && adminAccountReady
    && (process.env.ADMIN_SESSION_SECRET?.trim().length ?? 0) >= 32
);
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please wait and try again." },
});

function requireAdmin(request, response, next) {
  if (!databaseReady) return response.status(503).json({ error: "MongoDB Atlas is not connected yet." });
  if (!adminConfigured) return response.status(503).json({ error: "Admin login is not configured on the server yet." });
  if (!request.session?.isAdmin) return response.status(401).json({ error: "Please sign in to continue." });
  return next();
}

async function getPortfolioDocument() {
  if (!databaseReady) return null;
  let document = await PortfolioContent.findOne({ key: "main" });
  if (!document) {
    document = await PortfolioContent.create({ key: "main", content: defaultPortfolioContent });
  } else if (document.content && typeof document.content === "object") {
    const normalizedContent = normalizePortfolioContent(document.content);
    if (JSON.stringify(normalizedContent) !== JSON.stringify(document.content)) {
      document.content = normalizedContent;
      await document.save();
    }
  }
  return document;
}

function normalizePortfolioContent(storedContent) {
  const content = { ...defaultPortfolioContent, ...storedContent };
  const projectSection = { ...defaultPortfolioContent.projects, ...(storedContent?.projects ?? {}) };
  projectSection.items = (Array.isArray(projectSection.items) ? projectSection.items : defaultPortfolioContent.projects.items)
    .map((project) => {
      const { imageUrl = "", ...projectFields } = project ?? {};
      const images = Array.isArray(project?.images) ? project.images.filter((url) => typeof url === "string") : imageUrl ? [imageUrl] : [];
      return { ...projectFields, images };
    });
  content.projects = projectSection;

  const skillsSection = { ...defaultPortfolioContent.skills, ...(storedContent?.skills ?? {}) };
  const defaultSkillGroups = defaultPortfolioContent.skills.groups;
  const skillGroups = Array.isArray(skillsSection.groups) ? skillsSection.groups : defaultSkillGroups;
  skillsSection.groups = skillGroups.map((group, index) => {
    const fallbackGroup = defaultSkillGroups[index] ?? { title: `Skill group ${index + 1}`, skills: [] };
    const storedGroup = group && typeof group === "object" ? group : {};
    const items = Array.isArray(storedGroup.skills) ? storedGroup.skills : fallbackGroup.skills;

    return {
      ...fallbackGroup,
      ...storedGroup,
      skills: items.map((item) => typeof item === "string"
        ? { name: item, iconUrl: "" }
        : {
          ...(item && typeof item === "object" ? item : {}),
          name: typeof item?.name === "string" ? item.name : "",
          iconUrl: typeof item?.iconUrl === "string" ? item.iconUrl : "",
        }),
    };
  });
  content.skills = skillsSection;
  return content;
}

function collectCloudinaryUrls(value, urls = new Set()) {
  if (typeof value === "string" && value.startsWith("https://res.cloudinary.com/")) urls.add(value);
  else if (Array.isArray(value)) value.forEach((entry) => collectCloudinaryUrls(entry, urls));
  else if (value && typeof value === "object") Object.values(value).forEach((entry) => collectCloudinaryUrls(entry, urls));
  return urls;
}

function getCloudinaryReferenceFromUrl(imageUrl) {
  try {
    const parsedUrl = new URL(imageUrl);
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const segments = parsedUrl.pathname.split("/").filter(Boolean).map((segment) => decodeURIComponent(segment));
    if (parsedUrl.hostname !== "res.cloudinary.com" || !cloudName || segments[0] !== cloudName) return null;
    const deliveryTypes = new Set(["upload", "private", "authenticated"]);
    const typeIndex = segments.findIndex((segment, index) => deliveryTypes.has(segment) && segments[index - 1] === "image");
    if (typeIndex < 0) return null;

    const uploadedSegments = segments.slice(typeIndex + 1);
    const versionIndex = uploadedSegments.findIndex((segment) => /^v\d+$/.test(segment));
    if (versionIndex < 0) return null;
    const publicIdSegments = uploadedSegments.slice(versionIndex + 1);
    if (!publicIdSegments.length) return null;
    const lastSegmentIndex = publicIdSegments.length - 1;
    publicIdSegments[lastSegmentIndex] = publicIdSegments[lastSegmentIndex].replace(/\.[a-z0-9]+$/i, "");
    return { publicId: publicIdSegments.join("/"), deliveryType: segments[typeIndex] };
  } catch {
    return null;
  }
}

function getManagedCloudinaryPublicId(imageUrl) {
  try {
    const parsedUrl = new URL(imageUrl);
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
    const segments = parsedUrl.pathname.split("/").filter(Boolean).map((segment) => decodeURIComponent(segment));
    if (parsedUrl.hostname !== "res.cloudinary.com" || !cloudName || segments[0] !== cloudName
      || segments[1] !== "image" || segments[2] !== "upload") return null;

    const uploadedSegments = segments.slice(3);
    const folderIndex = uploadedSegments.indexOf("jeet-portfolio");
    if (folderIndex < 0) return null;
    const publicIdSegments = uploadedSegments.slice(folderIndex);
    const lastSegmentIndex = publicIdSegments.length - 1;
    publicIdSegments[lastSegmentIndex] = publicIdSegments[lastSegmentIndex].replace(/\.[a-z0-9]+$/i, "");
    const publicId = publicIdSegments.join("/");
    return publicId.length > "jeet-portfolio/".length ? publicId : null;
  } catch {
    return null;
  }
}

function configureCloudinary() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return false;
  cloudinary.config({ cloud_name: CLOUDINARY_CLOUD_NAME, api_key: CLOUDINARY_API_KEY, api_secret: CLOUDINARY_API_SECRET });
  return true;
}

async function deleteRemovedCloudinaryImages(imageUrls) {
  const publicIds = [...new Set(imageUrls.map(getManagedCloudinaryPublicId).filter(Boolean))];
  if (!publicIds.length) return 0;
  if (!configureCloudinary()) return publicIds.length;
  const results = await Promise.allSettled(publicIds.map((publicId) =>
    cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true })
  ));
  return results.filter((result) => result.status === "rejected"
    || (result.status === "fulfilled" && !["ok", "not found"].includes(result.value?.result))).length;
}

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", service: "jeet-portfolio-api" });
});

app.get("/api/portfolio", async (_request, response) => {
  if (!databaseReady) return response.json(defaultPortfolioContent);
  try {
    const document = await getPortfolioDocument();
    return response.json(normalizePortfolioContent(document.content));
  } catch (error) {
    console.error(`Portfolio content could not be read: ${error.message}`);
    return response.json(defaultPortfolioContent);
  }
});

app.get("/api/admin/session", (request, response) => {
  response.json({
    configured: adminConfigured,
    databaseReady,
    mongoUriHasPlaceholders,
    adminAccountReady,
    bootstrapAdminConfigured: Boolean(process.env.ADMIN_USERNAME?.trim() && (process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD)),
    authenticated: Boolean(request.session?.isAdmin),
  });
});

app.post("/api/admin/login", loginLimiter, async (request, response, next) => {
  try {
    if (!adminConfigured) {
      return response.status(503).json({ error: "Configure MongoDB Atlas and admin credentials on the server first." });
    }
    const { username, password } = request.body ?? {};
    if (typeof username !== "string" || typeof password !== "string" || password.length > 200) {
      return response.status(400).json({ error: "Enter your admin ID and password." });
    }

    const adminUser = await AdminUser.findOne({ username: username.trim().toLowerCase() }).select("+passwordHash");
    const passwordMatches = adminUser ? await bcrypt.compare(password, adminUser.passwordHash) : false;
    if (!adminUser || !passwordMatches) {
      return response.status(401).json({ error: "The admin ID or password is incorrect." });
    }

    request.session.regenerate((error) => {
      if (error) return next(error);
      request.session.isAdmin = true;
      request.session.adminId = String(adminUser._id);
      request.session.save((saveError) => {
        if (saveError) return next(saveError);
        return response.json({ authenticated: true });
      });
    });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/admin/logout", requireAdmin, (request, response, next) => {
  request.session.destroy((error) => {
    if (error) return next(error);
    response.clearCookie("jc-admin-session", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    return response.status(204).end();
  });
});

app.get("/api/admin/content", requireAdmin, async (_request, response, next) => {
  try {
    const document = await getPortfolioDocument();
    return response.json({ content: normalizePortfolioContent(document.content), updatedAt: document.updatedAt });
  } catch (error) {
    return next(error);
  }
});

app.put("/api/admin/content", requireAdmin, async (request, response, next) => {
  try {
    const content = request.body?.content;
    if (!content || typeof content !== "object" || Array.isArray(content)) {
      return response.status(400).json({ error: "Portfolio content must be an object." });
    }
    const allowedSections = Object.keys(defaultPortfolioContent);
    if (Object.keys(content).some((key) => !allowedSections.includes(key))) {
      return response.status(400).json({ error: "Unknown portfolio section. Refresh the editor and try again." });
    }
    if (allowedSections.some((key) => !content[key] || typeof content[key] !== "object" || Array.isArray(content[key]))) {
      return response.status(400).json({ error: "Keep every portfolio section as an editable object." });
    }
    if (JSON.stringify(content).length > 220_000) {
      return response.status(413).json({ error: "Portfolio content is too large to save." });
    }
    if (!Array.isArray(content.projects?.items)) {
      return response.status(400).json({ error: "Projects must remain a list." });
    }
    const projectIds = content.projects.items.map((project) => project?.id);
    if (projectIds.some((id) => typeof id !== "string" || !/^[a-z0-9-]{1,60}$/i.test(id))
      || new Set(projectIds).size !== projectIds.length) {
      return response.status(400).json({ error: "Each project needs a unique ID using letters, numbers, or hyphens." });
    }

    if (content.projects.items.some((project) => !Array.isArray(project.images)
      || project.images.some((imageUrl) => typeof imageUrl !== "string" || imageUrl.length > 2048))) {
      return response.status(400).json({ error: "Each project must use a list of valid image URLs." });
    }

    const previousDocument = await getPortfolioDocument();
    const previousImages = collectCloudinaryUrls(previousDocument?.content ?? defaultPortfolioContent);
    const nextImages = collectCloudinaryUrls(content);
    const removedImages = [...previousImages].filter((imageUrl) => !nextImages.has(imageUrl));

    const document = await PortfolioContent.findOneAndUpdate(
      { key: "main" },
      { $set: { content, updatedAt: new Date() }, $setOnInsert: { key: "main" } },
      { new: true, upsert: true, runValidators: true }
    );
    const cleanupWarningCount = await deleteRemovedCloudinaryImages(removedImages);
    return response.json({ content: normalizePortfolioContent(document.content), updatedAt: document.updatedAt, cleanupWarningCount });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/admin/cloudinary/assets", requireAdmin, async (request, response, next) => {
  try {
    if (!configureCloudinary()) {
      return response.status(503).json({ error: "Cloudinary is not configured on the server." });
    }

    const requestedLimit = Number.parseInt(request.query.limit, 10);
    const maxResults = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, requestedLimit)) : 36;
    const deliveryTypes = ["upload", "private", "authenticated"];
    let cursors = {};
    if (typeof request.query.cursor === "string" && request.query.cursor) {
      if (request.query.cursor.length > 4096) return response.status(400).json({ error: "Image page cursor is too long." });
      try {
        cursors = JSON.parse(request.query.cursor);
      } catch {
        return response.status(400).json({ error: "Image page cursor is invalid." });
      }
      if (!cursors || typeof cursors !== "object" || Array.isArray(cursors)
        || Object.keys(cursors).some((key) => !deliveryTypes.includes(key)
          || (cursors[key] !== "__done__" && typeof cursors[key] !== "string"))) {
        return response.status(400).json({ error: "Image page cursor is invalid." });
      }
    }

    const pages = await Promise.all(deliveryTypes.map(async (deliveryType) => {
      if (cursors[deliveryType] === "__done__") {
        return { deliveryType, resources: [], total_count: 0, next_cursor: "" };
      }
      const options = { resource_type: "image", type: deliveryType, max_results: maxResults };
      if (typeof cursors[deliveryType] === "string" && cursors[deliveryType]) {
        options.next_cursor = cursors[deliveryType];
      }
      return { ...(await cloudinary.api.resources(options)), deliveryType };
    }));
    const nextCursors = Object.fromEntries(pages.map((page) => [page.deliveryType, page.next_cursor || "__done__"]));
    const hasMore = Object.values(nextCursors).some((cursor) => cursor !== "__done__");
    const assets = pages.flatMap((page) => (page.resources ?? []).map((asset) => ({
      publicId: asset.public_id,
      url: asset.secure_url,
      folder: asset.asset_folder || asset.folder || "Root",
      deliveryType: page.deliveryType,
      format: asset.format,
      bytes: asset.bytes,
      width: asset.width,
      height: asset.height,
      createdAt: asset.created_at,
    })));
    const isFirstPage = !request.query.cursor;
    return response.json({
      assets,
      nextCursor: hasMore ? JSON.stringify(nextCursors) : "",
      totalCount: isFirstPage ? pages.reduce((total, page) => total + (page.total_count ?? 0), 0) : null,
    });
  } catch (error) {
    return next(error);
  }
});

app.delete("/api/admin/cloudinary/assets", requireAdmin, async (request, response, next) => {
  try {
    if (!configureCloudinary()) {
      return response.status(503).json({ error: "Cloudinary is not configured on the server." });
    }

    const publicId = request.body?.publicId;
    const deliveryType = request.body?.deliveryType;
    const allowedDeliveryTypes = ["upload", "private", "authenticated"];
    const invalidPublicId = typeof publicId !== "string"
      || publicId.length > 255
      || !publicId.trim()
      || !allowedDeliveryTypes.includes(deliveryType)
      || publicId.split("/").some((part) => !part || part === "." || part === "..")
      || /[\\\u0000-\u001f]/.test(publicId);
    if (invalidPublicId) {
      return response.status(400).json({ error: "Choose an image from the Cloudinary media library." });
    }

    const asset = await cloudinary.api.resource(publicId, { resource_type: "image", type: deliveryType });
    if (asset.public_id !== publicId || asset.resource_type !== "image" || asset.type !== deliveryType) {
      return response.status(404).json({ error: "That Cloudinary image could not be found." });
    }

    const portfolioDocument = await getPortfolioDocument();
    const affectedUrls = [...collectCloudinaryUrls(portfolioDocument?.content ?? {})]
      .filter((imageUrl) => {
        const reference = getCloudinaryReferenceFromUrl(imageUrl);
        return reference?.publicId === publicId && reference.deliveryType === deliveryType;
      });

    const deletion = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      type: deliveryType,
      invalidate: true,
    });
    if (deletion.result !== "ok" && deletion.result !== "not found") {
      return response.status(502).json({ error: "Cloudinary did not confirm the image deletion. Refresh the library and try again." });
    }

    return response.json({ deleted: true, publicId, url: asset.secure_url ?? "", affectedUrls });
  } catch (error) {
    return next(error);
  }
});

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      const error = new Error("Choose a JPG, PNG, WebP, or GIF image.");
      error.statusCode = 400;
      return callback(error);
    }
    return callback(null, true);
  },
});

app.post("/api/admin/upload", requireAdmin, imageUpload.single("image"), async (request, response, next) => {
  try {
    if (!configureCloudinary()) {
      return response.status(503).json({ error: "Image storage is not configured. Add the Cloudinary settings to the server." });
    }
    if (!request.file) return response.status(400).json({ error: "Choose an image to upload." });

    const imageUrl = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({
        folder: "jeet-portfolio",
        resource_type: "image",
        transformation: [{ width: 1800, height: 1200, crop: "limit", quality: "auto", fetch_format: "auto" }],
      }, (error, result) => error ? reject(error) : resolve(result.secure_url));
      stream.end(request.file.buffer);
    });
    return response.json({ url: imageUrl });
  } catch (error) {
    return next(error);
  }
});

app.post("/api/contact", async (request, response) => {
  const { name, email, message } = request.body ?? {};
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanEmail = typeof email === "string" ? email.trim() : "";
  const cleanMessage = typeof message === "string" ? message.trim() : "";

  if (!cleanName || !cleanEmail || !cleanMessage) {
    return response.status(400).json({ error: "Please fill in your name, email, and message." });
  }
  if (cleanName.length > 100 || cleanEmail.length > 254 || cleanMessage.length > 5000) {
    return response.status(400).json({ error: "One of the fields is too long." });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return response.status(400).json({ error: "Please enter a valid email address." });
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_TO } = process.env;
  const normalizedSmtpPort = Number.parseInt(SMTP_PORT ?? "587", 10);
  const safeSmtpPort = Number.isInteger(normalizedSmtpPort) && normalizedSmtpPort > 0 && normalizedSmtpPort <= 65535
    ? normalizedSmtpPort
    : 587;
  const cleanContactTo = typeof CONTACT_TO === "string" ? CONTACT_TO.trim() : "";

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !cleanContactTo) {
    return response.status(503).json({ error: "The contact form is not configured yet. Please email Jeet directly." });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: safeSmtpPort,
      secure: safeSmtpPort === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transporter.sendMail({
      from: SMTP_USER,
      to: cleanContactTo,
      replyTo: { name: cleanName, address: cleanEmail },
      subject: `Portfolio message from ${cleanName}`,
      text: `From: ${cleanName} <${cleanEmail}>\n\n${cleanMessage}`,
    });
    return response.status(200).json({ message: "Thanks for reaching out. Your message has been sent." });
  } catch (error) {
    console.error("Contact email delivery failed:", error.message);
    return response.status(502).json({ error: "Your message could not be sent right now. Please email Jeet directly." });
  }
});

function getSiteOrigin(request) {
  const configuredUrl = process.env.SITE_URL?.trim();
  if (configuredUrl) {
    try {
      return new URL(configuredUrl).origin;
    } catch {
      console.warn("Ignoring invalid SITE_URL; using the request host for SEO routes.");
    }
  }
  return `${request.protocol}://${request.get("host")}`;
}

app.get("/robots.txt", (request, response) => {
  const origin = getSiteOrigin(request);
  response
    .type("text/plain")
    .set("Cache-Control", "public, max-age=3600")
    .send(`User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /adJC\nDisallow: /adJC/\nDisallow: /adminportalofjc\nDisallow: /adminportalofjc/\n\nSitemap: ${origin}/sitemap.xml\n`);
});

app.get("/sitemap.xml", (request, response) => {
  const origin = getSiteOrigin(request);
  const safeOrigin = origin.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  response
    .type("application/xml")
    .set("Cache-Control", "public, max-age=3600")
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${safeOrigin}/</loc></url></urlset>`);
});

app.use((error, _request, response, _next) => {
  const statusCode = error instanceof multer.MulterError ? 400 : Number(error.statusCode) || 500;
  const message = statusCode < 500 ? error.message : "The server could not complete that request.";
  if (statusCode >= 500) console.error("API request failed:", error.message);
  if (response.headersSent) return;
  return response.status(statusCode).json({ error: message });
});

const staticRoot = path.join(projectRoot, "dist");
const indexPath = path.join(staticRoot, "index.html");

function escapeAttribute(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

async function sendPortfolioPage(request, response) {
  try {
    const origin = escapeAttribute(getSiteOrigin(request));
    const canonical = `${origin}/`;
    const html = await readFile(indexPath, "utf8");
    let page = html.replace(
      "<!-- SEO_ORIGIN_LINKS -->",
      `<link rel="canonical" href="${canonical}" /><meta property="og:url" content="${canonical}" />`
    );
    let seo = defaultPortfolioContent.seo;
    if (databaseReady) {
      try {
        const document = await getPortfolioDocument();
        seo = { ...seo, ...(document?.content?.seo ?? {}) };
      } catch (error) {
        console.error(`SEO content could not be read: ${error.message}`);
      }
    }
    const title = escapeAttribute(String(seo.title || defaultPortfolioContent.seo.title));
    const description = escapeAttribute(String(seo.description || defaultPortfolioContent.seo.description));
    const keywords = escapeAttribute(String(seo.keywords || defaultPortfolioContent.seo.keywords));
    const socialImage = escapeAttribute(String(seo.socialImage || ""));
    page = page
      .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
      .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${description}" />`)
      .replace(/<meta name="keywords" content="[^"]*"\s*\/>/, `<meta name="keywords" content="${keywords}" />`)
      .replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${title}" />`)
      .replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${description}" />`)
      .replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${title}" />`)
      .replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${description}" />`);
    if (socialImage) {
      page = page.replace(
        "<meta property=\"og:locale\" content=\"en_IN\" />",
        `<meta property="og:image" content="${socialImage}" /><meta name="twitter:image" content="${socialImage}" /><meta property="og:locale" content="en_IN" />`
      );
    }
    response.set("Cache-Control", "no-cache").type("html").send(page);
  } catch {
    response.status(404).send("Build the React app with npm run build first.");
  }
}

app.get("/", sendPortfolioPage);
app.get("/adJC", (_request, response) => response.redirect(308, "/adminportalofjc"));
app.use(
  express.static(staticRoot, {
    maxAge: "1d",
    setHeaders: (res, filePath) => {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  })
);
app.get(/.*/, sendPortfolioPage);

app.listen(port, "0.0.0.0", () => {
  console.log(`Portfolio server listening on http://localhost:${port}`);
});
