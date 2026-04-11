/*
 *   Copyright (c) 2025 NAME.
 *   All rights reserved.
 *   Unauthorized copying, modification, distribution, or use of this is prohibited without express written permission.
 */

import * as vscode from 'vscode';
import { ChatPanel } from './chatPanel';
import { BudgetStatusBar } from './budgetStatusBar';
import { BackendClient } from './backendClient';

let client: BackendClient;
let statusBar: BudgetStatusBar;

export function activate(context: vscode.ExtensionContext) {
  statusBar = new BudgetStatusBar();
  context.subscriptions.push(statusBar);

  client = new BackendClient('ws://127.0.0.1:8765/ws');

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
