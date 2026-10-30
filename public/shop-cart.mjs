// Pending shop selections are separate from the persisted bag until checkout.
export function createShopCart(catalog) {
  const pending = new Map();
  const entry = id => typeof id === 'string' && Object.hasOwn(catalog, id)
    && ['food', 'gear'].includes(catalog[id]?.cat) ? catalog[id] : null;
  return {
    select(id) {
      const item = entry(id); if (!item) return;
      pending.set(id, item.keep ? 1 : (pending.get(id) || 0) + 1);
    },
    decrement(id) {
      if (!entry(id) || !pending.has(id)) return;
      const count = pending.get(id) - 1;
      if (count > 0) pending.set(id, count); else pending.delete(id);
    },
    clear() { pending.clear(); },
    counts() { return Object.fromEntries(pending); },
    total() { return [...pending.values()].reduce((sum, count) => sum + count, 0); },
    checkout(bag = {}) {
      const nextBag = {...bag}, items = [], skipped = [];
      for (const [id, count] of pending) {
        const item = entry(id); if (!item) { pending.delete(id); continue; }
        const owned = Object.hasOwn(nextBag, id) && Number.isFinite(nextBag[id]) && nextBag[id] > 0
          ? nextBag[id] : 0;
        if (item.keep && owned > 0) {
          skipped.push({id, name: item.name, count, reason: 'owned'}); continue;
        }
        nextBag[id] = item.keep ? 1 : owned + count;
        items.push({id, name: item.name, count});
        pending.delete(id);
      }
      const added = items.length ? `${items.map(item => `${item.name} ${item.count}개`).join(', ')}를 가방에 담았어요.` : '';
      const last = skipped.at(-1)?.name.at(-1), batchim = last >= '가' && last <= '힣' && (last.charCodeAt(0) - 0xac00) % 28 > 0;
      const omitted = skipped.length ? `${skipped.map(item => item.name).join(', ')}${batchim ? '은' : '는'} 이미 가방에 있어요. 선택은 유지했어요.` : '';
      return {bag: nextBag, items, skipped, message: [added, omitted].filter(Boolean).join(' ') || '담을 물건을 먼저 골라 주세요.'};
    },
  };
}
