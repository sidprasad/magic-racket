

- webview.ts implements the webview logic and exposes `launchCnDWebview` and `showLastCnDGraph`.
- cnd-output.ts provides a handler to detect and parse `[CND] { ... }` lines and launch the webview.
- extension.ts is set up to register the new `Magic Racket: Show Last CnD Graph` command and is ready to call the handler from output hooks.
- The new command is registered in package.json for the VSCode command palette.

**TODO**
- Integrate the call to `handleRacketOutputLine(context, line)` wherever the extension receives output lines from the Racket subprocess (e.g., in the process/terminal output handling logic).
- Ensure  `media/cnd.js` and (optionally) `media/style.css` are present and implement the `renderCnDGraph` function.
