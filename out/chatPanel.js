"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatPanel = void 0;
const vscode = __importStar(require("vscode"));
class ChatPanel {
    panel;
    client;
    statusBar;
    static current;
    static currentBudget = 0.05;
    static createOrShow(extensionUri, client, statusBar) {
        const column = vscode.window.activeTextEditor?.viewColumn;
        if (ChatPanel.current) {
            ChatPanel.current.panel.reveal(column);
            return;
        }
        const panel = vscode.window.createWebviewPanel('nexuscodeChat', 'NexusCode', column ?? vscode.ViewColumn.Beside, { enableScripts: true, retainContextWhenHidden: true });
        ChatPanel.current = new ChatPanel(panel, client, statusBar);
    }
    constructor(panel, client, statusBar) {
        this.panel = panel;
        this.client = client;
        this.statusBar = statusBar;
        panel.webview.html = this.html();
        panel.onDidDispose(() => { ChatPanel.current = undefined; });
        client.onEvent((e) => {
            this.panel.webview.postMessage(e);
            if (e.type === 'budget') {
                this.statusBar.setSpent(e.spent_usd);
            }
        });
        panel.webview.onDidReceiveMessage(async (msg) => {
            if (msg.type === 'send') {
                const ws = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';
                try {
                    this.statusBar.setEnvelope(ChatPanel.currentBudget);
                    await client.run(msg.prompt, ws, ChatPanel.currentBudget);
                }
                catch (err) {
                    this.panel.webview.postMessage({ type: 'error', message: String(err?.message ?? err) });
                }
            }
            else if (msg.type === 'setBudget') {
                ChatPanel.currentBudget = Number(msg.value) || 0.05;
                this.statusBar.setEnvelope(ChatPanel.currentBudget);
            }
        });
    }
    html() {
        return /* html */ `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); margin: 0; padding: 12px; }
  #log { height: calc(100vh - 140px); overflow-y: auto; border: 1px solid var(--vscode-panel-border); padding: 8px; border-radius: 4px; }
  .msg { margin-bottom: 10px; padding: 8px; border-radius: 4px; background: var(--vscode-editor-inactiveSelectionBackground); white-space: pre-wrap; }
  .msg.user { background: var(--vscode-textBlockQuote-background); }
  .meta { font-size: 11px; opacity: 0.7; margin-bottom: 4px; }
  .badge { display: inline-block; padding: 1px 6px; border-radius: 8px; font-size: 10px; margin-right: 6px; }
  .t0 { background: #2d7a2d; color: white; }
  .t1 { background: #2d5d8a; color: white; }
  .t2 { background: #8a2d2d; color: white; }
  .tool { font-family: var(--vscode-editor-font-family); font-size: 12px; opacity: 0.85; }
  #row { display: flex; gap: 6px; margin-top: 8px; }
  #prompt { flex: 1; padding: 6px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; }
  #budget { width: 70px; padding: 6px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; }
  button { padding: 6px 12px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 0; border-radius: 4px; cursor: pointer; }
</style></head>
<body>
  <div id="log"></div>
  <div id="row">
    <input id="budget" type="number" step="0.01" value="0.05" title="Budget USD" />
    <input id="prompt" placeholder="Ask NexusCode..." />
    <button id="send">Send</button>
  </div>
<script>
  const vscode = acquireVsCodeApi();
  const log = document.getElementById('log');
  const prompt = document.getElementById('prompt');
  const budget = document.getElementById('budget');
  const send = document.getElementById('send');

  function add(html) {
    const div = document.createElement('div');
    div.className = 'msg';
    div.innerHTML = html;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }
  function escape(s) { return String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
  function tierBadge(t) { return '<span class="badge t' + t + '">T' + t + '</span>'; }

  send.onclick = () => {
    const text = prompt.value.trim();
    if (!text) return;
    const b = Number(budget.value) || 0.05;
    vscode.postMessage({ type: 'setBudget', value: b });
    const div = document.createElement('div');
    div.className = 'msg user';
    div.textContent = text;
    log.appendChild(div);
    vscode.postMessage({ type: 'send', prompt: text });
    prompt.value = '';
  };
  prompt.addEventListener('keydown', e => { if (e.key === 'Enter') send.click(); });

  window.addEventListener('message', e => {
    const ev = e.data;
    if (ev.type === 'route') {
      add('<div class="meta">' + tierBadge(ev.tier) + 'route &rarr; ' + escape(ev.provider) + ' &mdash; ' + escape(ev.reason) + '</div>');
    } else if (ev.type === 'assistant') {
      add('<div class="meta">' + tierBadge(ev.tier) + 'assistant &middot; $' + ev.cost.toFixed(5) + '</div>' + escape(ev.text));
    } else if (ev.type === 'tool_call') {
      add('<div class="meta">tool_call</div><div class="tool">' + escape(ev.name) + '(' + escape(JSON.stringify(ev.args)) + ')</div>');
    } else if (ev.type === 'tool_result') {
      add('<div class="meta">tool_result</div><div class="tool">' + escape(ev.result) + '</div>');
    } else if (ev.type === 'budget') {
      add('<div class="meta">budget &middot; $' + ev.spent_usd.toFixed(5) + ' / $' + ev.envelope_usd.toFixed(3) + ' (' + Math.round(ev.fraction_used*100) + '%)</div>');
    } else if (ev.type === 'done') {
      add('<div class="meta">&#10003; done</div>' + escape(ev.final || ''));
    } else if (ev.type === 'error') {
      add('<div class="meta" style="color:#e06c6c">error</div>' + escape(ev.message));
    }
  });
</script>
</body></html>`;
    }
}
exports.ChatPanel = ChatPanel;
//# sourceMappingURL=chatPanel.js.map