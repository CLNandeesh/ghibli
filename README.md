# Ghibli Studio AI

A React + Node.js application for generating whimsical, hand-painted animated-fantasy illustrations from text prompts, with optional photo-to-illustration editing.

## Requirements
- Node.js 20+
- An OpenAI API key with access to GPT Image models and API billing enabled

## 1. Install
```bash
npm install
```

## 2. Configure your API key
Copy `.env.example` to `.env`:

Windows CMD:
```cmd
copy .env.example .env
```

Open `.env` and set your key:
```env
OPENAI_API_KEY=your_new_api_key
IMAGE_MODEL=gpt-image-2.6-flare
PORT=3001
```

Never commit `.env` to GitHub. The `.gitignore` in this project already excludes it. If a key was previously exposed, revoke it and create a replacement.

## 3. Run locally
```bash
npm run dev
```
Open http://localhost:5173

## 4. Production / Railway
This project is configured to run as one Railway service:
- Build command: `npm run build`
- Start command: `npm start`
- Add `OPENAI_API_KEY` and `IMAGE_MODEL` in Railway → Service → Variables.
- Do not set `PORT` manually on Railway; Railway provides it.
- Generate a public domain in Railway → Settings → Networking.

The server serves the built React app from `dist` and exposes `/api/generate`.

## Features
- Text-to-image generation
- Optional reference-photo transformation
- Four simple required inputs: character count, character names/appearance, scene description, and background
- Optional reference-photo upload as the fifth input
- Automatic portrait layout and warm, magical lighting
- PNG download
- API key remains on the server; it is never sent to the browser

## Notes
- Image generation uses the OpenAI Images API with `gpt-image-2.6-flare` by default. Change `IMAGE_MODEL` if your API project uses a different supported GPT Image model.
- The visual prompt asks for an original whimsical, hand-painted Japanese animated-fantasy aesthetic. It does not reproduce any specific copyrighted character or existing film frame.
- Image generation consumes API usage and may take some time.
