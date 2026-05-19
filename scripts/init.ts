#!/usr/bin/env bun
/**
 * Interactive project initializer
 * Run with: bun run init
 */

import { join, dirname } from "path";
import { existsSync, writeFileSync, readFileSync, rmSync, readdirSync } from "fs";
import { createConsola } from "consola";
import * as readline from "readline";

// Setup consola without timestamps
const consola = createConsola({
  formatOptions: {
    date: false,
  },
});

const ROOT = join(dirname(import.meta.path), "..");

// ANSI colors
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
  red: "\x1b[31m",
};

function c(text: string, color: string): string {
  return `${color}${text}${colors.reset}`;
}

// Interactive selector with arrow keys
async function selectInteractive(message: string, options: string[], multi = false): Promise<number[] | number> {
  return new Promise((resolve) => {
    const isTTY = process.stdin.isTTY;
    if (isTTY) {
      process.stdin.setRawMode(true);
      readline.emitKeypressEvents(process.stdin);
    }
    process.stdin.resume();

    let cursor = 0;
    const selected: Set<number> = new Set();
    const linesToClear = options.length + 3; // message + instruction + spacer + options

    // Hide cursor during selection
    process.stdout.write("\x1B[?25l");

    const render = (first = false) => {
      if (!first) {
        readline.moveCursor(process.stdout, 0, -linesToClear);
        readline.clearScreenDown(process.stdout);
      }

      process.stdout.write(c("? ", colors.yellow) + message + "\n");
      if (multi) {
        process.stdout.write("   " + c("(use ↑↓ to navigate, space to select, enter to confirm)", colors.gray) + "\n");
      } else {
        process.stdout.write("   " + c("(use ↑↓ to navigate, enter to select)", colors.gray) + "\n");
      }
      process.stdout.write("\n");

      options.forEach((opt, i) => {
        const isCurrent = i === cursor;
        const isSelected = selected.has(i);

        let prefix = isCurrent ? c("› ", colors.green) : "  ";
        let label = opt;

        if (multi) {
          const checkbox = isSelected ? c("◉", colors.green) : c("◯", colors.gray);
          label = checkbox + " " + opt;
        }

        if (isCurrent) {
          label = c(label, colors.bold);
        }

        process.stdout.write(prefix + label + "\n");
      });
    };

    render(true);

    const onKeypress = (str: string, key: any) => {
      // Ctrl+C - exit
      if (key.ctrl && key.name === "c") {
        process.stdout.write("\x1B[?25h"); // Show cursor
        process.exit(0);
      }

      // Enter - confirm
      if (key.name === "return" || key.name === "enter") {
        process.stdin.removeListener("keypress", onKeypress);
        if (isTTY) process.stdin.setRawMode(false);
        process.stdin.pause();

        // Show cursor
        process.stdout.write("\x1B[?25h");

        // Clear and show final result
        readline.moveCursor(process.stdout, 0, -linesToClear);
        readline.clearScreenDown(process.stdout);

        const resultLabel = multi
          ? Array.from(selected).map(i => options[i].split(" ")[0]).join(", ") || "none"
          : options[cursor].split(" ")[0];

        process.stdout.write(c("? ", colors.yellow) + message + ": " + c(resultLabel, colors.cyan) + "\n");

        if (multi) {
          resolve(Array.from(selected));
        } else {
          resolve(cursor);
        }
        return;
      }

      // Up arrow
      if (key.name === "up" || key.name === "k") {
        cursor = (cursor - 1 + options.length) % options.length;
        render();
      }

      // Down arrow
      if (key.name === "down" || key.name === "j") {
        cursor = (cursor + 1) % options.length;
        render();
      }

      // Space - toggle selection (multi only)
      if (key.name === "space" && multi) {
        if (selected.has(cursor)) {
          selected.delete(cursor);
        } else {
          selected.add(cursor);
        }
        render();
      }
    };

    process.stdin.on("keypress", onKeypress);
  });
}

async function main() {
  consola.box("🚀 Project Initializer");

  // Get project name from package.json
  const pkgPath = join(ROOT, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  let projectName = pkg.name.replace(/{{PROJECT_NAME}}/g, "my-app");

  // Ask for project name
  consola.log("");
  const nameInput = await new Promise<string>((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(c("? ", colors.yellow) + "Project name [" + c(projectName, colors.green) + "]: ", (answer) => {
      rl.close();
      resolve(answer.trim() || projectName);
    });
  });
  projectName = nameInput;

  // Ask for org/package prefix
  const orgInput = await new Promise<string>((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(c("? ", colors.yellow) + "Org/Package prefix [" + c("default", colors.green) + "]: ", (answer) => {
      rl.close();
      resolve(answer.trim() || "default");
    });
  });
  const orgPrefix = orgInput;

  consola.log("");

  consola.start("Select Apps to Include");
  const appOptions = [
    "web (Next.js 16 + React 19)",
    "api (Elysia + Bun)",
    "docs (Fumadocs)",
    "storybook (Component docs & testing)",
  ];
  const selectedApps = await selectInteractive("Apps", appOptions, true) as number[];

  consola.log("");

  consola.start("Select Packages to Include");
  const pkgOptions = [
    "ui (React components with Radix UI)",
    "schema (TypeBox schemas)",
    "db (PostgreSQL with Drizzle ORM)",
    "config (Shared TypeScript configs)",
  ];
  const selectedPkgs = await selectInteractive("Packages", pkgOptions, true) as number[];

  consola.log("");

  consola.start("Database Configuration");
  const dbOptions = ["PostgreSQL", "SQLite", "None (skip DB setup)"];
  const dbChoice = await selectInteractive("Database", dbOptions, false) as number;

  // Process selections
  consola.log("");
  consola.success("Processing selections...");

  // Update package.json with project name
  pkg.name = projectName.toLowerCase().replace(/\s+/g, "-");
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  // Remove unselected apps
  const appsDir = join(ROOT, "apps");
  const allApps = ["web", "api", "docs", "storybook"];
  for (const app of allApps) {
    const appPath = join(appsDir, app);
    if (existsSync(appPath)) {
      if (!selectedApps.includes(allApps.indexOf(app))) {
        rmSync(appPath, { recursive: true, force: true });
        consola.info("Removed apps/" + app);
      }
    }
  }

  // Remove unselected packages
  const packagesDir = join(ROOT, "packages");
  const allPkgs = ["ui", "schema", "db", "config"];
  for (const pkgName of allPkgs) {
    const pkgPath = join(packagesDir, pkgName);
    if (existsSync(pkgPath)) {
      if (!selectedPkgs.includes(allPkgs.indexOf(pkgName))) {
        rmSync(pkgPath, { recursive: true, force: true });
        consola.info("Removed packages/" + pkgName);
      }
    }
  }

  // Update tsconfig.json references
  const tsconfigPath = join(ROOT, "tsconfig.json");
  const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf-8"));
  tsconfig.references = [];

  selectedApps.forEach((i) => {
    const appName = allApps[i];
    if (existsSync(join(appsDir, appName))) {
      tsconfig.references.push({ path: `apps/${appName}` });
    }
  });

  selectedPkgs.forEach((i) => {
    const pkgName = allPkgs[i];
    if (existsSync(join(packagesDir, pkgName))) {
      tsconfig.references.push({ path: `packages/${pkgName}` });
    }
  });

  writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + "\n");

  // Update package names in all package.json files
  const updatePackageJson = (dir: string, type: string, name: string) => {
    const path = join(dir, name, "package.json");
    if (existsSync(path)) {
      const content = JSON.parse(readFileSync(path, "utf-8"));
      content.name = `@${orgPrefix}/${name}`;
      
      // Update workspace dependencies
      if (content.dependencies) {
        for (const [key, value] of Object.entries(content.dependencies)) {
          if (key.startsWith("@cvai/")) {
            const newKey = key.replace("@cvai/", `@${orgPrefix}/`);
            content.dependencies[newKey] = value;
            delete content.dependencies[key];
          }
        }
      }
      if (content.devDependencies) {
        for (const [key, value] of Object.entries(content.devDependencies)) {
          if (key.startsWith("@cvai/")) {
            const newKey = key.replace("@cvai/", `@${orgPrefix}/`);
            content.devDependencies[newKey] = value;
            delete content.devDependencies[key];
          }
        }
      }
      
      writeFileSync(path, JSON.stringify(content, null, 2) + "\n");
    }
  };

  selectedApps.forEach((i) => updatePackageJson(appsDir, "apps", allApps[i]));
  selectedPkgs.forEach((i) => updatePackageJson(packagesDir, "packages", allPkgs[i]));

  // Update imports in source files
  const updateImports = (dir: string) => {
    const files: string[] = [];
    const findTsFiles = (d: string) => {
      if (!existsSync(d)) return;
      const entries = readdirSync(d, { withFileTypes: true });
      for (const entry of entries) {
        const path = join(d, entry.name);
        if (entry.name === "node_modules") continue;
        if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
          files.push(path);
        } else if (!entry.name.includes(".") && entry.isDirectory()) {
          findTsFiles(path);
        }
      }
    };
    findTsFiles(dir);

    for (const file of files) {
      let content = readFileSync(file, "utf-8");
      content = content.replace(/@cvai\//g, `@${orgPrefix}/`);
      writeFileSync(file, content);
    }
  };

  selectedApps.forEach((i) => updateImports(join(appsDir, allApps[i])));
  selectedPkgs.forEach((i) => updateImports(join(packagesDir, allPkgs[i])));

  // Setup database
  if (dbChoice === 0 || dbChoice === 1) {
    const dbPath = join(packagesDir, "db");
    if (existsSync(dbPath)) {
      const dbPkgPath = join(dbPath, "package.json");
      const dbPkg = JSON.parse(readFileSync(dbPkgPath, "utf-8"));
      
      if (dbChoice === 0) {
        // PostgreSQL
        dbPkg.dependencies = {
          ...dbPkg.dependencies,
          "drizzle-orm": "^0.38.0",
          "postgres": "^3.4.5",
        };
        consola.success("Configured PostgreSQL with Drizzle ORM");
      } else {
        // SQLite
        dbPkg.dependencies = {
          ...dbPkg.dependencies,
          "drizzle-orm": "^0.38.0",
          "better-sqlite3": "^11.0.0",
        };
        consola.success("Configured SQLite with Drizzle ORM");
      }
      
      writeFileSync(dbPkgPath, JSON.stringify(dbPkg, null, 2) + "\n");
    }
  }

  // Create .env.example
  const envExample = `# Database
DATABASE_URL="postgresql://user:password@localhost:5432/${projectName}"

# API
PORT=3001

# Next.js
NEXT_PUBLIC_API_URL="http://localhost:3001"
`;
  writeFileSync(join(ROOT, ".env.example"), envExample);

  consola.log("");
  consola.box("✨ Initialization Complete!");

  consola.log("");
  consola.log(c("Next steps:", colors.green));
  consola.log("  1. " + c("bun install", colors.cyan));
  consola.log("  2. " + c("cp .env.example .env.local", colors.cyan));
  consola.log("  3. " + c("bun run dev", colors.cyan));
  consola.log("");
}

main().catch((err) => {
  consola.fatal(err);
  process.exit(1);
});
