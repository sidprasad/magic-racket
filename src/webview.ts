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

export function launchCnDWebview(context: vscode.ExtensionContext, payload: CnDGraph) {
  lastCnDGraph = payload;
  const column = vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.One;
  if (cndPanel) {
    cndPanel.reveal(column);
    cndPanel.webview.postMessage({ type: 'update', graph: payload });
    return;
  }
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
  cndPanel.webview.html = getCnDWebviewContentFromFile(context, cndJsUri, styleUri, payload);
  cndPanel.onDidDispose(() => { cndPanel = undefined; });
  webview.onDidReceiveMessage(msg => {
    // Optionally handle messages from the webview
  });
}

export function showLastCnDGraph(context: vscode.ExtensionContext) {
  if (lastCnDGraph) {
    launchCnDWebview(context, lastCnDGraph);
  } else {
    vscode.window.showInformationMessage('No CnD graph has been received yet.');
  }
}

function getCnDWebviewContentFromFile(
  context: vscode.ExtensionContext,
  jsUri: vscode.Uri,
  cssUri: vscode.Uri,
  graph: CnDGraph
): string {
  const htmlPath = path.join(context.extensionPath, 'media', 'cnd.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  html = html
    .replace('{{CND_JS}}', jsUri.toString())
    .replace('{{CND_CSS}}', cssUri.toString())
    .replace('{{CND_GRAPH}}', JSON.stringify(graph));
  return html;
}
