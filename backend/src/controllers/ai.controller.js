
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent";

const SYSTEM_PROMPT = `You are Chatify AI, a friendly smart assistant inside a messaging app.
Help users with: answering questions, writing messages, coding help, advice, and anything they ask.
Keep replies concise and conversational. Use plain text, no heavy markdown.`;

export const sendAIMessage = async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0)
      return res.status(400).json({ message: "Messages array is required." });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey)
      return res.status(500).json({
        message: "Add GEMINI_API_KEY to your backend .env file. Get free key at: https://aistudio.google.com/app/apikey",
      });

    // Gemini uses "user"/"model" roles
    // Prepend system as first user message for compatibility
    const contents = [
      { role: "user", parts: [{ text: `[System: ${SYSTEM_PROMPT}]\n\nUser says: ${messages[0].content}` }] },
      ...messages.slice(1).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    ];

    const finalContents = messages.length === 1 ? contents.slice(0, 1) : contents;

    const resp = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: finalContents,
        generationConfig: { maxOutputTokens: 1024, temperature: 0.75 },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
        ],
      }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      console.error("Gemini error:", resp.status, err);
      if (resp.status === 403)
        return res.status(403).json({ message: "Invalid GEMINI_API_KEY. Get a free key at https://aistudio.google.com/app/apikey" });
      if (resp.status === 429)
        return res.status(429).json({ message: "Rate limit reached. Try again in a moment." });
      return res.status(resp.status).json({ message: err?.error?.message || "AI API error" });
    }

    const data = await resp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      || data?.candidates?.[0]?.output
      || "I couldn't generate a response. Please try again.";

    res.json({ reply: text.trim() });
  } catch (e) {
    console.error("AI error:", e.message);
    res.status(500).json({ message: "Server error talking to AI." });
  }
};

export const getSmartReplies = async (req, res) => {
  try {
    const { lastMessage } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.json({ suggestions: ["👍 Got it!", "Thanks!", "Sure!", "On my way!"] });

    const resp = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: `Give 4 short quick-reply suggestions for: "${lastMessage}"\nRules: each under 25 chars, casual tone.\nReturn ONLY a JSON array like: ["Sure!", "On my way!", "Thanks!", "👍"]\nJSON:` }]
        }],
        generationConfig: { maxOutputTokens: 80, temperature: 0.9 },
      }),
    });

    const data = await resp.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let suggestions = ["👍", "Thanks!", "Sure!", "Got it!"];
    try {
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed)) suggestions = parsed.slice(0, 4);
    } catch { /* use defaults */ }

    res.json({ suggestions });
  } catch {
    res.json({ suggestions: ["👍", "Thanks!", "Sure!", "Got it!"] });
  }
};
