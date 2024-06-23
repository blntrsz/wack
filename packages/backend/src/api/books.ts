import { Hono } from "hono";

const app = new Hono()
  .get("/", (c) =>
    c.json({
      action: "list books",
    })
  )
  .post("/", (c) =>
    c.json(
      {
        action: "create a book",
      },
      201
    )
  )
  .get("/:id", (c) =>
    c.json({
      action: `get ${c.req.param("id")}`,
    })
  );

export default app;
