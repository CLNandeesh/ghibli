import "dotenv/config";
import express from "express";
import multer from "multer";
import OpenAI from "openai";
import { toFile } from "openai/uploads";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const MODEL = process.env.IMAGE_MODEL || "gpt-image-2.6-flare";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Please upload a PNG, JPG, or WEBP image."));
    }
    cb(null, true);
  }
});

app.use(express.json({ limit: "1mb" }));

function buildPrompt(body) {
  const count = Math.min(Math.max(Number(body.characterCount) || 1, 1), 6);
  const details = String(body.characterDetails || "").trim();
  const scene = String(body.scene || "").trim();
  const background = String(body.background || "A peaceful countryside").trim();
  const mood = "warm, magical golden-hour light with soft painterly colours";

  return [
    "Create one polished, original illustration in a whimsical, hand-painted Japanese animated fantasy aesthetic.",
    "Use soft painterly textures, expressive appealing characters, delicate linework, lush detailed backgrounds, warm natural lighting, gentle colour gradients, and a cinematic composition.",
    "The result should feel like a beautiful frame from a hand-drawn animated fantasy film. Do not include captions, lettering, watermarks, borders, or UI.",
    `Number of characters: ${count}.`,
    details ? `Character names, appearance and clothing (keep each character distinct; do not write names as text in the image): ${details}.` : "",
    `Scene/action: ${scene}.`,
    `Setting/background: ${background}.`,
    `Mood and lighting: ${mood}.`,
    "Keep all requested characters visible and visually distinct. Compose the scene naturally and avoid duplicated people or extra limbs."
  ].filter(Boolean).join("\n");
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, model: MODEL, apiKeyConfigured: Boolean(process.env.OPENAI_API_KEY) });
});

app.post("/api/generate", upload.single("referenceImage"), async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "The server API key is not configured. Add OPENAI_API_KEY to your environment variables." });
    }

    const scene = String(req.body.scene || "").trim();
    if (!scene) {
      return res.status(400).json({ error: "Please describe the scene you want to create." });
    }

    const prompt = buildPrompt(req.body);
    const sizeMap = {
      portrait: "1024x1536",
      landscape: "1536x1024",
      square: "1024x1024"
    };
    const size = sizeMap[req.body.orientation] || sizeMap.portrait;
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    let result;
    if (req.file) {
      const imageFile = await toFile(req.file.buffer, req.file.originalname || "reference-image.png", {
        type: req.file.mimetype
      });
      result = await client.images.edit({
        model: MODEL,
        image: imageFile,
        prompt: `${prompt}\nTransform the uploaded reference photo into this illustrated aesthetic. Preserve the people’s recognizable general appearance, pose, and important clothing details as closely as possible while rendering them as illustrated characters.`,
        size,
        quality: "high",
        output_format: "png"
      });
    } else {
      result = await client.images.generate({
        model: MODEL,
        prompt,
        size,
        quality: "high",
        output_format: "png",
        n: 1
      });
    }

    const imageBase64 = result.data?.[0]?.b64_json;
    if (!imageBase64) {
      return res.status(502).json({ error: "The image service returned no image. Please try again." });
    }

    res.json({
      image: `data:image/png;base64,${imageBase64}`,
      promptUsed: prompt,
      model: MODEL
    });
  } catch (error) {
    console.error("Image generation error:", {
      status: error.status,
      code: error.code,
      type: error.type,
      message: error.message,
      request_id: error.request_id
    });

    const status = Number(error.status) || 500;
    let message = error.message || "Image generation failed.";
    if (status === 401) message = "OpenAI rejected the server API key. Check the OPENAI_API_KEY variable in Railway or your local .env file.";
    if (status === 403) message = "The API project may not have permission to use this image model. Check project access and organization verification.";
    if (status === 429) message = "The image API quota or rate limit was reached. Check API billing and usage.";
    res.status(status).json({ error: message, code: error.code || null });
  }
});

app.use(express.static(path.join(projectRoot, "dist")));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(projectRoot, "dist", "index.html"));
});

app.use((error, _req, res, _next) => {
  console.error("Request error:", error.message);
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "The reference image must be 10 MB or smaller." });
  }
  res.status(400).json({ error: error.message || "Invalid request." });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Ghibli Studio server listening on port ${PORT}`);
});
