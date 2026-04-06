import * as vscode from 'vscode';

export class BudgetStatusBar implements vscode.Disposable {
  private item: vscode.StatusBarItem;
  private envelope = 0.05;
  private spent = 0;

  constructor() {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.item.command = 'codegenie.setBudget';
    this.render();
  }

  setEnvelope(v: number) {
    this.envelope = v;
    this.spent = 0;
    this.render();
  }

  setSpent(v: number) {
    this.spent = v;
    this.render();
  }

  show() { this.item.show(); }

  private render() {
    const frac = this.envelope > 0 ? Math.min(1, this.spent / this.envelope) : 0;
    const filled = Math.round(frac * 6);
    const bar = '\u2593'.repeat(filled) + '\u2591'.repeat(6 - filled);
    this.item.text = `$(rocket) CodeGenie  $${this.spent.toFixed(3)} / $${this.envelope.toFixed(3)}  ${bar}`;
    this.item.tooltip = `CodeGenie budget: ${(frac * 100).toFixed(0)}% used. Click to change.`;
  }

  dispose() { this.item.dispose(); }
}
