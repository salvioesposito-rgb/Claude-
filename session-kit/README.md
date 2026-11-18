# Session Kit

Two tools in one mod, shown in the band above the prompt box:

- **✨ Prompt Master**: type a rough prompt, press the button, and it is rewritten in place into a clear, well-structured prompt (goal first, context, constraints, expected result) without inventing details. Review it, then send. **Annuler** restores your draft.
- **🔢 Token counter**: tokens used by the last answer (read from cache, new, output), how full the context window is, and the session's turns, total tokens and estimated cost. Past 50 % of context it offers a **Résumer (/compact)** button, since every message re-reads the whole context. The cost is a local estimate, not your bill.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install session-kit --marketplace salvioesposito-rgb/Claude-
```

## Load it by hand in a cloud session (iPhone)

Paste this message in the session:

> Charge le skill plugin-authoring, puis copie le dossier `session-kit` du dépôt public github.com/salvioesposito-rgb/Claude- tel quel dans ton dossier de mods de session, pour que le mod se charge. Ne modifie pas son code.

Answer **Turn them on** if asked; the buttons appear when the answer ends.
