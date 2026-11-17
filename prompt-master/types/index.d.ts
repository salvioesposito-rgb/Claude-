export type Phase = 'idle' | 'working' | 'done'

declare module 'claude-code' {
  interface PluginState {
    'prompt-master': { phase: Phase; original: string | null }
  }
}
