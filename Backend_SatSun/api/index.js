import app from "../app.js";

// Wrap the Express app in a default handler for Vercel's Node runtime
export default function handler(req, res) {
	return app(req, res);
}
