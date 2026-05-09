# n8n — Dokan Express AI Shopping Assistant

This directory holds the self-hosted n8n setup that powers the chat
assistant. The backend's `/api/v1/chat` endpoint forwards user messages to
the n8n webhook, n8n calls Gemini for intent classification and reply
generation, and (when the user asks for products) calls back into the
backend's product endpoint to attach product cards.

## Quick start

1. Make sure Docker Desktop is running.
2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` (free key at
   https://aistudio.google.com), plus `N8N_BASIC_AUTH_USER` /
   `N8N_BASIC_AUTH_PASSWORD` if you want non-default credentials.
3. From the backend repo root:

   ```bash
   docker compose up -d n8n
   ```

4. Open http://localhost:5678 and log in with the basic-auth credentials.
5. Import the workflow:
   - Workflows → Import from File → select
     `n8n/workflows/chat-assistant.json`.
   - Click Active to enable the webhook.
6. Test it:

   ```bash
   curl -X POST http://localhost:5678/webhook/chat \
     -H 'Content-Type: application/json' \
     -d '{"message":"show me wireless headphones under $100"}'
   ```

## Workflow shape

`chat-assistant.json` is intentionally compact — three nodes:

```
Webhook (POST /webhook/chat)
    ↓
Classify & fetch products (Code, JS)
    ↓
Respond to Webhook
```

The Code node:

1. Reads `{ message, userId? }` from the webhook body.
2. Calls Gemini 2.0 Flash with a system prompt that asks for strictly
   valid JSON: `{ intent, query, reply, suggestions[] }`.
   - Intents: `SEARCH | RECOMMEND | ORDER_STATUS | FAQ`.
3. If the intent is `SEARCH` or `RECOMMEND` and a `query` came back, it
   calls the host backend at `${DOKANXPRESS_BACKEND_URL}/api/v1/products`
   and attaches the top 5 products as `products[]`.
4. Returns `{ reply, intent, query, products, suggestions }`.

The Respond node wraps that in `{ success: true, data: {...} }` so the
backend proxy can pass it through to the frontend without reshaping.

### Environment

The Code node reads `GEMINI_API_KEY` and `DOKANXPRESS_BACKEND_URL` from the
n8n container's environment, which is supplied by `docker-compose.yml`.

## Why a single Code node instead of a multi-node visual graph

A four-branch visual workflow (one branch per intent) is more idiomatic
n8n, but it's also four times more JSON to author and debug, and it
locks in a structure before we know which intents matter most. Keeping
the orchestration in JS today makes it trivial to read, version, and
extend; a future polish pass can split it into branches with proper IF /
HTTP / Set nodes once the intent surface stabilises.

## Roadmap

- [ ] `ORDER_STATUS` intent currently returns just the Gemini text reply
      (e.g. "log in to view your orders"). Wire it to a real lookup once
      `/api/v1/orders/me` is exposed and the chat carries an auth token.
- [ ] Multi-turn memory: pass the last few turns into Gemini's context.
- [ ] Streaming responses: switch to Gemini's stream endpoint and SSE
      from the backend down to the chat widget.
- [ ] Tool-calling: let Gemini decide which backend endpoint to hit
      instead of branching on intent labels.
