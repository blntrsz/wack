import type { MetaFunction } from "@remix-run/node";
import { Await, Link, defer, useLoaderData } from "@remix-run/react";
import type { AppType } from "../../../backend/src/index";
import { hc } from "hono/client";
import { Suspense } from "react";

const apiUrl = process.env.VITE_API_URL!;

const client = hc<AppType>(apiUrl);

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export async function loader() {
  const response = client.books.$get().then((r) => r.json());

  return defer({ response });
}

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();

  return (
    <div className="font-sans p-4">
      <h1 className="text-3xl">Welcome to Remix</h1>
      <Link to="/about">About</Link>
      <h2>
        Message from server:
        <Suspense fallback={<>Loading...</>}>
          <Await resolve={loaderData.response}>{(data) => <>{data}</>}</Await>
        </Suspense>
      </h2>
      <ul className="list-disc mt-4 pl-6 space-y-2">
        <li>
          <a
            className="text-blue-700 underline visited:text-purple-900"
            target="_blank"
            href="https://remix.run/start/quickstart"
            rel="noreferrer"
          >
            5m Quick Start
          </a>
        </li>
        <li>
          <a
            className="text-blue-700 underline visited:text-purple-900"
            target="_blank"
            href="https://remix.run/start/tutorial"
            rel="noreferrer"
          >
            30m Tutorial
          </a>
        </li>
        <li>
          <a
            className="text-blue-700 underline visited:text-purple-900"
            target="_blank"
            href="https://remix.run/docs"
            rel="noreferrer"
          >
            Remix Docs
          </a>
        </li>
      </ul>
    </div>
  );
}
