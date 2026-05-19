import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Type } from "@sinclair/typebox";
import consola from "consola";

const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      path: "/docs",
      documentation: {
        info: {
          title: "{{PROJECT_NAME}} API",
          version: "1.0.0",
        },
      },
    })
  )
  .get("/", () => {
    return {
      name: "{{PROJECT_NAME}}",
      version: "1.0.0",
      status: "ok",
    };
  })
  .get("/health", () => {
    return { status: "healthy", timestamp: new Date().toISOString() };
  })
  .listen(3001);

consola.success(`🦊 API listening at ${app.server?.url}`);
