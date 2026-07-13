## Context

Greenfield project. We are building an online multiplayer Hearts variant playable by sharing a link. Four seats per table; empty or disconnected seats are filled by bots. The scoring is a custom variant (Queen♠=+50, Hearts at face value, Jack♦=-20, shoot-the-star). The product must be trivially shareable (deep-link URL) and cheat-resistant (a browser must never receive another player's hand).

Constraints:
- Stack fixed during exploration: **Svelte + Vite** client, **Node + Socket.IO** server, **in-memory** state.
- No user accounts; identity is a pseudonym + a token in `localStorage`.
- v1 targets ephemeral games (no persistence, no match history).

## Goals / Non-Goals

**Goals:**
- A single-authority server that owns all game state and validates every move.
- A pure, deterministic, framework-free rules engine (shared/testable), decoupled from transport.
- Create/join rooms via a shareable `/r/:roomId` URL, with reconnection to a held seat.
- Heuristic bots that both fill empty seats and take over disconnected humans.
- Per-client state views: each socket receives only its own hand + public state.

**Non-Goals:**
- Accounts, authentication, persistence/database, match history (v1).
- Spectator mode, chat, mobile-native apps.
- ELO/matchmaking, ranked play, more than 4 players, alternate rule sets beyond the specified variant.
- Advanced AI (card counting, opponent modeling) — heuristic only in v1.

## Decisions

**1. Server-authoritative with per-client state redaction.**
The server holds the full `GameState`; on every change it computes a *redacted view* per seat (own hand visible, others' hands hidden, only public trick/score data). Clients render views and send intents (`playCard`, `passCards`). Alternative considered: sending full state and trusting the client to hide — rejected, it leaks cards via devtools.

**2. Rules engine as a pure module, separate from Socket.IO.**
`game-engine` exposes pure functions: `deal(seed)`, `applyPass(state, moves)`, `playCard(state, seat, card)`, `resolveTrick(state)`, `scoreRound(state)`, `isGameOver(state)`. No I/O, no sockets. This makes rules unit-testable and lets bots reuse the same legality checks the server enforces. Alternative: embedding rules in socket handlers — rejected, untestable and duplicated logic.

**3. Shared card/type model between client and server.**
A `shared/` module defines `Suit`, `Rank`, `Card`, message payload shapes, and the redacted view type, imported by both sides so the protocol stays in sync. Vite/Node both consume ES modules.

**4. Socket.IO for transport.**
Native rooms (`io.to(roomId)`), automatic reconnection, and heartbeat come built-in — directly matching the lobby + reconnection needs. Alternative: raw `ws` — rejected, we'd reimplement rooms/reconnection.

**5. Room lifecycle & seat tokens.**
`POST`-style `createRoom` returns `{ roomId, url }`. Joining assigns a seat and issues a `seatToken` (persisted in `localStorage`). On reconnect the client presents `{ roomId, seatToken }` to reclaim its seat. A grace timer (e.g. ~30s) governs when a disconnected human is handed to a bot; the human reclaims the seat on return.

**6. Bots share the engine's legality checks.**
A bot is a function `chooseMove(view) -> move` operating only on the *same redacted view* a human would see (never the hidden state) — so bots can't "cheat" and the design stays honest. Heuristic v1: follow suit legally; dump high cards / avoid taking Queen♠ and big Hearts; try to keep/grab Jack♦; respect first-trick and hearts-broken constraints.

**7. Cyclic passing driven by round index.**
`passDirection(roundIndex) = [left, right, across, hold][roundIndex % 4]`. Passing is simultaneous: the engine collects all four 3-card selections before revealing/swapping, so no player sees incoming cards while choosing.

**8. Deterministic dealing via seeded RNG.**
Dealing uses a seeded shuffle so rounds are reproducible for tests and debugging.

## Risks / Trade-offs

- **[In-memory state lost on server restart]** → Acceptable for v1 (ephemeral games); document it. Persistence is a later change if needed.
- **[Reconnection races — human returns as bot is mid-move]** → Server is the single authority; seat handoff is atomic and only at move boundaries; the reclaiming client re-syncs from the authoritative view.
- **[Bot quality feels weak]** → Isolated behind `chooseMove`; can be upgraded without touching the engine or transport.
- **[Redaction bugs could leak hands]** → Centralize redaction in one function with unit tests asserting hidden fields are absent from every non-owner view.
- **[Illegal-move attempts from tampered clients]** → Engine rejects any move failing legality checks; server never trusts client-asserted legality.
- **[Shoot-the-star edge cases (e.g. Jack♦ interaction)]** → Specified explicitly: shooting counts only the 154 positive points; Jack♦ -20 is scored independently. Covered by dedicated engine tests.
