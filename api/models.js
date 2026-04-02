/** Temporary: list available Gemini models for this API key */
export default async function handler(req, res) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'no key' });
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=50`);
    const data = await r.json();
    const names = (data.models || [])
        .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map(m => m.name)
        .sort();
    return res.status(200).json({ models: names });
}
