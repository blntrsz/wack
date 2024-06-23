// index.ts
import { Hono } from "hono";
import authors from "./api/authors";
import books from "./api/books";

const app = new Hono();

const routes = app.route("/authors", authors).route("/books", books);

export default app;
export type AppType = typeof routes;
