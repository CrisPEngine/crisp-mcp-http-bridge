import { createServer } from "@modelcontextprotocol/sdk/server";
import { z } from "@modelcontextprotocol/sdk/types";
import { fetch } from "undici";

// Run as a Vercel Edge Function
export const config = { runtime: "edge" };

// Define one MCP tool: http_request
const server = createServer({
  name: "crisp-http-bridge",
  version: "1.0.0",
  tools: [
    {
      name: "http_request",
      description:
        "Perform an HTTP request. Supports method, url, headers, and JSON body. Returns status, headers, and text body.",
      inputSchema: z.object({
        method: z.string().default("POST"),
        url: z.string(),
        headers: z.record(z.string()).optional(),
        body: z.unknown().optional()
      }),
      handler: async ({ method, url, headers, body }) => {
        const init: any = { method, headers: headers || {} };
        if (body !== undefined) {
          init.body = JSON.stringify(body);
          init.headers = { "Content-Type": "application/json", ...(headers || {}) };
        }
        const resp = await fetch(url, init);
        const text = await resp.text();
        const allHeaders: Record<string, string> = {};
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

// Edge entrypoint
export default async function handler(req: Request): Promise<Response> {
  return server.handleHTTP(req);
}
