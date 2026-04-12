
import * as vscode from 'vscode';
import { ChatPanel } from './chatPanel';
import { BudgetStatusBar } from './budgetStatusBar';
import { BackendClient } from './backendClient';

let client: BackendClient;
let statusBar: BudgetStatusBar;

export function activate(context: vscode.ExtensionContext) {
  statusBar = new BudgetStatusBar();
  context.subscriptions.push(statusBar);

  const url = vscode.workspace.getConfiguration('nexuscode').get<string>('backendUrl', 'ws://127.0.0.1:8765/ws');
  client = new BackendClient(url);

  context.subscriptions.push(
    vscode.commands.registerCommand('nexuscode.openChat', () => {
      ChatPanel.createOrShow(context.extensionUri, client, statusBar);
    }),
    vscode.commands.registerCommand('nexuscode.setBudget', async () => {
      const v = await vscode.window.showInputBox({
        prompt: 'Per-task budget (USD)',
        value: '0.05',
        validateInput: (s) => (isNaN(Number(s)) ? 'must be a number' : null),
      });
      if (v) {
        const n = Number(v);
        ChatPanel.currentBudget = n;
        statusBar.setEnvelope(n);
        vscode.window.showInformationMessage(`NexusCode budget: $${n.toFixed(3)}`);
      }
    })
  );

  statusBar.setEnvelope(ChatPanel.currentBudget);
  statusBar.show();
}

export function deactivate() {
  client?.close();
}
