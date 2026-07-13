## 1. Project scaffold

- [x] 1.1 Initialize repo layout: `server/`, `client/`, `shared/`, root `package.json` (workspaces or npm scripts)
- [x] 1.2 Add server deps (`socket.io`, HTTP server) and client deps (`svelte`, `vite`, `socket.io-client`)
- [x] 1.3 Configure Vite for the Svelte client and a dev script that runs client + server together
- [x] 1.4 Set up a test runner (e.g. Vitest) for the shared/engine module

## 2. Shared model

- [x] 2.1 Define `Suit`, `Rank`, `Card` types and helpers (parse/format, ordering)
- [x] 2.2 Define card point values (Queen♠=50, Hearts face value, Jack♦=-20, others 0)
- [x] 2.3 Define message/payload types: intents (`passCards`, `playCard`) and the redacted view shape

## 3. Game engine (pure, tested)

- [x] 3.1 Implement seeded deck build, shuffle, and 13-card deal to 4 seats
- [x] 3.2 Implement pass direction from round index `[left, right, across, hold][i%4]`
- [x] 3.3 Implement simultaneous pass collection and transfer (no early reveal)
- [x] 3.4 Implement first-trick 2♣ lead requirement
- [x] 3.5 Implement follow-suit legality and legal-move enumeration
- [x] 3.6 Implement hearts-broken rule and first-trick no-penalty restriction
- [x] 3.7 Implement trick resolution (winner of led suit leads next)
- [x] 3.8 Implement round scoring (face-value Hearts, Queen♠=50, Jack♦=-20)
- [x] 3.9 Implement shoot-the-star detection and redistribution (shooter 0, others +154; Jack♦ independent)
- [x] 3.10 Implement game-length handling (4/8/12 rounds) and lowest-score winner
- [x] 3.11 Implement per-seat redaction function (own hand + public state only)
- [x] 3.12 Unit tests for scoring, shoot-the-star edge cases, legality, and redaction (no hand leaks)

## 4. Bots

- [x] 4.1 Implement `chooseMove(view)` operating only on the redacted view
- [x] 4.2 Implement heuristic strategy (avoid Queen♠/high Hearts, value Jack♦, safe discards)
- [x] 4.3 Ensure bot moves always pass engine legality; add tests

## 5. Server: rooms & realtime

- [x] 5.1 Set up HTTP server serving the built client and Socket.IO
- [x] 5.2 Implement in-memory `Map<roomId, GameState>` store
- [x] 5.3 Implement create-room (returns `roomId` + `/r/:roomId` URL) and host assignment
- [x] 5.4 Implement join/seat assignment, roster broadcast, and room-full handling
- [x] 5.5 Implement `seatToken` issuance and reconnection reclaim
- [x] 5.6 Implement host round-count config and start (fill empty seats with bots)
- [x] 5.7 Wire intents → engine validation → broadcast redacted views; reject illegal/out-of-turn
- [x] 5.8 Implement disconnect grace timer and bot takeover / human reclaim
- [x] 5.9 Drive bot turns automatically for bot-occupied seats

## 6. Client (Svelte)

- [x] 6.1 Set up Socket.IO client connection and store for redacted view state
- [x] 6.2 Build lobby screen: create/share link, join, pseudonym, roster, host controls
- [x] 6.3 Persist pseudonym + per-room `seatToken` in `localStorage`; auto-reclaim on open
- [x] 6.4 Build table view: own hand, current trick, turn indicator, scores
- [x] 6.5 Highlight legal moves and send `playCard` intents
- [x] 6.6 Build passing-phase UI (pick 3, show direction, submit)
- [x] 6.7 Show round scores, shoot-the-star redistribution, and final standings/winner
- [x] 6.8 Handle disconnect/reconnect UX and error/rejection feedback

## 7. Integration & verification

- [x] 7.1 End-to-end: create room, join via link on a second client, start, play a full round
- [x] 7.2 Verify a 4/8/12-round game completes and declares the lowest-score winner
- [x] 7.3 Verify reconnection reclaims a seat and bot takeover works on disconnect
- [x] 7.4 Manual check that no client payload exposes another seat's hand
- [x] 7.5 Write a short README (run/dev/build instructions)
