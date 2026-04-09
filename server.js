const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 4173;
const ROOT = __dirname;

const MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".woff": "font/woff",
    ".woff2": "font/woff2"
};

function safeResolve(urlPath) {
    const cleanPath = urlPath.split("?")[0].split("#")[0];
    const requested = cleanPath === "/" ? "/index.html" : cleanPath;
    const resolved = path.normalize(path.join(ROOT, requested));
    if (!resolved.startsWith(ROOT)) {
        return null;
    }
    return resolved;
}

function sendFile(filePath, response) {
    fs.readFile(filePath, (error, data) => {
        if (error) {
            response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            response.end("Not found");
            return;
        }

        const extension = path.extname(filePath).toLowerCase();
        response.writeHead(200, {
            "Content-Type": MIME_TYPES[extension] || "application/octet-stream"
        });
        response.end(data);
    });
}

const server = http.createServer((request, response) => {
    const filePath = safeResolve(request.url || "/");
    if (!filePath) {
        response.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Forbidden");
        return;
    }

    fs.stat(filePath, (error, stats) => {
        if (!error && stats.isDirectory()) {
            sendFile(path.join(filePath, "index.html"), response);
            return;
        }

        if (!error) {
            sendFile(filePath, response);
            return;
        }

        sendFile(path.join(ROOT, "index.html"), response);
    });
});

server.listen(PORT, () => {
    console.log(`Scrum Board Platform server running on http://localhost:${PORT}`);
});
