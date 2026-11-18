export type Phase = 'idle' | 'working' | 'done'

export type TurnTokens = {
  input: number
  cacheRead: number
  cacheWrite: number
  output: number
}

declare module 'claude-code' {
  interface PluginState {
    'session-kit': {
      phase: Phase
      original: string | null
      last: TurnTokens | null
      total: TurnTokens
      turns: number
    }
  }
}
