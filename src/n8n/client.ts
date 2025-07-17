export async function triggerN8nWebhook({
  url,
  method = 'POST',
  payload = {},
  headers = {},
}: {
  url: string;
  method?: 'POST' | 'GET';
  payload?: unknown;
  headers?: Record<string, string>;
}) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: method === 'POST' ? JSON.stringify(payload) : undefined,
  });
  if (!response.ok) {
    throw new Error(`n8n webhook call failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
} 