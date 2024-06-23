// index.ts
import { Hono } from "hono";
import authors from "./api/authors";
import books from "./api/books";
import { handle } from "hono/aws-lambda";

const app = new Hono();

const routes = app.route("/authors", authors).route("/books", books);

export const handler = handle(app);
export default app;
export type AppType = typeof routes;
