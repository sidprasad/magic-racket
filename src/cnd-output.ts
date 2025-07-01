import * as vscode from 'vscode';
import { launchCnDWebview, CnDGraph } from './webview';

// Output channel for debugging
let outputChannel: vscode.OutputChannel | undefined;

function getOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel('CnD Debug');
  }
  return outputChannel;
}

// Helper: detect and parse [CND] lines
function tryParseCnDLine(line: string): CnDGraph | undefined {
  const output = getOutputChannel();
  output.appendLine(`🔍 Checking line: "${line}"`);
  
  const match = line.match(/^\[CND\]\s*(\{.*\})$/);
  if (match) {
    output.appendLine(`✅ Found CnD line, JSON part: "${match[1]}"`);
    try {
      const parsed = JSON.parse(match[1]) as CnDGraph;
      output.appendLine(`✅ Successfully parsed JSON: ${JSON.stringify(parsed, null, 2)}`);
      
      // Validate structure
      if (!parsed.atoms || !Array.isArray(parsed.atoms) || !parsed.relations || !Array.isArray(parsed.relations)) {
        throw new Error('Invalid CnD graph structure: missing atoms or relations arrays');
      }
      
      return parsed;
    } catch (e) {
      const errorMsg = `❌ Failed to parse CnD JSON: ${e}`;
      output.appendLine(errorMsg);
      vscode.window.showErrorMessage(errorMsg);
    }
  } else {
    output.appendLine(`❌ Line doesn't match CnD pattern`);
  }
  return undefined;
}

// Example: hook for output lines from Racket subprocess
export function handleRacketOutputLine(context: vscode.ExtensionContext, line: string): boolean {
  const output = getOutputChannel();
  output.appendLine(`📥 Handling Racket output line: "${line}"`);
  
  try {
    const cnd = tryParseCnDLine(line);
    if (cnd) {
      output.appendLine(`🚀 Launching CnD webview with data...`);
      launchCnDWebview(context, cnd);
      output.appendLine(`✅ CnD webview launched successfully`);
      return true;
    }
    output.appendLine(`ℹ️  Line was not a CnD line, ignoring`);
    return false;
  } catch (error) {
    const errorMsg = `❌ Error in handleRacketOutputLine: ${error}`;
    output.appendLine(errorMsg);
    console.error(errorMsg, error);
    vscode.window.showErrorMessage(errorMsg);
    return false;
  }
}
