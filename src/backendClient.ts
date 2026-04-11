import WebSocket from 'ws';

export type ServerEvent =
  | { type: 'route'; step: number; tier: number; provider: string; reason: string }
  | { type: 'assistant'; text: string; tier: number; cost: number }
  | { type: 'tool_call'; id: string; name: string; args: any }
  | { type: 'tool_result'; id: string; result: string }
  | { type: 'buffer'; step: number; n_messages: number; raw_tokens_est: number; rendered_tokens_est: number; stable_prefix_len: number }
  | { type: 'provider_failed'; provider: string; tier: number; message: string }
  | { type: 'budget'; envelope_usd: number; spent_usd: number; fraction_used: number; remaining_usd: number; n_calls: number; cache_read_tokens?: number; cache_saved_usd?: number; cache_hit_rate?: number }
  | { type: 'done'; final: string }
  | { type: 'error'; message: string };

export class BackendClient {
  private ws?: WebSocket;
  private url: string;
  private listeners: ((e: ServerEvent) => void)[] = [];
  private connecting?: Promise<void>;

  constructor(url: string) {
    this.url = url;
  }

  /** Subscribe to server events. Returns an unsubscribe function — callers
   *  (e.g. ChatPanel) MUST call it on dispose, otherwise listeners accumulate
   *  across panel open/close cycles and events fire against disposed webviews. */
  onEvent(fn: (e: ServerEvent) => void): () => void {
    this.listeners.push(fn);
    return () => {
      const idx = this.listeners.indexOf(fn);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  private async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    if (this.connecting) return this.connecting;
    this.connecting = new Promise((resolve, reject) => {
      const ws = new WebSocket(this.url);
      ws.on('open', () => { this.ws = ws; resolve(); });
      ws.on('error', (err) => reject(err));
      ws.on('message', (data) => {
        try {
          const ev = JSON.parse(data.toString()) as ServerEvent;
          for (const fn of this.listeners) fn(ev);
        } catch { /* ignore */ }
      });
      ws.on('close', () => { this.ws = undefined; });
    });
    try { await this.connecting; } finally { this.connecting = undefined; }
  }

  async run(prompt: string, workspace: string, budgetUsd: number) {
    await this.connect();
    if (!this.ws) throw new Error('not connected');
    this.ws.send(JSON.stringify({ type: 'run', prompt, workspace, budget_usd: budgetUsd }));
  }

  close() {
    this.ws?.close();
    this.ws = undefined;
  }
}
