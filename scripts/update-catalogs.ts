import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");

// Catalog definitions mapping dependency name to catalog protocol
const catalog: Record<string, string> = {
  react: "catalog:",
  "react-dom": "catalog:",
  typescript: "catalog:",
  zustand: "catalog:",
  "lucide-react": "catalog:",
  "@radix-ui/themes": "catalog:",
  consola: "catalog:",
  "drizzle-orm": "catalog:db",
  postgres: "catalog:db",
  "drizzle-kit": "catalog:db",
  turbo: "catalog:build",
  "@biomejs/biome": "catalog:build",
};

const processPackageJson = (filePath: string) => {
  if (filePath === join(ROOT, "package.json")) {
    // Skip root package.json to prevent overriding catalog definitions
    return;
  }

  const content = JSON.parse(readFileSync(filePath, "utf-8"));
  let changed = false;

  for (const depType of [
    "dependencies",
    "devDependencies",
    "peerDependencies",
  ]) {
    if (content[depType]) {
      for (const [depName, depVersion] of Object.entries(content[depType])) {
        if (catalog[depName] && depVersion !== catalog[depName]) {
          content[depType][depName] = catalog[depName];
          changed = true;
        }
      }
    }
  }

  if (changed) {
    writeFileSync(filePath, `${JSON.stringify(content, null, 2)}\n`);
    console.log(`Updated catalogs in ${filePath}`);
  }
};

const walk = (dir: string) => {
  const files = readdirSync(dir);
  for (const file of files) {
    if (
      file === "node_modules" ||
      file === ".git" ||
      file === ".next" ||
      file === ".turbo"
    )
      continue;
    const fullPath = join(dir, file);
    if (statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (file === "package.json") {
      processPackageJson(fullPath);
    }
  }
};

walk(ROOT);
console.log("Catalogs update complete!");
