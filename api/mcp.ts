import { createServer } from "@modelcontextprotocol/sdk/server";
import { z } from "zod";

// Edge runtime
export const config = { runtime: "edge" };

// MCP server with one tool: http_request
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
      handler: async (input: unknown) => {
        const { method, url, headers, body } = input as {
          method?: string;
          url: string;
          headers?: Record<string, string>;
          body?: unknown;
        };

        const init: RequestInit = {
          method: method || "POST",
          headers: headers ?? {}
        };
        if (body !== undefined) {
          init.body = JSON.stringify(body);
          (init.headers as Record<string, string>) = {
            "Content-Type": "application/json",
            ...(headers ?? {})
          };
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
