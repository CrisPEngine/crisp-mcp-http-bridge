export const config = { runtime: "edge" };

import { createServer } from "@modelcontextprotocol/sdk/server";
import { z } from "zod";

// MCP server with one tool: http_request (uses Edge fetch)
const server = createServer({
  name: "crisp-http-bridge",
  version: "1.0.0",
  tools: [
    {
      name: "http_request",
      description:
        "Perform an HTTP request via Edge fetch. Supports method, url, headers, and JSON body. Returns status, headers, and text body.",
      inputSchema: z.object({
        method: z.string().default("POST"),
        url: z.string(),
        headers: z.record(z.string()).optional(),
        body: z.unknown().optional()
      }),
      handler: async (input) => {
        const { method, url, headers, body } = input ?? {};

        const init = {
          method: method || "POST",
          headers: headers || {}
        };
        if (body !== undefined) {
          init.body = JSON.stringify(body);
          init.headers = {
            "Content-Type": "application/json",
            ...(headers || {})
          };
        }

        const resp = await fetch(url, init);
        const text = await resp.text();

        const allHeaders = {};
        resp.headers.forEach((v, k) => (allHeaders[k] = v));

        return {
          content: [
            {
              type: "json",
              json: {
                status: resp.status,
                headers: allHeaders,
                body: text
              }
            }
          ]
        };
      }
    }
  ]
});

export default async function handler(req) {
  return server.handleHTTP(req);
}
