import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import router from './routes/index.js';
import { supabase } from './db/supabaseClient.js';

// Load env and validate required vars
const { SUPABASE_URL, SUPABASE_KEY, PORT = 3000 } = process.env;
if (!SUPABASE_URL || !SUPABASE_KEY) {
	console.error('Missing SUPABASE_URL or SUPABASE_KEY in environment.');
	process.exit(1);
}

// Create Express app
const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({
  verify: (req, _res, buf) => { req.rawBody = buf.toString(); }
}));
app.use(cookieParser());
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    console.error('JSON parse error:', err.message, 'raw:', req.rawBody);
    return res.status(400).json({ error: 'Invalid JSON', detail: err.message });
  }
  next(err);
});
// Basic routes
app.get('/', (_req, res) => {
	res.json({ status: 'ok', message: 'Backend_SatSun server is running.' });
});

app.get('/api/health', async (_req, res) => {
	try {
		// Lightweight sanity: attempt an auth call that doesn't require a session
		// We won't expose details; success here just means client is constructed.
		const projectRef = new URL(SUPABASE_URL).host.split('.')[0];
		return res.json({ ok: true, supabase: { projectRef }, port: Number(PORT) });
	} catch (err) {
		return res.status(500).json({ ok: false, error: 'Health check failed' });
	}
});

// Expose the supabase client if needed elsewhere
export { supabase };

// API routes
app.use('/api', router);

// Start server
app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});

