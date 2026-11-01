// Reservations live on the connected client: removing a client frees its spot.
import {CAMP_SEATS} from '../public/camp-circle.mjs';
const validSpot = spot => spot === null || (typeof spot === 'string' && (
  /^lie:(mat|mat2|mat3|hammock|tent|car)$/.test(spot) || (/^seat:(0|[1-9]\d*)$/.test(spot) && Number(spot.slice(5))<=CAMP_SEATS.length)));
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
