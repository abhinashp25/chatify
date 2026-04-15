const GEMINI_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";

function systemPrompt() {
  const now = new Date();
  const date = now.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" });
  return `You are Chatify AI, a friendly smart assistant built into a real-time chat app called Chatify.
Today is ${date}. Current time is approximately ${time}.
You were built by the Chatify development team.
Help users with: answering questions, writing messages, coding help, advice, and anything they ask.
Keep replies concise, warm, and conversational. Use plain text only — no markdown headers or bullet spam.`;
}

async function callGemini(apiKey, contents, generationConfig = {}) {
  const resp = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: { maxOutputTokens: 1024, temperature: 0.75, ...generationConfig },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
      ],
    }),
  });
  const data = await resp.json();
  if (!resp.ok) throw Object.assign(new Error("Gemini error"), { status: resp.status, data });
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ── Multi-turn AI chat ────────────────────────────────────────────────────

export const sendAIMessage = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || !messages.length)
      return res.status(400).json({ message: "Messages array required." });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
      return res.status(500).json({ message: "Add GEMINI_API_KEY to your .env. Get a free key at https://aistudio.google.com/app/apikey" });

    const contents = [
      { role: "user", parts: [{ text: `[System: ${systemPrompt()}]\n\nUser says: ${messages[0].content}` }] },
      ...messages.slice(1).map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    ];

    const text = await callGemini(apiKey, messages.length === 1 ? contents.slice(0, 1) : contents);
    res.json({ reply: text.trim() });
  } catch (e) {
    console.error("sendAIMessage:", e.message);
    if (e.status === 403) return res.status(403).json({ message: "Invalid GEMINI_API_KEY." });
    if (e.status === 429) return res.status(429).json({ message: "Rate limit. Try again shortly." });
    res.status(500).json({ message: "Server error talking to AI." });
  }
};

// ── Smart quick-reply suggestions ─────────────────────────────────────────

export const getSmartReplies = async (req, res) => {
  try {
    const { lastMessage } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.json({ suggestions: ["👍 Got it!", "Thanks!", "Sure!", "On my way!"] });

    const text = await callGemini(apiKey, [{
      role: "user",
      parts: [{ text:
        `Give 4 short quick-reply suggestions for this message: "${lastMessage}"\n` +
        `Rules: each under 25 characters, casual friendly tone.\n` +
        `Return ONLY a JSON array like: ["Sure!", "On my way!", "Thanks!", "👍"]\nJSON:`
      }]
    }], { maxOutputTokens: 80, temperature: 0.9 });

    let suggestions = ["👍", "Thanks!", "Sure!", "Got it!"];
    try {
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      if (Array.isArray(parsed)) suggestions = parsed.slice(0, 4);
    } catch { /* use defaults */ }

    res.json({ suggestions });
  } catch {
    res.json({ suggestions: ["👍", "Thanks!", "Sure!", "Got it!"] });
  }
};

// ── Tone Advisor ──────────────────────────────────────────────────────────

export const analyzeTone = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim() || text.length < 12)
      return res.json({ score: "neutral", suggestion: null });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.json({ score: "neutral", suggestion: null });

    const raw = await callGemini(apiKey, [{
      role: "user",
      parts: [{ text:
        `You are a communication tone analyzer.\n` +
        `Rate the tone of this message: "${text}"\n` +
        `Respond with ONLY valid JSON, no markdown:\n` +
        `{"score":"warm"|"neutral"|"cold"|"aggressive","suggestion":"one short improvement tip or null"}\n` +
        `Definitions: warm=friendly/kind, neutral=professional/flat, cold=distant/abrupt, aggressive=harsh/rude\n` +
        `JSON:`
      }]
    }], { maxOutputTokens: 100, temperature: 0.2 });

    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    res.json({ score: parsed.score || "neutral", suggestion: parsed.suggestion || null });
  } catch {
    res.json({ score: "neutral", suggestion: null });
  }
};

// ── Conversation Digest (real AI, not keyword extraction) ─────────────────

export const generateDigest = async (req, res) => {
  try {
    const { messages, contactName, isGroup } = req.body;
    if (!Array.isArray(messages) || messages.length < 5)
      return res.json({ summary: null, actions: [], topics: [] });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
      return res.json({ summary: "Configure GEMINI_API_KEY to enable AI summaries.", actions: [], topics: [] });

    const transcript = messages
      .filter(m => m.text && !m.isDeletedForAll)
      .slice(-50)
      .map(m => `${m.senderName || "User"}: ${m.text}`)
      .join("\n");

    const context = isGroup
      ? `group chat called "${contactName}"`
      : `conversation with ${contactName}`;

    const raw = await callGemini(apiKey, [{
      role: "user",
      parts: [{ text:
        `Summarize this ${context} briefly and clearly.\n\nChat:\n${transcript}\n\n` +
        `Respond ONLY with valid JSON, no markdown:\n` +
        `{"summary":"2-3 sentence summary","actions":["task or decision 1"],"topics":["theme 1","theme 2"]}\n` +
        `actions = concrete decisions or tasks mentioned (max 3). topics = key themes (max 4).\nJSON:`
      }]
    }], { maxOutputTokens: 300, temperature: 0.4 });

    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    res.json({
      summary: parsed.summary || null,
      actions: parsed.actions || [],
      topics:  parsed.topics  || [],
    });
  } catch (e) {
    console.error("digest error:", e.message);
    res.json({ summary: null, actions: [], topics: [] });
  }
};

// ── In-message Translation ────────────────────────────────────────────────

export const translateMessage = async (req, res) => {
  try {
    const { text, targetLang = "English" } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Text required." });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ message: "AI not configured." });

    const translation = await callGemini(apiKey, [{
      role: "user",
      parts: [{ text: `Translate this to ${targetLang}. Return ONLY the translated text, nothing else:\n"${text}"` }]
    }], { maxOutputTokens: 300, temperature: 0.1 });

    res.json({ translation: translation.trim() });
  } catch (e) {
    console.error("translate error:", e.message);
    res.json({ translation: req.body.text });
  }
};
