# Prompt Master

Turns a rough, half-formed prompt into a clear, well-structured one before you send it.

Type your draft, then press **✨ Prompt Master** in the band just above the prompt box (or focus the band and press `p`). The draft is rewritten in place by a fast model call: the goal is stated up front, context and constraints are organized, and the expected output is spelled out, all without inventing details you didn't give. Review it, edit if you like, and press Enter to send. **Undo** restores your original draft.

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install prompt-master --marketplace salvioesposito-rgb/Claude-
```

Answer `y` to add the marketplace, then pick a scope (user scope loads it in every session).

From a shell:

```
claude plugin install prompt-master --marketplace salvioesposito-rgb/Claude-
```

In the desktop app: click + next to the prompt box, then Plugins, Add marketplace with `salvioesposito-rgb/Claude-`, then Add plugin.

If the repository is private, installing needs a git credential for github.com on that machine (an SSH key, or `gh auth login` then `gh auth setup-git`).
