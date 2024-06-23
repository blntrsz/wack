import { Hono } from "hono";
import { handle } from "hono/aws-lambda";

const app = new Hono();

const router = app.get("/", (c) => {
  return c.json({
    message: "Hello Hono + Remix!",
  });
});

export const handler = handle(app);

export type AppType = typeof router;
