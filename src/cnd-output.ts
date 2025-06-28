import * as vscode from 'vscode';
import { launchCnDWebview } from './webview';

// Helper: detect and parse [CND] lines
function tryParseCnDLine(line: string): any | undefined {
  const match = line.match(/^\[CND\]\s*(\{.*\})$/);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      vscode.window.showErrorMessage('Failed to parse CnD JSON: ' + e);
    }
  }
  return undefined;
}

// Example: hook for output lines from Racket subprocess
export function handleRacketOutputLine(context: vscode.ExtensionContext, line: string) {
  const cnd = tryParseCnDLine(line);
  if (cnd) {
    launchCnDWebview(context, cnd);
    return true;
  }
  return false;
}
