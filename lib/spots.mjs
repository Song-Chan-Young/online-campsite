// Reservations live on the connected client: removing a client frees its spot.
const validSpot = spot => spot === null || (typeof spot === 'string' && /^(seat:[0-4]|lie:(mat|hammock))$/.test(spot));
export function firstFreeSpot(client, candidates, clients) {
  return candidates.find(spot => validSpot(spot) && ![...clients].some(peer =>
    peer !== client && peer.room === client.room && peer.spot === spot)) ?? null;
}
export function claimSpot(client, spot, clients) {
  if (!validSpot(spot)) return false;
  if (spot !== null && firstFreeSpot(client, [spot], clients) === null) return false;
  client.spot = spot;
  return true;
}
