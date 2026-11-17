import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Phase } from '../types'

const phase = atom({ plugin: 'prompt-master', key: 'phase' } as const, 'idle' as Phase)
const original = atom({ plugin: 'prompt-master', key: 'original' } as const, null as string | null)

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
    $.ui.toast('Prompt Master: type a rough prompt first')
    return
  }
  await update($, phase, () => 'working')
  $.ui.status('Prompt Master: rewriting…')
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
      $.ui.toast(`Prompt Master: couldn't rewrite (${r.isAnswered ? 'empty reply' : r.reason})`)
      await update($, phase, () => 'idle')
      return
    }
    const filled = await $.prompt.fill({ text: r.text.trim(), mode: 'replace' })
    if (!filled.isFilled) {
      $.ui.toast('Prompt Master: the prompt box is busy, try again')
      await update($, phase, () => 'idle')
      return
    }
    await update($, original, () => text)
    await update($, phase, () => 'done')
  } finally {
    $.ui.status(undefined)
  }
}

export const register: Register = on => {
  on('prompt.submit', async ($, e, next) => {
    const result = await next(e)
    await update($, original, () => null).catch(() => undefined)
    await update($, phase, () => 'idle').catch(() => undefined)
    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const { Box, Button, Text } = $.ui.resolve(e)
    const p = await read($, phase)
    const prev = await read($, original)

    return (
      <Box flexDirection="row" gap={1}>
        <Button
          key="prompt-master"
          variant="primary"
          hotkey="p"
          label={p === 'working' ? '✨ Rewriting…' : '✨ Prompt Master'}
          onPress={() => rewrite($)}
        />
        {p === 'done' && prev !== null ? (
          <Button
            key="undo"
            dimColor
            label="Undo"
            onPress={async () => {
              await $.prompt.fill({ text: prev, mode: 'replace' })
              await update($, original, () => null)
              await update($, phase, () => 'idle')
            }}
          />
        ) : null}
        {p === 'done' ? <Text dimColor>Rewritten. Review it, then send.</Text> : null}
      </Box>
    )
  })
}
