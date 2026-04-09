import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const root = process.cwd();

function collectJsFiles(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            files.push(...collectJsFiles(fullPath));
            continue;
        }

        if (entry.isFile() && entry.name.endsWith(".js")) {
            files.push(fullPath);
        }
    }

    return files;
}

const targets = [path.join(root, "server.js"), ...collectJsFiles(path.join(root, "js"))];

for (const target of targets) {
    execFileSync(process.execPath, ["--check", target], { stdio: "inherit" });
}

console.log(`Syntax check passed for ${targets.length} files.`);
