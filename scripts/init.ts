#!/usr/bin/env bun
/**
 * Interactive project initializer
 * Run with: bun run init
 */

import { existsSync, writeFileSync, readFileSync, rmSync, readdirSync, renameSync } from "fs";
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
      "web (Frontend web application)",
      "api (Elysia + Bun API)",
      "docs (Fumadocs documentation)",
      "storybook (Component playground)",
    ];
    selectedApps = await selectInteractive("Apps", appOptions, true) as number[];
  }

  // Web Framework Selection (if web app is selected)
  let webFrameworkChoice = 0; // 0: Nextjs, 1: Vite React
  const hasWebApp = selectedApps.includes(allApps.indexOf("web"));
  const frameworkArg = getArgValue("--framework");

  if (hasWebApp) {
    if (frameworkArg) {
      if (frameworkArg.toLowerCase() === "vite" || frameworkArg.toLowerCase() === "react") {
        webFrameworkChoice = 1;
      } else {
        webFrameworkChoice = 0;
      }
    } else if (!isNonInteractive) {
      consola.log("");
      consola.start("Frontend Framework Configuration");
      const frameworkOptions = ["Next.js 16 (Full-stack Router)", "Vite + React 19 (SPA Client)"];
      webFrameworkChoice = await selectInteractive("Frontend Framework", frameworkOptions, false) as number;
    }
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
      dbChoice = 0; // default to PostgreSQL in non-interactive
    } else {
      consola.log("");
      consola.start("Database Configuration");
      const dbOptions = ["PostgreSQL", "SQLite", "None (skip DB setup)"];
      dbChoice = await selectInteractive("Database", dbOptions, false) as number;
    }
  }

  // Docker Services Selection
  let includeRedis = true;
  let includeS3 = true;
  let includeNginx = true;
  let includeMailpit = true;

  if (isNonInteractive) {
    includeRedis = !hasArg("--no-redis");
    includeS3 = !hasArg("--no-s3");
    includeNginx = !hasArg("--no-nginx");
    includeMailpit = !hasArg("--no-mailpit");
  } else {
    consola.log("");
    consola.start("Docker Services Configuration");
    
    includeRedis = await new Promise<boolean>((resolve) => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question(c("? ", colors.yellow) + "Include Redis cache support? [Y/n]: ", (answer) => {
        rl.close();
        resolve(answer.trim().toLowerCase() !== "n");
      });
    });

    includeS3 = await new Promise<boolean>((resolve) => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question(c("? ", colors.yellow) + "Include S3 Storage (MinIO) support? [Y/n]: ", (answer) => {
        rl.close();
        resolve(answer.trim().toLowerCase() !== "n");
      });
    });

    includeNginx = await new Promise<boolean>((resolve) => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question(c("? ", colors.yellow) + "Include Nginx reverse proxy in production? [Y/n]: ", (answer) => {
        rl.close();
        resolve(answer.trim().toLowerCase() !== "n");
      });
    });

    includeMailpit = await new Promise<boolean>((resolve) => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question(c("? ", colors.yellow) + "Include Mailpit SMTP server for dev testing? [Y/n]: ", (answer) => {
        rl.close();
        resolve(answer.trim().toLowerCase() !== "n");
      });
    });
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

  // Remove unselected apps and configure the chosen web framework
  const appsDir = join(ROOT, "apps");
  if (selectedApps.includes(allApps.indexOf("web"))) {
    if (webFrameworkChoice === 0) {
      // Next.js
      if (existsSync(join(appsDir, "web-next"))) {
        rmSync(join(appsDir, "web"), { recursive: true, force: true });
        renameSync(join(appsDir, "web-next"), join(appsDir, "web"));
        consola.info("Configured apps/web with Next.js 16");
      }
      rmSync(join(appsDir, "web-vite"), { recursive: true, force: true });
    } else {
      // Vite
      if (existsSync(join(appsDir, "web-vite"))) {
        rmSync(join(appsDir, "web"), { recursive: true, force: true });
        renameSync(join(appsDir, "web-vite"), join(appsDir, "web"));
        consola.info("Configured apps/web with Vite + React 19");
      }
      rmSync(join(appsDir, "web-next"), { recursive: true, force: true });
    }
  } else {
    rmSync(join(appsDir, "web-next"), { recursive: true, force: true });
    rmSync(join(appsDir, "web-vite"), { recursive: true, force: true });
    consola.info("Removed all web apps");
  }

  for (const app of allApps) {
    if (app === "web") continue;
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

  // Recursively replace {{PROJECT_NAME}} and @cvai/ across the entire workspace
  const customizeWorkspace = (dir: string) => {
    if (!existsSync(dir)) return;
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const path = join(dir, entry.name);
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".next" || entry.name === ".turbo") continue;
      if (entry.isDirectory()) {
        customizeWorkspace(path);
      } else if (entry.isFile()) {
        try {
          let content = readFileSync(path, "utf-8");
          let changed = false;

          if (content.includes("{{PROJECT_NAME}}")) {
            content = content.replaceAll("{{PROJECT_NAME}}", projectName);
            changed = true;
          }

          if (content.includes("@cvai/")) {
            content = content.replaceAll("@cvai/", `@${orgPrefix}/`);
            changed = true;
          }

          if (changed) {
            writeFileSync(path, content, "utf-8");
            consola.info(`Updated placeholders in ${join(dir.replace(ROOT, ""), entry.name)}`);
          }
        } catch {}
      }
    }
  };
  customizeWorkspace(ROOT);

  // Generate Docker Compose and Environment files dynamically
  const dockerDir = join(ROOT, "docker");
  const servicesDir = join(dockerDir, "services");

  // Determine what services are included
  const usePostgres = dbChoice === 0;
  const useRedis = includeRedis;
  const useS3 = includeS3;
  const useNginx = includeNginx;
  const useMailpit = includeMailpit;
  const useApi = selectedApps.includes(allApps.indexOf("api"));
  const useWeb = selectedApps.includes(allApps.indexOf("web"));

  // Delete services files that are not selected (to keep things clean)
  if (!usePostgres && existsSync(join(servicesDir, "postgres.yml"))) rmSync(join(servicesDir, "postgres.yml"));
  if (!useRedis && existsSync(join(servicesDir, "redis.yml"))) rmSync(join(servicesDir, "redis.yml"));
  if (!useS3 && existsSync(join(servicesDir, "minio.yml"))) rmSync(join(servicesDir, "minio.yml"));
  if (!useApi && existsSync(join(servicesDir, "elysia.yml"))) rmSync(join(servicesDir, "elysia.yml"));
  if (!useWeb && existsSync(join(servicesDir, "nextjs.yml"))) rmSync(join(servicesDir, "nextjs.yml"));
  if (!useWeb && existsSync(join(servicesDir, "vite.yml"))) rmSync(join(servicesDir, "vite.yml"));
  if (!useNginx && existsSync(join(servicesDir, "nginx.yml"))) {
    rmSync(join(servicesDir, "nginx.yml"));
    rmSync(join(dockerDir, "nginx"), { recursive: true, force: true });
  }
  if (!useMailpit && existsSync(join(servicesDir, "mailpit.yml"))) rmSync(join(servicesDir, "mailpit.yml"));

  // If Vite was chosen, we can delete nextjs.yml. If Nextjs was chosen, we delete vite.yml.
  if (useWeb) {
    if (webFrameworkChoice === 0) {
      if (existsSync(join(servicesDir, "vite.yml"))) rmSync(join(servicesDir, "vite.yml"));
    } else {
      if (existsSync(join(servicesDir, "nextjs.yml"))) rmSync(join(servicesDir, "nextjs.yml"));
    }
  }

  // Helper function to build Compose Files
  const buildComposeFile = (env: "dev" | "prod" | "local-prod" | "test") => {
    let includes: string[] = [];
    if (usePostgres) includes.push("./services/postgres.yml");
    if (useRedis) includes.push("./services/redis.yml");
    if (useS3) includes.push("./services/minio.yml");

    if (env === "dev") {
      if (useMailpit) includes.push("./services/mailpit.yml");
    } else {
      // prod, local-prod, test
      if (useApi) includes.push("./services/elysia.yml");
      if (useWeb) {
        if (webFrameworkChoice === 0) {
          includes.push("./services/nextjs.yml");
        } else {
          includes.push("./services/vite.yml");
        }
      }
      if (useNginx) includes.push("./services/nginx.yml");
    }

    if (includes.length === 0) return "";

    let content = "include:\n";
    for (const inc of includes) {
      content += `  - path: ${inc}\n`;
    }

    // Add dev-specific overrides (port mappings)
    if (env === "dev" || env === "local-prod") {
      content += "\nservices:\n";
      if (usePostgres) {
        content += "  db:\n    ports:\n      - \"${DB_PORT:-5432}:5432\"\n";
      }
      if (useRedis) {
        content += "  redis:\n    ports:\n      - \"${REDIS_PORT:-6379}:6379\"\n";
      }
      if (useS3) {
        content += "  minio:\n    ports:\n      - \"${MINIO_PORT:-9000}:9000\"\n      - \"${MINIO_CONSOLE_PORT:-9001}:9001\"\n";
      }
      if (env === "dev" && useMailpit) {
        content += "  mailpit:\n    ports:\n      - \"${MAILPIT_PORT:-1025}:1025\"\n      - \"${MAILPIT_CONSOLE_PORT:-8025}:8025\"\n";
      }
      // If Nginx is not used in local-prod, we expose web and api ports directly
      if (env === "local-prod" && !useNginx) {
        if (useApi) {
          content += "  api:\n    ports:\n      - \"${PORT:-3001}:${PORT:-3001}\"\n";
        }
        if (useWeb) {
          content += "  web:\n    ports:\n      - \"${WEB_PORT:-3000}:${WEB_PORT:-3000}\"\n";
        }
      }
    }

    return content;
  };

  // Write compose files inside docker folder
  writeFileSync(join(dockerDir, "docker-compose.dev.yml"), buildComposeFile("dev"));
  writeFileSync(join(dockerDir, "docker-compose.prod.yml"), buildComposeFile("prod"));
  writeFileSync(join(dockerDir, "docker-compose.local-prod.yml"), buildComposeFile("local-prod"));
  writeFileSync(join(dockerDir, "docker-compose.test.yml"), buildComposeFile("test"));

  consola.success("Generated dynamic Docker Compose configurations");

  // Helper to generate Env Files
  const buildEnvFile = (env: "development" | "production" | "local-prod" | "test") => {
    let composeEnv = "dev";
    if (env === "production") composeEnv = "prod";
    if (env === "local-prod") composeEnv = "local-prod";
    if (env === "test") composeEnv = "test";

    let content = `# Docker Compose Environment
COMPOSE_ENV=${composeEnv}
PROJECT_NAME=${projectName.toLowerCase().replace(/\s+/g, "-")}

`;

    if (usePostgres) {
      const dbPassword = env === "production" ? "production_secure_password_replace_me" : "postgres";
      const dbName = env === "production" ? `${projectName.toLowerCase()}_prod` : projectName.toLowerCase();
      content += `# Database Configuration
DB_USER=postgres
DB_PASSWORD=${dbPassword}
DB_NAME=${dbName}
DB_PORT=5432
`;
      // Connection string for local dev / prod
      if (env === "development") {
        content += `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/${dbName}"\n\n`;
      } else {
        content += `DATABASE_URL="postgresql://postgres:${dbPassword}@db:5432/${dbName}"\n\n`;
      }
    } else if (dbChoice === 1) {
      // SQLite
      content += `# SQLite Database
DATABASE_URL="sqlite.db"\n\n`;
    }

    if (useRedis) {
      content += `# Redis Configuration
REDIS_PORT=6379
`;
      if (env === "development") {
        content += `REDIS_URL="redis://localhost:6379"\n\n`;
      } else {
        content += `REDIS_URL="redis://redis:6379"\n\n`;
      }
    }

    if (useS3) {
      const s3Password = env === "production" ? "s3_production_secure_password_replace_me" : "admin_password_replace_me";
      content += `# S3 Storage (MinIO) Configuration
S3_ROOT_USER=admin
S3_ROOT_PASSWORD=${s3Password}
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001
`;
      if (env === "development") {
        content += `S3_ENDPOINT="http://localhost:9000"\n\n`;
      } else {
        content += `S3_ENDPOINT="http://minio:9000"\n\n`;
      }
    }

    if (useMailpit && env === "development") {
      content += `# Mailpit Configuration
MAILPIT_PORT=1025
MAILPIT_CONSOLE_PORT=8025
`;
    }

    if (useApi || useWeb) {
      content += `# Services Ports
PORT=3001
WEB_PORT=3000
`;
      if (env === "development") {
        content += `NEXT_PUBLIC_API_URL="http://localhost:3001"\n\n`;
      } else if (useNginx) {
        content += `NEXT_PUBLIC_API_URL="/api"\n\n`; // Relative URL via Nginx routing
      } else {
        content += `NEXT_PUBLIC_API_URL="http://localhost:3001"\n\n`;
      }
    }

    if (useNginx && (env === "production" || env === "local-prod")) {
      content += `# Nginx Ports
NGINX_PORT=80
NGINX_SSL_PORT=443
`;
    }

    return content;
  };

  // Write Env Files
  writeFileSync(join(ROOT, ".env.development"), buildEnvFile("development"));
  writeFileSync(join(ROOT, ".env.production"), buildEnvFile("production"));
  writeFileSync(join(ROOT, ".env.local-prod"), buildEnvFile("local-prod"));
  writeFileSync(join(ROOT, ".env.test"), buildEnvFile("test"));

  // Write .env.example (mirrors .env.development)
  writeFileSync(join(ROOT, ".env.example"), buildEnvFile("development"));
  consola.success("Generated environment files (.env.development, .env.production, etc.)");

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
