import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post('/api/plan', async (req, res) => {
    try {
      const { brainDump } = req.body;
      if (!brainDump) {
        return res.status(400).json({ error: 'Brain dump is required.' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are "HustleSync Planner," a Productivity Coach and Time Management Expert who is highly empathetic, structured, and intelligent. You deeply understand how busy student life can be, balancing academic performance with professional career preparation.

Your main goal is to transform the user's "brain dump" (a confusing pile of random tasks) into a structured and easy-to-execute action plan. 

Analyze the following brain dump. Perform semantic analysis to identify deep work vs. shallow work.
Do not use generic JSON, use rich Markdown to format the output. Be sure to use checkboxes using markdown format (e.g. - [ ]).
Use a supportive, calming, cheerful, and highly organized tone. Act like a mentor patting the student's shoulder and saying, "Relax, we'll tackle this one step at a time." Give small words of appreciation for their effort.

Your response MUST include the following sections exactly formatted using Markdown headers:

### 🎉 You've Got This!
(A short, encouraging message from the coach)

### ⚖️ Priority Scale
(Which tasks are Urgent & Important. Group them nicely.)

### 🧩 Task Breakdown
(Split big tasks like "Build Portfolio" into 3-4 smaller steps that can be completed in 30 minutes. Use checkboxes: - [ ] Task name)

### 🗓️ Daily Schedule
(A neat Daily Schedule Table with columns: Time, Activity, Focus/Break. Include emojis like 🎯 for targets, ⏳ for time, 💼 for career/internship tasks, 🧠 for deep work, ☕ for breaks. Ensure realistic time blocks and rest breaks.)

Here is the user's brain dump:
"""
${brainDump}
"""`,
      });

      res.json({ result: response.text });
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      res.status(500).json({ error: 'Failed to generate plan.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
