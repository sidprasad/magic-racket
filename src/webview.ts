import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface CnDGraphAtom {
  id: string;
  label: string;
  type: string;
}

export interface CnDGraphRelation {
  src: string;
  label: string;
  dst: string;
}

export interface CnDGraph {
  atoms: CnDGraphAtom[];
  relations: CnDGraphRelation[];
}

let cndPanel: vscode.WebviewPanel | undefined;
let lastCnDGraph: CnDGraph | undefined;

// Output channel for debugging
let outputChannel: vscode.OutputChannel | undefined;

function getOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel('CnD Webview Debug');
  }
  return outputChannel;
}

export function launchCnDWebview(context: vscode.ExtensionContext, payload: CnDGraph): void {
  const output = getOutputChannel();
  output.appendLine(`🚀 Launching CnD webview with payload: ${JSON.stringify(payload, null, 2)}`);
  
  try {
    lastCnDGraph = payload;
    const column = vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.One;
    
    if (cndPanel) {
      output.appendLine(`♻️  Reusing existing webview panel`);
      cndPanel.reveal(column);
      cndPanel.webview.postMessage({ type: 'update', graph: payload });
      return;
    }
    
    output.appendLine(`🆕 Creating new webview panel`);
    cndPanel = vscode.window.createWebviewPanel(
      'cndGraph',
      'CnD Graph Visualization',
      column,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.extensionPath, 'media'))
        ]
      }
    );
    
    const webview = cndPanel.webview;
    const mediaPath = (file: string) => webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'media', file)));
    const cndJsUri = mediaPath('cnd.js');
    const styleUri = mediaPath('style.css');
    
    output.appendLine(`📄 Generating webview HTML content`);
    cndPanel.webview.html = getCnDWebviewContentFromFile(context, cndJsUri, styleUri, payload);
    
    cndPanel.onDidDispose(() => { 
      output.appendLine(`🗑️  Webview panel disposed`);
      cndPanel = undefined; 
    });
    
    webview.onDidReceiveMessage(msg => {
      output.appendLine(`📨 Received message from webview: ${JSON.stringify(msg)}`);
      // Optionally handle messages from the webview
    });
    
    output.appendLine(`✅ CnD webview launched successfully`);
  } catch (error) {
    const errorMsg = `❌ Error launching CnD webview: ${error}`;
    output.appendLine(errorMsg);
    console.error(errorMsg, error);
    vscode.window.showErrorMessage(errorMsg);
  }
}

export function showLastCnDGraph(context: vscode.ExtensionContext): void {
  const output = getOutputChannel();
  if (lastCnDGraph) {
    output.appendLine(`📊 Showing last CnD graph`);
    launchCnDWebview(context, lastCnDGraph);
  } else {
    output.appendLine(`ℹ️  No CnD graph available to show`);
    vscode.window.showInformationMessage('No CnD graph has been received yet.');
  }
}

function getCnDWebviewContentFromFile(
  context: vscode.ExtensionContext,
  jsUri: vscode.Uri,
  cssUri: vscode.Uri,
  graph: CnDGraph
): string {
  const output = getOutputChannel();
  
  try {
    const htmlPath = path.join(context.extensionPath, 'media', 'cnd.html');
    output.appendLine(`📖 Reading HTML template from: ${htmlPath}`);
    
    if (!fs.existsSync(htmlPath)) {
      throw new Error(`HTML template not found at: ${htmlPath}`);
    }
    
    let html = fs.readFileSync(htmlPath, 'utf8');
    output.appendLine(`📖 HTML template read successfully (${html.length} chars)`);
    
    // Get additional script URIs
    const mediaPath = (file: string) => context.asAbsolutePath(path.join('media', file));
    const d3JsUri = vscode.Uri.file(mediaPath('vendor/d3.v4.min.js'));
    const colaJsUri = vscode.Uri.file(mediaPath('vendor/cola.js'));
    const cndCoreJsUri = vscode.Uri.file(mediaPath('cnd-core-complete.global.js'));
    
    // Verify files exist
    const filesToCheck = [
      { path: mediaPath('vendor/d3.v4.min.js'), name: 'D3.js' },
      { path: mediaPath('vendor/cola.js'), name: 'WebCola' },
      { path: mediaPath('cnd-core-complete.global.js'), name: 'CnD Core' },
      { path: mediaPath('cnd.js'), name: 'CnD Script' },
    ];
    
    for (const file of filesToCheck) {
      if (!fs.existsSync(file.path)) {
        throw new Error(`Required file ${file.name} not found at: ${file.path}`);
      }
      output.appendLine(`✅ Found ${file.name} at: ${file.path}`);
    }
    
    // Get webview URIs
    const webview = cndPanel?.webview;
    if (!webview) throw new Error('Webview not available');
    
    // Replace placeholders
    html = html
      .replace('{{CND_JS}}', webview.asWebviewUri(jsUri).toString())
      .replace('{{CND_CSS}}', webview.asWebviewUri(cssUri).toString())
      .replace('{{D3_JS}}', webview.asWebviewUri(d3JsUri).toString())
      .replace('{{COLA_JS}}', webview.asWebviewUri(colaJsUri).toString())
      .replace('{{CND_CORE_JS}}', webview.asWebviewUri(cndCoreJsUri).toString())
      .replace('{{CND_GRAPH}}', JSON.stringify(graph));
    
    output.appendLine(`✅ HTML content generated successfully (${html.length} chars)`);
    return html;
  } catch (error) {
    const errorMsg = `❌ Error generating webview content: ${error}`;
    output.appendLine(errorMsg);
    throw error;
  }
}
