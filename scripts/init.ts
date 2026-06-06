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
  consola.box("🚀 Project Initializer (Rin Mod)");

  const args = process.argv.slice(2);
  const getArgValue = (name: string): string | null => {
    const idx = args.indexOf(name);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
  };
  const hasArg = (name: string): boolean => args.includes(name);

  const isNonInteractive = hasArg("--yes") || hasArg("-y") || hasArg("--non-interactive");

  // Get project name from package.json
  const pkgPath = join(ROOT, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  let projectName = pkg.name.replace(/{{PROJECT_NAME}}/g, "my-app");

  if (isNonInteractive) {
    projectName = getArgValue("--name") || projectName;
  } else {
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
  }

  let orgPrefix = "default";
  if (isNonInteractive) {
    orgPrefix = getArgValue("--org") || orgPrefix;
  } else {
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
    orgPrefix = orgInput;
  }

  const allApps = ["web", "api", "docs", "storybook"];
  let selectedApps = [0]; // default: web only
  const appsArg = getArgValue("--apps");

  if (appsArg) {
    selectedApps = appsArg.split(",").map(a => allApps.indexOf(a.trim())).filter(i => i !== -1);
  } else if (!isNonInteractive) {
    consola.log("");
    consola.start("Select Apps to Include");
    const appOptions = [
      "web (Next.js 16 + React 19)",
      "api (Elysia + Bun)",
      "docs (Fumadocs)",
      "storybook (Component docs & testing)",
    ];
    selectedApps = await selectInteractive("Apps", appOptions, true) as number[];
  }

  const allPkgs = ["ui", "schema", "db", "config"];
  let selectedPkgs = [0, 1, 2, 3]; // default: all
  const pkgsArg = getArgValue("--pkgs");

  if (pkgsArg) {
    selectedPkgs = pkgsArg.split(",").map(p => allPkgs.indexOf(p.trim())).filter(i => i !== -1);
  } else if (!isNonInteractive) {
    consola.log("");
    consola.start("Select Packages to Include");
    const pkgOptions = [
      "ui (React components with Radix UI)",
      "schema (TypeBox schemas)",
      "db (Database support with Drizzle ORM)",
      "config (Shared TypeScript configs)",
    ];
    selectedPkgs = await selectInteractive("Packages", pkgOptions, true) as number[];
  }

  let dbChoice = 2; // None
  const hasDbPkg = selectedPkgs.includes(allPkgs.indexOf("db"));
  const dbArg = getArgValue("--db");

  if (dbArg) {
    if (dbArg.toLowerCase() === "postgres") dbChoice = 0;
    else if (dbArg.toLowerCase() === "sqlite") dbChoice = 1;
    else dbChoice = 2;
  } else if (hasDbPkg) {
    if (isNonInteractive) {
      dbChoice = 1; // default to SQLite in non-interactive
    } else {
      consola.log("");
      consola.start("Database Configuration");
      const dbOptions = ["PostgreSQL", "SQLite", "None (skip DB setup)"];
      dbChoice = await selectInteractive("Database", dbOptions, false) as number;
    }
  }

  let initGitChoice = true;
  if (hasArg("--no-git")) {
    initGitChoice = false;
  } else if (!isNonInteractive) {
    consola.log("");
    initGitChoice = await new Promise<boolean>((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question(c("? ", colors.yellow) + "Initialize fresh Git repository? [Y/n]: ", (answer) => {
        rl.close();
        resolve(answer.trim().toLowerCase() !== "n");
      });
    });
  }

  let cleanupChoice = false;
  if (hasArg("--cleanup")) {
    cleanupChoice = true;
  } else if (!isNonInteractive) {
    cleanupChoice = await new Promise<boolean>((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question(c("? ", colors.yellow) + "Delete initialization script after complete? [Y/n]: ", (answer) => {
        rl.close();
        resolve(answer.trim().toLowerCase() !== "n");
      });
    });
  }

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

  // Setup database files correctly based on choice
  if (selectedPkgs.includes(allPkgs.indexOf("db"))) {
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
        writeFileSync(dbPkgPath, JSON.stringify(dbPkg, null, 2) + "\n");
        consola.success("Configured PostgreSQL package settings");
      } else if (dbChoice === 1) {
        // SQLite
        dbPkg.dependencies = {
          ...dbPkg.dependencies,
          "drizzle-orm": "^0.38.0",
          "better-sqlite3": "^11.3.0",
        };
        dbPkg.devDependencies = {
          ...dbPkg.devDependencies,
          "@types/better-sqlite3": "^7.6.12",
        };
        writeFileSync(dbPkgPath, JSON.stringify(dbPkg, null, 2) + "\n");

        // Write SQLite Drizzle Config
        const drizzleConfig = `import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL || "sqlite.db",
  },
});
`;
        writeFileSync(join(dbPath, "drizzle.config.ts"), drizzleConfig);

        // Write SQLite db initialization
        const dbIndex = `import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";

const sqlite = new Database(process.env.DATABASE_URL || "sqlite.db");
export const db = drizzle(sqlite, { schema });
`;
        writeFileSync(join(dbPath, "src/index.ts"), dbIndex);

        // Write SQLite compatible schema
        const dbSchema = `import { sqliteTable, text } from "drizzle-orm/sqlite-core";

// Example users table for SQLite - extend as needed
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: text("created_at").default(new Date().toISOString()).notNull(),
  updatedAt: text("updated_at").default(new Date().toISOString()).notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
`;
        writeFileSync(join(dbPath, "src/schema.ts"), dbSchema);
        consola.success("Configured SQLite config, index, and schema files");
      } else {
        // DB package included but no DB configuration selected -> remove db package
        rmSync(dbPath, { recursive: true, force: true });
        const idx = tsconfig.references.findIndex((r: any) => r.path === "packages/db");
        if (idx !== -1) tsconfig.references.splice(idx, 1);
        writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + "\n");
        consola.info("Removed packages/db (DB type set to None)");
      }
    }
  }

  // Update imports for changed package prefixes
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

  // Recursively replace {{PROJECT_NAME}} across the entire workspace
  const replaceProjectName = (dir: string) => {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const path = join(dir, entry.name);
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      if (entry.isDirectory()) {
        replaceProjectName(path);
      } else if (entry.isFile()) {
        try {
          let content = readFileSync(path, "utf-8");
          if (content.includes("{{PROJECT_NAME}}")) {
            content = content.replaceAll("{{PROJECT_NAME}}", projectName);
            writeFileSync(path, content, "utf-8");
            consola.info(`Updated placeholders in ${join(dir.replace(ROOT, ""), entry.name)}`);
          }
        } catch {}
      }
    }
  };
  replaceProjectName(ROOT);

  // Generate .env.example
  const dbUrl = dbChoice === 1 
    ? "sqlite.db" 
    : `postgresql://user:password@localhost:5432/${projectName.toLowerCase().replace(/\s+/g, "-")}`;
  const envExample = `# Database
DATABASE_URL="${dbUrl}"

# API
PORT=3001

# Next.js
NEXT_PUBLIC_API_URL="http://localhost:3001"
`;
  writeFileSync(join(ROOT, ".env.example"), envExample);
  consola.success("Generated .env.example file");

  // Post-initialization Git Setup
  if (initGitChoice) {
    try {
      consola.start("Re-initializing Git repository...");
      // Remove old git folder if exists (since it's copied from template)
      rmSync(join(ROOT, ".git"), { recursive: true, force: true });
      
      const spawnSync = (cmd: string[]) => Bun.spawnSync(cmd, { cwd: ROOT });
      spawnSync(["git", "init"]);
      spawnSync(["git", "add", "."]);
      spawnSync(["git", "commit", "-m", "initial: project setup from template"]);
      consola.success("Initialized a fresh Git repository with initial commit!");
    } catch (e) {
      consola.error("Failed to initialize git repository: " + e);
    }
  }

  // Self-cleanup
  if (cleanupChoice) {
    consola.info("Cleaning up initialization script...");
    const initScriptPath = import.meta.path;
    
    // Remove scripts folder or just the script
    try {
      rmSync(initScriptPath, { force: true });
      // Clean scripts folder if empty
      const scriptsDir = dirname(initScriptPath);
      if (readdirSync(scriptsDir).length === 0) {
        rmSync(scriptsDir, { recursive: true, force: true });
      }
      
      // Remove "init" script from root package.json
      const rootPkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      if (rootPkg.scripts && rootPkg.scripts.init) {
        delete rootPkg.scripts.init;
        writeFileSync(pkgPath, JSON.stringify(rootPkg, null, 2) + "\n");
      }
      consola.success("Removed initialization script and cleaned package.json");
    } catch (e) {
      consola.error("Cleanup failed: " + e);
    }
  }

  consola.log("");
  consola.box("✨ Initialization Complete! (Rin verified)");

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
