# Claude-

Claude Code mods.

| Mod | What it does |
| --- | --- |
| [session-kit](./session-kit) | **Recommended.** Prompt Master and a token counter together: the button, plus the tokens of each answer, context fill and estimated session cost, with a one-click /compact when the context gets heavy. |
| [prompt-master](./prompt-master) | Adds a ✨ Prompt Master button above the prompt box that rewrites your rough draft into a clear, well-structured prompt before you send it. |

## Install

At the prompt of a Claude Code terminal session:

```
/plugin install session-kit --marketplace salvioesposito-rgb/Claude-
```

Answer `y` to add the marketplace, then pick a scope (user scope loads it in every session).

From a shell:

```
claude plugin install session-kit --marketplace salvioesposito-rgb/Claude-
```

In the desktop app: click + next to the prompt box, then Plugins, Add marketplace with `salvioesposito-rgb/Claude-`, then Add plugin.

If the repository is private, installing needs a git credential for github.com on that machine (an SSH key, or `gh auth login` then `gh auth setup-git`).

## Load it by hand in a cloud session (iPhone)

Paste this message in the session:

> Charge le skill plugin-authoring, puis copie le dossier `session-kit` du dépôt public github.com/salvioesposito-rgb/Claude- tel quel dans ton dossier de mods de session, pour que le mod se charge. Ne modifie pas son code.
