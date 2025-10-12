export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const name = url.searchParams.get('name') ?? 'Edge User';
  return new Response(`Hello ${name}!`, {
    headers: { "content-type": "text/plain" },
  });
}
