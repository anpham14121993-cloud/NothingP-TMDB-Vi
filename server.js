import http from 'node:http';
import { Readable } from 'node:stream';
import worker from './worker.js';

const PORT = Number(process.env.PORT || 7000);

const server = http.createServer(async (req, res) => {
  try {
    const host = req.headers.host || `localhost:${PORT}`;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const request = new Request(`${protocol}://${host}${req.url || '/'}`, {
      method: req.method,
      headers: req.headers
    });
    const response = await worker.fetch(request, process.env || {});
    res.statusCode = response.status;
    for (const [key, value] of response.headers.entries()) {
      res.setHeader(key, value);
    }
    if (response.body) {
      Readable.fromWeb(response.body).pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: String(err?.message || err) }));
  }
});

server.listen(PORT, () => {
  console.log(`NothingP • TMDB Tiếng Việt running at http://localhost:${PORT}/manifest.json`);
});

export default server;
