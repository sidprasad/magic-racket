import * as vscode from 'vscode';
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
  cndPanel.webview.html = getCnDWebviewContent(cndJsUri, styleUri, payload);
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

function getCnDWebviewContent(jsUri: vscode.Uri, cssUri: vscode.Uri, graph: CnDGraph): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link rel="stylesheet" href="${cssUri}">
      <title>CnD Graph Visualization</title>
    </head>
    <body>
      <div id="cnd-root"></div>
      <script>
        const initialGraph = ${JSON.stringify(graph)};
        window.addEventListener('message', event => {
          if (event.data && event.data.type === 'update') {
            renderCnDGraph(event.data.graph);
          }
        });
        window.renderCnDGraph = window.renderCnDGraph || function(graph) {
          // This will be replaced by cnd.js
        };
        // Initial render
        window.addEventListener('DOMContentLoaded', () => {
          renderCnDGraph(initialGraph);
        });
      </script>
      <script src="${jsUri}"></script>
    </body>
    </html>
  `;
}
