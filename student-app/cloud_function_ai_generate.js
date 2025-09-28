// Firebase Cloud Function (HTTP) example for secure AI quiz generation
// Rename to index.js inside functions directory of a Firebase project and adjust exports.
// Requires: npm i openai firebase-admin firebase-functions
// Environment: set OPENAI_API_KEY via Firebase Functions config (firebase functions:config:set openai.key="YOUR_KEY")
// Access Control: Validates Firebase ID token from Authorization: Bearer <token>

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { OpenAI } = require('openai');

admin.initializeApp();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || functions.config().openai?.key });

exports.generateQuiz = functions.region('asia-south1').https.onRequest(async (req, res) => {
  // CORS (basic)
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'missing_auth' });
    }
    const idToken = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch (e) {
      return res.status(401).json({ error: 'invalid_token' });
    }

    const { count = 5, topics = [], difficulty = 'mixed', locale = 'en-IN' } = req.body || {};
    const cappedCount = Math.min(Math.max(parseInt(count, 10) || 5, 1), 25);

    const topicPhrase = topics.length ? topics.join(', ') : 'general emergency preparedness';

    const prompt = `Generate ${cappedCount} diverse safety preparedness quiz questions for students in India (locale ${locale}).
Topics focus: ${topicPhrase}.
Return JSON ONLY with array "questions". Each item fields:
- id (string, unique)
- question (concise, clear)
- options (4 plausible choices, array of strings)
- correctAnswer (index 0-3)
- explanation (short justification)
- topic (single word or short phrase)
- difficulty (easy|medium|hard)
Ensure factual accuracy; avoid sensitive or traumatic content. Difficulty distribution: if 'mixed', balance 40% easy, 40% medium, 20% hard.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an expert emergency preparedness educator generating safe quiz content.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 1200
    });

    const raw = completion.choices?.[0]?.message?.content?.trim();
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return res.status(500).json({ error: 'parse_error', raw });
    }
    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      return res.status(500).json({ error: 'invalid_structure', raw });
    }

    // Basic sanitation
    const sanitized = parsed.questions.slice(0, cappedCount).map(q => ({
      id: q.id || 'q_' + Math.random().toString(36).slice(2),
      question: String(q.question).slice(0, 240),
      options: Array.isArray(q.options) ? q.options.slice(0,4).map(o => String(o).slice(0,120)) : [],
      correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
      explanation: String(q.explanation || '').slice(0, 280),
      topic: (q.topic || 'General').slice(0,40),
      difficulty: ['easy','medium','hard'].includes(q.difficulty) ? q.difficulty : 'medium'
    })).filter(q => q.options.length === 4);

    return res.json({ questions: sanitized, source: 'openai', uid: decoded.uid });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'server_error', message: err.message });
  }
});
