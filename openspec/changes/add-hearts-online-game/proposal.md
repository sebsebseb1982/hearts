## Why

We want an online, real-time card game where friends can play a custom "Dame de pique" (Hearts) variant together simply by sharing a link. There is no existing implementation — this change bootstraps the whole product: an authoritative Node server, a Svelte client, and the full rules engine for the variant.

## What Changes

- Introduce a complete online multiplayer Hearts variant for exactly 4 seats per table.
- Implement the custom scoring rules:
  - Queen of Spades = **+50** to whoever takes it.
  - Each Heart = its **face value** (2..10 = pip value, J=11, Q=12, K=13, A=14; total 104).
  - Jack of Diamonds = **-20** to whoever takes it.
  - Total positive penalties per round = 154 (104 Hearts + 50 Queen of Spades).
- Implement the cyclic passing phase (rotating each round): pass 3 left → pass 3 right → pass 3 across → no pass (hold) → repeat.
- Implement **shoot the star**: if one player takes all 154 positive points, they score 0 and each of the other three scores +154. The Jack of Diamonds -20 is unaffected and stays with whoever took it.
- Enforce standard Hearts conventions: 2♣ opens the first trick, follow-suit obligation, hearts-broken rule, no penalty cards on the first trick, simultaneous card passing.
- Configurable game length: 4 / 8 / 12 rounds (multiples of the 4-round passing cycle); lowest total score wins.
- **Lobbies**: create a room and share a deep-link URL `/r/:roomId` so others can join a specific table.
- **Bots**: heuristic AI fills empty seats so a table can start under 4 humans, and takes over disconnected players so a game is never blocked.
- **Identity & reconnection**: pseudonym + token stored in `localStorage`; reconnect to a held seat via token.
- **Authoritative server**: the server owns all state; each client receives only its own hand plus public state (no client-side rules, no card leaks).

## Capabilities

### New Capabilities
- `game-engine`: Card model, dealing, cyclic passing, trick resolution (follow-suit, 2♣ lead, hearts-broken, first-trick restrictions), scoring (Queen♠=50, face-value Hearts, Jack♦=-20), shoot-the-star redistribution, and end-of-game determination.
- `lobby`: Room creation, deep-link URLs (`/r/:roomId`), seat assignment, host controls, start conditions, and reconnection by seat token.
- `realtime-sync`: Socket.IO protocol and message contract; authoritative state broadcast where each client only sees its own hand and shared public state.
- `bots`: Heuristic AI that plays legal, strategy-aware moves, fills empty seats, and takes over disconnected human seats.
- `client-ui`: Svelte interface for the lobby, the table, the player's hand, the passing phase, trick play, and score display.

### Modified Capabilities
<!-- None — greenfield project, no existing specs. -->

## Impact

- **New codebase** (no existing code): Node + Socket.IO server, Svelte + Vite client, shared rules/types module.
- **Dependencies**: `socket.io` / `socket.io-client`, `svelte`, `vite`, Node HTTP server (e.g. Express or native `http`).
- **State**: in-memory `Map<roomId, GameState>` (no database in v1); games are ephemeral.
- **Security posture**: server-authoritative design is a hard requirement to prevent card leaks and illegal-move cheating.
