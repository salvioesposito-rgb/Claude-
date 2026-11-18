import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Phase, TurnTokens } from '../types'

// ---------- Prompt Master: rewrite the draft in the prompt box ----------

const phase = atom({ plugin: 'session-kit', key: 'phase' } as const, 'idle' as Phase)
const original = atom({ plugin: 'session-kit', key: 'original' } as const, null as string | null)

const SYSTEM = `You are Prompt Master, an expert prompt engineer. The user gives you a rough draft of a prompt they are about to send to Claude, an AI coding and work assistant. Rewrite it into a better prompt.

Rules:
- Keep the user's intent, facts, names, file paths, code and constraints exactly. Never invent requirements, files or details they did not give.
- Make the goal explicit in the first sentence.
- Add helpful structure only when it earns its place: context, the specific task, constraints, and what a good result looks like (output format, done criteria).
- Fix spelling and grammar, remove filler, resolve vague words into concrete asks where the draft makes the meaning clear.
- Keep it proportionate: a one-line ask stays short. Do not pad.
- Write in the user's voice ("I", "my"), addressed to the assistant, in the draft's language.
- Output ONLY the rewritten prompt: no preamble, no quotes, no explanation, no markdown code fence around it.`

async function rewrite($: EngineInterface): Promise<void> {
  if ((await read($, phase)) === 'working') return
  const { text } = await $.prompt.read()
  const draft = text.trim()
  if (!draft) {
    $.ui.toast('Prompt Master : écris d’abord ton prompt brouillon')
    return
  }
  await update($, phase, () => 'working')
  $.ui.status('Prompt Master : réécriture…')
  try {
    const r = await $.model.complete({
      model: 'sonnet',
      system: SYSTEM,
      prompt: `Rough draft:\n<draft>\n${draft}\n</draft>`,
      maxTokens: 4000,
      effort: 'low',
      timeoutMs: 60000,
    })
    if (!r.isAnswered || !r.text.trim()) {
      $.ui.toast(`Prompt Master : échec de la réécriture (${r.isAnswered ? 'réponse vide' : r.reason})`)
      await update($, phase, () => 'idle')
      return
    }
    const filled = await $.prompt.fill({ text: r.text.trim(), mode: 'replace' })
    if (!filled.isFilled) {
      $.ui.toast('Prompt Master : la zone de saisie est occupée, réessaie')
      await update($, phase, () => 'idle')
      return
    }
    await update($, original, () => text)
    await update($, phase, () => 'done')
  } finally {
    $.ui.status(undefined)
  }
}

async function undo($: EngineInterface, prev: string): Promise<void> {
  await $.prompt.fill({ text: prev, mode: 'replace' })
  await update($, original, () => null)
  await update($, phase, () => 'idle')
}

// ---------- Token counter ----------

const ZERO: TurnTokens = { input: 0, cacheRead: 0, cacheWrite: 0, output: 0 }
const last = atom({ plugin: 'session-kit', key: 'last' } as const, null as TurnTokens | null)
const total = atom({ plugin: 'session-kit', key: 'total' } as const, ZERO)
const turns = atom({ plugin: 'session-kit', key: 'turns' } as const, 0)

// Above this share of the context window, suggest compacting.
const WARN_PERCENT = 50

function k(n: number): string {
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`
  return `${(n / 1_000_000).toFixed(2)}M`
}

function sum(t: TurnTokens): number {
  return t.input + t.cacheRead + t.cacheWrite + t.output
}

// ---------- Hooks ----------

export const register: Register = on => {
  on('prompt.submit', async ($, e, next) => {
    const result = await next(e)
    await update($, original, () => null).catch(() => undefined)
    await update($, phase, () => 'idle').catch(() => undefined)
    return result
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    const u = e.usage
    if (u && !e.agentId) {
      const t: TurnTokens = {
        input: u.input_tokens,
        cacheRead: u.cache_read_input_tokens,
        cacheWrite: u.cache_creation_input_tokens,
        output: u.output_tokens,
      }
      await update($, last, () => t)
      await update($, total, prev => ({
        input: prev.input + t.input,
        cacheRead: prev.cacheRead + t.cacheRead,
        cacheWrite: prev.cacheWrite + t.cacheWrite,
        output: prev.output + t.output,
      }))
      await update($, turns, n => n + 1)
    }
    return result
  })

  // One row in the band: a plugin's AbovePrompt hooks share one chain, so both tools draw here.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const { Box, Button, Text } = $.ui.resolve(e)

    const p = await read($, phase)
    const prev = await read($, original)
    const t = await read($, last)
    const all = await read($, total)
    const n = await read($, turns)
    const { context, cost } = await $.session.usage()
    const pct = context.percent ?? 0
    const isHeavy = pct >= WARN_PERCENT && !e.props.isWorking

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" gap={1}>
          <Button
            key="prompt-master"
            variant="primary"
            hotkey="p"
            label={p === 'working' ? '✨ Réécriture…' : '✨ Prompt Master'}
            onPress={() => rewrite($)}
          />
          {p === 'done' && prev !== null ? (
            <Button key="undo" dimColor label="Annuler" onPress={() => undo($, prev)} />
          ) : null}
          {p === 'done' ? <Text dimColor>Réécrit : relis, puis envoie.</Text> : null}
        </Box>
        <Text>
          <Text bold>🔢 Dernier tour</Text>{' '}
          {t
            ? `${k(sum(t))} tokens (lus en cache ${k(t.cacheRead)} · nouveaux ${k(t.input + t.cacheWrite)} · réponse ${k(t.output)})`
            : 'pas encore de réponse'}
        </Text>
        <Text dimColor>
          Contexte {context.tokens !== undefined ? `${k(context.tokens)} / ${k(context.window)} (${pct} %)` : 'inconnu'}
          {' · '}Session {n} tours, {k(sum(all))} tokens
          {cost ? ` · ≈ ${cost.usd.toFixed(2)} $ (estimation)` : ''}
        </Text>
        {isHeavy ? (
          <Box flexDirection="row" gap={1}>
            <Text color="yellow">⚠ Contexte chargé : chaque message le relit.</Text>
            <Button key="compact" label="Résumer (/compact)" onPress={() => $.session.compact()} />
          </Box>
        ) : null}
      </Box>
    )
  })
}
