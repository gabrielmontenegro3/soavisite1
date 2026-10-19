const fs = require("fs");
const http = require("http");
const path = require("path");

const root = __dirname;
const port = Number(process.env.PORT) || 5173;

const bundledFiles = [
  path.join(root, "index.html"),
  path.join(root, "pagamento.html"),
  path.join(root, "css/styles.css"),
  path.join(root, "js/app.js"),
  path.join(root, "js/catalog.js"),
  path.join(root, "js/pagamento.js"),
  path.join(root, "joia/hero.jpg"),
  path.join(root, "joia/anel-essenza.jpg"),
  path.join(root, "joia/brinco-lumi.jpg"),
  path.join(root, "joia/pulseira-serena.jpg"),
  path.join(root, "joia/joia1.jpg"),
  path.join(root, "joia/logo.webp"),
  path.join(root, "joia/favicon.png"),
];
bundledFiles.forEach((file) => fs.readFileSync(file));

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, "http://127.0.0.1");
  let pathname = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, "");
  if (pathname === "" || pathname.endsWith("/")) pathname += "index.html";

  const file = path.normalize(path.join(root, pathname));
  const relative = path.relative(root, file);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Acesso negado");
    return;
  }

  fs.readFile(file, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Não encontrado");
      return;
    }
    const type = types[path.extname(file).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": type });
    res.end(data);
  });
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`A porta ${port} já está em uso.`);
  } else {
    console.error(error.message);
  }
  process.exit(1);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Loja em http://127.0.0.1:${port}`);
});
