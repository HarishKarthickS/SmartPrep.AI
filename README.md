# SmartPrep.AI

Local-first study workspace in the browser. You bring your own [OpenRouter](https://openrouter.ai/keys) API key; the app does not bundle GPT-4o or any paid model. Chat, tools, notes, and a small library board persist with Zustand and Dexie on the device. OpenRouter calls go through a Next.js route so the key is not sent from the browser to OpenRouter directly.

## What it does

- Chat against models your OpenRouter account can actually use (list comes from OpenRouter, not a fixed GPT-4o / Claude / Gemini set)
- Tools hub: prompt templates (“masks”) you create or edit
- Notes board and a library board for local materials
- Optional PDF / artifact viewing (pdf.js, Sandpack) and on-device helpers (`@huggingface/transformers`) when those features are used
- Theme and default model in settings; first-run onboarding asks for the OpenRouter key

There is no hosted “Premium AI Studio,” no included model subscription, and no cloud account for your notes.

## Stack

Next.js 16 (App Router), React 19, Tailwind CSS v4, Zustand, Dexie, Framer Motion, Lucide.

Install with **npm** (`package-lock.json`). Do not mix pnpm.

```bash
git clone https://github.com/HarishKarthickS/SmartPrep.AI.git
cd SmartPrep.AI
npm install
npm run dev
```

Open http://localhost:3000, paste an OpenRouter key, pick a model from the list returned for that key.

## License

MIT. Contact: harish.s@kalvium.community
