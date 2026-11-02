// A small static server for the exported site, used by the browser checks.
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve("out");
const port = Number(process.env.PORT || 8732);
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2", ".txt": "text/plain", ".json": "application/json", ".wasm": "application/wasm" };

export function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((request, response) => {
      let file = path.join(root, decodeURIComponent(request.url.split("?")[0]));
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
      if (!fs.existsSync(file)) file = path.join(root, "404.html");
      const missing = !fs.existsSync(file);
      response.writeHead(missing || file.endsWith("404.html") ? 404 : 200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
      if (missing) response.end();
      else fs.createReadStream(file).pipe(response);
    });
    server.listen(port, "127.0.0.1", 511, () => resolve({ server, base: `http://127.0.0.1:${port}` }));
  });
}

// A chapter opens once the one before it is read. Checks about reading, not about that lock, start with the whole course open.
// It only fills in progress that is not there yet, so a check can still write its own.
export async function openCourse(context) {
  const read = fs.readdirSync(path.join(root, "topics"));
  await context.addInitScript((ids) => {
    const key = "study:systems-programming";
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ solved: [], read: ids }));
  }, read);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await startServer();
