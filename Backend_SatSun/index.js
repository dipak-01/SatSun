import 'dotenv/config';
import app from "./app.js";

const { PORT = 3000 } = process.env;
app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});

