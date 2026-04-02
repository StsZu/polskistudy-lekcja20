/**
 * /api/tts — Gemini TTS proxy
 * Keeps GEMINI_API_KEY server-side; returns raw Gemini response to client.
 * Client does PCM→WAV conversion in the browser.
 */
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

    const { text, voiceName = 'Aoede' } = req.body ?? {};
    if (!text?.trim()) return res.status(400).json({ error: 'text is required' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

    try {
        const upstream = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text }] }],
                generationConfig: {
                    responseModalities: ['AUDIO'],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName } }
                    }
                }
            })
        });

        const data = await upstream.json();
        if (!upstream.ok) return res.status(upstream.status).json(data);
        return res.status(200).json(data);

    } catch (err) {
        return res.status(502).json({ error: `Upstream error: ${err.message}` });
    }
}
