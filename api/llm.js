/**
 * /api/llm — Gemini LLM proxy
 * Used for: translation (Translate it), Polish practice check, Q&A assistant.
 * Keeps GEMINI_API_KEY server-side; returns { text } to client.
 */
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

    const { prompt, systemInstruction } = req.body ?? {};
    if (!prompt?.trim()) return res.status(400).json({ error: 'prompt is required' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        ...(systemInstruction && {
            systemInstruction: { parts: [{ text: systemInstruction }] }
        })
    };

    try {
        const upstream = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await upstream.json();
        if (!upstream.ok) return res.status(upstream.status).json(data);

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        return res.status(200).json({ text });

    } catch (err) {
        return res.status(502).json({ error: `Upstream error: ${err.message}` });
    }
}
