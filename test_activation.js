// Standalone test: load the installed extension in Node with a mock vscode
// module and verify activate() runs without throwing AND that both commands
// register. This is what was failing before (require('ws') threw, so activate
// never finished, so 'nexuscode.openChat' was never registered).

const path = require('path');
const Module = require('module');

const EXT = process.env.EXT_DIR;
if (!EXT) { console.error('EXT_DIR env var required'); process.exit(2); }

const registered = new Set();
const subscriptions = [];
const statusBarItems = [];

const vscodeMock = {
  StatusBarAlignment: { Left: 1, Right: 2 },
  ViewColumn: { Beside: -2 },
  commands: {
    registerCommand: (id, cb) => {
      registered.add(id);
      return { dispose() {} };
    },
  },
  window: {
    createStatusBarItem: () => {
      const item = {
        text: '', tooltip: '', command: '',
        show() { item._shown = true; },
        hide() {},
        dispose() {},
      };
      statusBarItems.push(item);
      return item;
    },
    createWebviewPanel: () => ({
      webview: { html: '', postMessage() {}, onDidReceiveMessage() {} },
      reveal() {}, onDidDispose() {},
    }),
    showInputBox: async () => undefined,
    showInformationMessage: () => {},
    activeTextEditor: undefined,
  },
  workspace: { workspaceFolders: undefined },
  Uri: { file: (p) => ({ fsPath: p }) },
};

// Intercept require('vscode')
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...rest) {
  if (request === 'vscode') return 'vscode';
  return origResolve.call(this, request, parent, ...rest);
};
require.cache['vscode'] = { id: 'vscode', filename: 'vscode', loaded: true, exports: vscodeMock };

const extPath = path.join(EXT, 'out', 'extension.js');
console.log('loading:', extPath);

let ext;
try {
  ext = require(extPath);
} catch (e) {
  console.error('REQUIRE FAILED:', e && e.stack || e);
  process.exit(1);
}

if (typeof ext.activate !== 'function') {
  console.error('FAIL: no activate() exported');
  process.exit(1);
}

const ctx = { subscriptions, extensionUri: { fsPath: EXT } };
try {
  ext.activate(ctx);
} catch (e) {
  console.error('ACTIVATE THREW:', e && e.stack || e);
  process.exit(1);
}

console.log('commands registered:', [...registered]);
console.log('status bar items created:', statusBarItems.length);
console.log('status bar shown:', statusBarItems[0] && statusBarItems[0]._shown);
console.log('status bar text:', statusBarItems[0] && statusBarItems[0].text);

const need = ['nexuscode.openChat', 'nexuscode.setBudget'];
const missing = need.filter(c => !registered.has(c));
if (missing.length) {
  console.error('FAIL: missing commands:', missing);
  process.exit(1);
}
if (!statusBarItems[0] || !statusBarItems[0]._shown) {
  console.error('FAIL: status bar not shown');
  process.exit(1);
}

console.log('PASS — extension activates cleanly, commands registered, status bar shown');
