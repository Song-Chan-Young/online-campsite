// Distinguish a tap from a swipe/pinch, including drags that return to their origin.
export function createTapGesture() {
  const pointers = new Set();
  let tap = null;
  const moved = e => tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > tap.threshold;
  return {
    down(e) {
      if (e.button !== 0) return;
      pointers.add(e.pointerId);
      if (pointers.size !== 1) { tap = null; return; }
      tap = { id: e.pointerId, x: e.clientX, y: e.clientY, time: e.timeStamp,
        threshold: e.pointerType === 'touch' ? 12 : 6 };
    },
    move(e) { if (tap?.id === e.pointerId && moved(e)) tap = null; },
    up(e) {
      const ok = e.button === 0 && pointers.size === 1 && tap?.id === e.pointerId
        && !moved(e) && e.timeStamp - tap.time < 700;
      pointers.delete(e.pointerId);
      tap = null;
      return Boolean(ok);
    },
    cancel(e) { pointers.delete(e.pointerId); tap = null; },
    reset() { pointers.clear(); tap = null; },
  };
}

export function entryRedirect(address, server) {
  const url = new URL(address);
  url.searchParams.set('server', String(server));
  url.searchParams.set('enter', '1');
  return url.href;
}
export function consumeEntry(address) {
  const url = new URL(address);
  const enter = url.searchParams.get('enter') === '1';
  url.searchParams.delete('enter');
  return { enter, url: url.href };
}
export function randomNickname(random = Math.random) {
  const adjectives = ['고요한', '느긋한', '포근한', '반짝이는', '푸른', '따뜻한'];
  const nouns = ['도토리', '솔방울', '반딧불', '다람쥐', '모닥불', '부엉이'];
  return `${adjectives[Math.floor(random() * adjectives.length)]} ${nouns[Math.floor(random() * nouns.length)]}`;
}
