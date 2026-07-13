# Dame de pique — online Hearts variant

An online, real-time 4-player Hearts variant with custom scoring, playable by sharing a room link.

## Rules variant

- Queen of Spades = **+50** to whoever takes it.
- Each Heart = its **face value** (2-10 = pip value, J=11, Q=12, K=13, A=14).
- Jack of Diamonds = **-20** to whoever takes it.
- Passing rotates every round: **left → right → across → hold** (repeats).
- **Shoot the star**: if one player takes all 154 positive points (13 Hearts + Queen of Spades) in a round, they score 0 and each of the other three scores +154. The Jack of Diamonds penalty is unaffected and always goes to whoever took it.
- Game length is configurable (4 / 8 / 12 rounds); lowest cumulative score wins.

Standard Hearts conventions apply: 2♣ opens the first trick, you must follow suit, hearts can't be led until broken, and no penalty card may be discarded on the first trick unless forced.

## Project layout

- `shared/` — pure, framework-free rules engine and bot heuristic (used by both server and client)
- `server/` — Node + Express + Socket.IO authoritative server, in-memory room store
- `client/` — Svelte + Vite web client

## Requirements

- Node.js 20+

## Setup

```bash
npm install
```

## Development

Runs the server (port 3001) and the Vite dev client (port 5173, proxying `/socket.io` to the server) together:

```bash
npm run dev
```

Open http://localhost:5173, create a room, and share the printed `/r/:roomId` link with up to 3 other players. Empty seats are filled by bots when the host starts the game.

## Tests

Runs the shared rules-engine and bot test suite (Vitest):

```bash
npm test
```

## Production build

```bash
npm run build   # builds the client into client/dist
npm start        # serves the built client + Socket.IO from a single Node process on $PORT (default 3001)
```

## Notes

- Game state lives in memory (`Map<roomId, GameState>`); restarting the server ends in-progress games.
- A disconnected player's seat is taken over by a bot after a grace period (~30s, configurable via `HEARTS_DISCONNECT_GRACE_MS`) and can be reclaimed by reconnecting to the same room link.
