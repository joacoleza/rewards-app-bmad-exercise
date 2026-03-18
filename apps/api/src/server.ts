import './load-env.js'; // must be first — loads .env before any module reads process.env
import { buildApp } from './app.js';

const HOST = '0.0.0.0';
const PORT = Number(process.env.PORT) || 3001;

async function start() {
  const app = buildApp();

  try {
    await app.listen({ host: HOST, port: PORT });
    app.log.info(`Server listening on http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
