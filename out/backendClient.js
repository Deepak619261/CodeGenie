"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackendClient = void 0;
const ws_1 = __importDefault(require("ws"));
class BackendClient {
    ws;
    url;
    listeners = [];
    connecting;
    constructor(url) {
        this.url = url;
    }
    onEvent(fn) {
        this.listeners.push(fn);
    }
    async connect() {
        if (this.ws && this.ws.readyState === ws_1.default.OPEN)
            return;
        if (this.connecting)
            return this.connecting;
        this.connecting = new Promise((resolve, reject) => {
            const ws = new ws_1.default(this.url);
            ws.on('open', () => { this.ws = ws; resolve(); });
            ws.on('error', (err) => reject(err));
            ws.on('message', (data) => {
                try {
                    const ev = JSON.parse(data.toString());
                    for (const fn of this.listeners)
                        fn(ev);
                }
                catch { /* ignore */ }
            });
            ws.on('close', () => { this.ws = undefined; });
        });
        try {
            await this.connecting;
        }
        finally {
            this.connecting = undefined;
        }
    }
    async run(prompt, workspace, budgetUsd) {
        await this.connect();
        if (!this.ws)
            throw new Error('not connected');
        this.ws.send(JSON.stringify({ type: 'run', prompt, workspace, budget_usd: budgetUsd }));
    }
    close() {
        this.ws?.close();
        this.ws = undefined;
    }
}
exports.BackendClient = BackendClient;
//# sourceMappingURL=backendClient.js.map