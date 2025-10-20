export const config = { runtime: "edge" };
export default async function handler(_: Request): Promise<Response> {
  return new Response(JSON.stringify({ ok: true, msg: "hello from edge" }), {
    headers: { "Content-Type": "application/json" },
  });
}
