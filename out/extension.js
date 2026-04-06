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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const chatPanel_1 = require("./chatPanel");
const budgetStatusBar_1 = require("./budgetStatusBar");
const backendClient_1 = require("./backendClient");
let client;
let statusBar;
function activate(context) {
    statusBar = new budgetStatusBar_1.BudgetStatusBar();
    context.subscriptions.push(statusBar);
    client = new backendClient_1.BackendClient('ws://127.0.0.1:8765/ws');
    context.subscriptions.push(vscode.commands.registerCommand('nexuscode.openChat', () => {
        chatPanel_1.ChatPanel.createOrShow(context.extensionUri, client, statusBar);
    }), vscode.commands.registerCommand('nexuscode.setBudget', async () => {
        const v = await vscode.window.showInputBox({
            prompt: 'Per-task budget (USD)',
            value: '0.05',
            validateInput: (s) => (isNaN(Number(s)) ? 'must be a number' : null),
        });
        if (v) {
            const n = Number(v);
            chatPanel_1.ChatPanel.currentBudget = n;
            statusBar.setEnvelope(n);
            vscode.window.showInformationMessage(`NexusCode budget: $${n.toFixed(3)}`);
        }
    }));
    statusBar.setEnvelope(chatPanel_1.ChatPanel.currentBudget);
    statusBar.show();
}
function deactivate() {
    client?.close();
}
//# sourceMappingURL=extension.js.map