
import * as vscode from 'vscode';
import { BackendClient, ServerEvent } from './backendClient';
import { BudgetStatusBar } from './budgetStatusBar';

export class ChatPanel {
  static current?: ChatPanel;
  static currentBudget = 0.05;

  static createOrShow(extensionUri: vscode.Uri, client: BackendClient, statusBar: BudgetStatusBar) {
    const column = vscode.window.activeTextEditor?.viewColumn;
    if (ChatPanel.current) {
      ChatPanel.current.panel.reveal(column);
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      'nexuscodeChat',
      'NexusCode',
      column ?? vscode.ViewColumn.Beside,
      { enableScripts: true, retainContextWhenHidden: true }
    );
    ChatPanel.current = new ChatPanel(panel, client, statusBar);
  }

  private unsubscribe?: () => void;

  private constructor(
    private readonly panel: vscode.WebviewPanel,
    private readonly client: BackendClient,
    private readonly statusBar: BudgetStatusBar,
  ) {
    panel.webview.html = this.html();
    panel.onDidDispose(() => {
      this.unsubscribe?.();
      ChatPanel.current = undefined;
    });

    this.unsubscribe = client.onEvent((e: ServerEvent) => {
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
        } catch (err: any) {
          this.panel.webview.postMessage({ type: 'error', message: String(err?.message ?? err) });
        }
      } else if (msg.type === 'cancel') {
        client.cancel();
      } else if (msg.type === 'setBudget') {
        ChatPanel.currentBudget = Number(msg.value) || 0.05;
        this.statusBar.setEnvelope(ChatPanel.currentBudget);
      }
    });
  }

  private html(): string {
    return /* html */ `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  body { font-family: var(--vscode-font-family); color: var(--vscode-foreground); background: var(--vscode-editor-background); margin: 0; padding: 12px; }
  #log { height: calc(100vh - 140px); overflow-y: auto; border: 1px solid var(--vscode-panel-border); padding: 8px; border-radius: 4px; }
  .msg { margin-bottom: 10px; padding: 8px; border-radius: 4px; background: var(--vscode-editor-inactiveSelectionBackground); white-space: pre-wrap; }
  .msg.user { background: var(--vscode-textBlockQuote-background); }
  .msg.warn { background: rgba(180, 120, 0, 0.15); border-left: 3px solid #d39a1a; }
  .msg.debug { background: transparent; padding: 2px 8px; opacity: 0.55; font-size: 10px; font-family: var(--vscode-editor-font-family); }
  .meta { font-size: 11px; opacity: 0.7; margin-bottom: 4px; }
  .badge { display: inline-block; padding: 1px 6px; border-radius: 8px; font-size: 10px; margin-right: 6px; }
  .t0 { background: #2d7a2d; color: white; }
  .t1 { background: #2d5d8a; color: white; }
  .t2 { background: #8a2d2d; color: white; }
  .tool { font-family: var(--vscode-editor-font-family); font-size: 12px; opacity: 0.85; }
  .thinking { display: flex; align-items: center; gap: 8px; padding: 10px 12px; }
  .thinking .cat { font-size: 20px; animation: purr 1.2s ease-in-out infinite; }
  @keyframes purr { 0%,100% { transform: scale(1) rotate(0deg); } 50% { transform: scale(1.1) rotate(-3deg); } }
  .thinking .dots { display: flex; gap: 4px; align-items: center; }
  .thinking .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--vscode-foreground); opacity: 0.4; animation: bounce 1.4s ease-in-out infinite; }
  .thinking .dot:nth-child(2) { animation-delay: 0.2s; }
  .thinking .dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes bounce { 0%,80%,100% { transform: translateY(0); opacity: 0.4; } 40% { transform: translateY(-4px); opacity: 1; } }
  #welcome { text-align: center; padding: 40px 20px; opacity: 0.7; }
  #welcome h2 { font-size: 18px; margin-bottom: 8px; }
  #welcome p { font-size: 13px; margin: 4px 0; }
  #welcome code { background: var(--vscode-textCodeBlock-background); padding: 2px 6px; border-radius: 3px; font-size: 12px; }
  #status { font-size: 11px; padding: 4px 8px; text-align: right; opacity: 0.6; }
  .dot-status { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 4px; vertical-align: middle; }
  .dot-status.connected { background: #2d7a2d; }
  .dot-status.disconnected { background: #8a2d2d; }
  #thinkingBar { display: flex; align-items: center; gap: 8px; padding: 6px 8px; }
  #stopBtn { background: #8a2d2d; color: white; border: 0; padding: 3px 10px; border-radius: 3px; cursor: pointer; font-size: 11px; margin-left: auto; }
  #thinkingBar .cat { font-size: 18px; animation: purr 1.2s ease-in-out infinite; }
  #thinkingBar .dots { display: flex; gap: 4px; align-items: center; }
  #thinkingBar .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--vscode-foreground); opacity: 0.4; animation: bounce 1.4s ease-in-out infinite; }
  #thinkingBar .dot:nth-child(2) { animation-delay: 0.2s; }
  #thinkingBar .dot:nth-child(3) { animation-delay: 0.4s; }
  .retry-btn { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 0; padding: 4px 10px; border-radius: 3px; cursor: pointer; font-size: 11px; margin-top: 6px; }
  #row { display: flex; gap: 6px; margin-top: 8px; }
  #prompt { flex: 1; padding: 6px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; }
  #budget { width: 70px; padding: 6px; background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); border-radius: 4px; }
  button { padding: 6px 12px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: 0; border-radius: 4px; cursor: pointer; }
</style></head>
<body>
  <div id="log">
    <div id="welcome">
      <h2>NexusCode</h2>
      <p>Cost-aware coding agent</p>
      <p style="margin-top:12px; font-size:12px; opacity:0.8;">Try: <code>read and explain server.py</code></p>
    </div>
  </div>
  <div id="status"><span style="font-size:14px; margin-right:4px;">\ud83d\udc31</span><span class="dot-status disconnected" id="statusDot"></span><span id="statusText">Connecting...</span></div>
  <div id="thinkingBar" style="display:none;"><span class="cat">\ud83d\udc31</span><div class="dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div><button id="stopBtn">Stop</button></div>
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
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const stopBtn = document.getElementById('stopBtn');
  var lastPrompt = '';

  stopBtn.onclick = () => {
    vscode.postMessage({ type: 'cancel' });
    removeThinkingNow();
    add('<div class="meta" style="color:#e0a030">stopped by user</div>');
  };

  function setConnected(ok, text) {
    statusDot.className = 'dot-status ' + (ok ? 'connected' : 'disconnected');
    statusText.textContent = text;
  }

  function add(html, extraClass) {
    const div = document.createElement('div');
    div.className = extraClass ? ('msg ' + extraClass) : 'msg';
    div.innerHTML = html;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }
  function escape(s) { return String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
  function tierBadge(t) { return '<span class="badge t' + t + '">T' + t + '</span>'; }

  var thinkingShownAt = 0;
  var pendingRemove = false;
  var pendingMessages = [];

  const thinkingBar = document.getElementById('thinkingBar');

  function showThinking() {
    pendingRemove = false;
    pendingMessages = [];
    thinkingBar.style.display = 'flex';
    thinkingShownAt = Date.now();
  }
  function removeThinkingNow() {
    thinkingBar.style.display = 'none';
  }
  function removeThinking() {
    const elapsed = Date.now() - thinkingShownAt;
    const MIN_SHOW = 600;
    if (elapsed >= MIN_SHOW) {
      removeThinkingNow();
      return true;
    }
    if (!pendingRemove) {
      pendingRemove = true;
      setTimeout(() => {
        removeThinkingNow();
        pendingMessages.forEach(fn => fn());
        pendingMessages = [];
        pendingRemove = false;
      }, MIN_SHOW - elapsed);
    }
    return false;
  }

  send.onclick = () => {
    const text = prompt.value.trim();
    if (!text) return;
    const welcome = document.getElementById('welcome');
    if (welcome) welcome.remove();
    const b = Number(budget.value) || 0.05;
    vscode.postMessage({ type: 'setBudget', value: b });
    const div = document.createElement('div');
    div.className = 'msg user';
    div.textContent = text;
    log.appendChild(div);
    lastPrompt = text;
    vscode.postMessage({ type: 'send', prompt: text });
    prompt.value = '';
    showThinking();
  };
  prompt.addEventListener('keydown', e => { if (e.key === 'Enter') send.click(); });

  function renderEvent(ev) {
    if (ev.type === '_connected') {
      setConnected(true, 'Connected');
      return;
    } else if (ev.type === '_disconnected') {
      setConnected(false, 'Disconnected \u2014 ' + ev.reason);
      return;
    }
    if (ev.type === 'route') {
      add('<div class="meta">' + tierBadge(ev.tier) + 'route &rarr; ' + escape(ev.provider) + ' &mdash; ' + escape(ev.reason) + '</div>');
    } else if (ev.type === 'provider_failed') {
      // Surface provider fallbacks instead of silently showing two consecutive
      // route cards. This fixes the "two responses on hi" confusion when
      // MiniMax fails (e.g. insufficient balance) and Gemini picks it up.
      add('<div class="meta">\ud83d\ude3f ' + escape(ev.provider) + ' failed &mdash; falling back</div><div class="tool">' + escape(ev.message) + '</div>', 'warn');
    } else if (ev.type === 'buffer') {
      // Compact debug row: shows context-optimization metrics per step.
      // Rendered subtly so it doesn't overwhelm the chat.
      const comp = ev.raw_tokens_est > 0
        ? ' (' + Math.round(100 * ev.rendered_tokens_est / ev.raw_tokens_est) + '%)'
        : '';
      add('ctx &middot; step ' + ev.step + ' &middot; msgs=' + ev.n_messages + ' &middot; tok: ' + ev.raw_tokens_est + '&rarr;' + ev.rendered_tokens_est + comp + ' &middot; stable=' + ev.stable_prefix_len, 'debug');
    } else if (ev.type === 'assistant') {
      add('<div class="meta">' + tierBadge(ev.tier) + 'assistant &middot; $' + ev.cost.toFixed(5) + '</div>' + escape(ev.text));
    } else if (ev.type === 'tool_call') {
      add('<div class="meta">tool_call</div><div class="tool">' + escape(ev.name) + '(' + escape(JSON.stringify(ev.args)) + ')</div>');
    } else if (ev.type === 'tool_result') {
      add('<div class="meta">tool_result</div><div class="tool">' + escape(ev.result) + '</div>');
    } else if (ev.type === 'budget') {
      var cacheSuffix = '';
      if (typeof ev.cache_hit_rate === 'number' && ev.cache_hit_rate > 0) {
        cacheSuffix = ' &middot; cache ' + Math.round(ev.cache_hit_rate * 100) + '% (saved $' + (ev.cache_saved_usd || 0).toFixed(5) + ')';
      }
      add('<div class="meta">budget &middot; $' + ev.spent_usd.toFixed(5) + ' / $' + ev.envelope_usd.toFixed(3) + ' (' + Math.round(ev.fraction_used*100) + '%)' + cacheSuffix + '</div>');
    } else if (ev.type === 'done') {
      add('<div class="meta">&#10003; done</div>');
    } else if (ev.type === 'error') {
      const retryId = 'retry-' + Date.now();
      add('<div class="meta" style="color:#e06c6c">error</div>' + escape(ev.message) + '<br><button class="retry-btn" id="' + retryId + '">Retry</button>');
      setTimeout(() => {
        const btn = document.getElementById(retryId);
        if (btn) btn.onclick = () => {
          if (!lastPrompt) return;
          btn.disabled = true;
          btn.textContent = 'Retrying...';
          // Remove all other retry buttons to prevent spam
          document.querySelectorAll('.retry-btn').forEach(b => { if (b !== btn) b.remove(); });
          showThinking();
          vscode.postMessage({ type: 'send', prompt: lastPrompt });
        };
      }, 0);
    }
  }

  window.addEventListener('message', e => {
    const ev = e.data;
    const isEnd = ev.type === 'assistant' || ev.type === 'done' || ev.type === 'error';
    if (isEnd) {
      const removed = removeThinking();
      if (!removed) {
        pendingMessages.push(() => renderEvent(ev));
        return;
      }
    }
    renderEvent(ev);
  });
</script>
</body></html>`;
  }
}
