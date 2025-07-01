import * as vscode from 'vscode';
import * as cp from 'child_process';
import { handleRacketOutputLine } from './cnd-output';

// Output channel for debugging
let outputChannel: vscode.OutputChannel | undefined;

function getOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel('CnD Terminal Debug');
  }
  return outputChannel;
}

export class CnDTerminal implements vscode.Pseudoterminal {
  private writeEmitter = new vscode.EventEmitter<string>();
  private closeEmitter = new vscode.EventEmitter<number>();
  private context: vscode.ExtensionContext;
  private process?: cp.ChildProcess;

  onDidWrite: vscode.Event<string> = this.writeEmitter.event;
  onDidClose: vscode.Event<number> = this.closeEmitter.event;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  open(): void {
    const output = getOutputChannel();
    output.appendLine('🔧 CnD Terminal opened');
    this.writeEmitter.fire('CnD-aware Racket Terminal\r\n');
  }

  close(): void {
    const output = getOutputChannel();
    output.appendLine('🔧 CnD Terminal closing...');
    if (this.process) {
      output.appendLine('🔧 Killing Racket process...');
      this.process.kill();
    }
  }

  handleInput(data: string): void {
    const output = getOutputChannel();
    output.appendLine(`📝 Terminal input: "${data}"`);
    if (this.process) {
      this.process.stdin?.write(data);
    } else {
      output.appendLine('❌ No process to send input to');
    }
  }

  runRacketFile(filePath: string, racketPath = 'racket'): void {
    const output = getOutputChannel();
    output.appendLine(`🚀 Starting Racket process: ${racketPath} ${filePath}`);
    
    this.writeEmitter.fire(`Running: ${racketPath} ${filePath}\r\n`);
    
    try {
      this.process = cp.spawn(racketPath, [filePath], {
        cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      if (!this.process) {
        throw new Error('Failed to spawn Racket process');
      }

      output.appendLine(`✅ Racket process spawned with PID: ${this.process.pid}`);

      this.process.stdout?.on('data', (data: Buffer) => {
        const outputText = data.toString();
        output.appendLine(`📤 Racket stdout: "${outputText}"`);
        this.writeEmitter.fire(outputText);
        
        // Check for CnD output
        const lines = outputText.split('\n');
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine.startsWith('[CND]')) {
            output.appendLine(`🎯 Detected CnD output in custom terminal: "${trimmedLine}"`);
            try {
              const handled = handleRacketOutputLine(this.context, trimmedLine);
              output.appendLine(`🔄 CnD line handling result: ${handled}`);
            } catch (error) {
              output.appendLine(`❌ Error handling CnD line: ${error}`);
              console.error('Error handling CnD line:', error);
            }
          }
        }
      });

      this.process.stderr?.on('data', (data: Buffer) => {
        const errorText = data.toString();
        output.appendLine(`📤 Racket stderr: "${errorText}"`);
        this.writeEmitter.fire(errorText);
      });

      this.process.on('error', (error) => {
        const errorMsg = `❌ Racket process error: ${error.message}`;
        output.appendLine(errorMsg);
        this.writeEmitter.fire(`\r\nProcess error: ${error.message}\r\n`);
        vscode.window.showErrorMessage(`Racket process error: ${error.message}`);
      });

      this.process.on('close', (code, signal) => {
        const closeMsg = `Process exited with code ${code}${signal ? ` (signal: ${signal})` : ''}`;
        output.appendLine(`🏁 ${closeMsg}`);
        this.writeEmitter.fire(`\r\n${closeMsg}\r\n`);
        this.closeEmitter.fire(code || 0);
      });

      this.process.on('exit', (code, signal) => {
        const exitMsg = `Process exit: code=${code}, signal=${signal}`;
        output.appendLine(`🏁 ${exitMsg}`);
      });

    } catch (error) {
      const errorMsg = `❌ Failed to start Racket process: ${error}`;
      output.appendLine(errorMsg);
      this.writeEmitter.fire(`\r\n${errorMsg}\r\n`);
      vscode.window.showErrorMessage(errorMsg);
    }
  }
}

export function createCnDTerminal(context: vscode.ExtensionContext, filePath: string): vscode.Terminal {
  const output = getOutputChannel();
  output.appendLine(`🔧 Creating CnD terminal for file: ${filePath}`);
  
  const pty = new CnDTerminal(context);
  const terminal = vscode.window.createTerminal({ name: 'CnD Racket', pty });
  
  // Auto-run the file
  setTimeout(() => {
    output.appendLine(`⏰ Auto-running file after timeout...`);
    pty.runRacketFile(filePath);
  }, 100);
  
  return terminal;
}
