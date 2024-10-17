export async function router(
  request: Request,
  routes: {
    path: string;
    method: "GET" | "POST";
    fn: (request: Request) => Promise<Response>;
  }[]
): Promise<Response> {
  for (const route of routes) {
    if (request.method !== route.method) {
      continue;
    }
    if (request.url.includes(route.path)) {
      const response = await route.fn(request);
      if (response !== undefined) {
        return response;
      }
    }
  }

  return new Response("No valid response found", { status: 404 });
}
