export function requestPlaybackSession(nav) {
  try {if(nav?.audioSession)nav.audioSession.type='playback';} catch { /* optional API */ }
}
export async function resumeAudioContext(context) {
  try {if(context && context.state!=='running' && context.state!=='closed')await context.resume();} catch { /* retry on the next user gesture */ }
}
