// Tiny in-process pubsub for notification SSE streams. Holds one set of
// active client writers per userId; broadcasts new notifications to all of
// the user's open streams. Works for our single-Express-instance setup;
// would need Redis pubsub if we ever scale horizontally.

import type { Response } from "express";

type Client = {
  res: Response;
  id: number;
};

const subscribers = new Map<string, Set<Client>>();
let clientIdSeq = 0;

export const addClient = (userId: string, res: Response): Client => {
  const client: Client = { res, id: ++clientIdSeq };
  let set = subscribers.get(userId);
  if (!set) {
    set = new Set();
    subscribers.set(userId, set);
  }
  set.add(client);
  return client;
};

export const removeClient = (userId: string, client: Client) => {
  const set = subscribers.get(userId);
  if (!set) return;
  set.delete(client);
  if (set.size === 0) subscribers.delete(userId);
};

export const broadcastToUser = (userId: string, payload: unknown) => {
  const set = subscribers.get(userId);
  if (!set || set.size === 0) return;
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of set) {
    try {
      client.res.write(data);
    } catch {
      // best-effort; the close handler will clean up
    }
  }
};

export const userHasOpenStream = (userId: string) =>
  (subscribers.get(userId)?.size ?? 0) > 0;
