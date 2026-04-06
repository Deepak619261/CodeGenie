import WebSocket from 'ws';

export type ServerEvent =
  | { type: 'route'; step: number; tier: number; provider: string; reason: string }
  | { type: 'assistant'; text: string; tier: number; cost: number }
  | { type: 'tool_call'; id: string; name: string; args: any }
  | { type: 'tool_result'; id: string; result: string }
  | { type: 'budget'; envelope_usd: number; spent_usd: number; fraction_used: number; remaining_usd: number; n_calls: number }
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

  onEvent(fn: (e: ServerEvent) => void) {
    this.listeners.push(fn);
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
