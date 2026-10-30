# Gentle social camping

Based on the user's approved trend analysis: make 방구석 캠핑장 a restful space for solitary visitors and an optional shared space for friends. Extend existing Three.js visuals, Node server, room reservations and anonymous names.

Approach: extend the existing application and share its room protocol with a Cloudflare Worker/Durable Object adapter. A complete game rewrite or a static-only deployment would discard working functionality or break multiplayer. Keep local npm start working.

Experience:
- Default to quiet rest; the visitor can opt into conversation. Quiet users receive no chat, greeting notifications or gifts, and their status is visible to other campers. Reconnecting preserves that preference.
- Copy/share an invitation to the same room with an anonymous visitor token. On arrival, reserve the nearest available chair to the inviter; if they left or no chair is free, enter normally with an honest explanation.
- Offer a marshmallow to the nearest available social camper; server validates same room, range, target preference and rate. Show sender/recipient feedback and briefly hold the existing food prop. No paid currency or inventory transfer.
- Type a private worry into a local panel, burn it, clear its text and animate embers. Never transmit or persist the text.
- Create a branded photo containing the scene, visitor nickname, date and site name; preview, download or use device sharing. No automatic social posting.
- Display actual connection/participant status. Connect only after entry so an unopened entry form does not occupy a chair.
- Count aggregate entry/returning-session/five-minute/invitation/gift events by UTC date, without analytics identifiers or private content; expose these as session counts, not unique visitors.
- Configure a stable workers.dev deployment with hibernating room state, without purchasing a domain or changing account security. Actual deployment requires working account access and final review.

Limits: the first release is not a validated 60,000-user service. No account system, public worry feed or analytics identifiers are introduced. Keep the existing three rooms and explicit mobile tap/swipe/pinch controls. Preserve source assets and external setup instructions.
