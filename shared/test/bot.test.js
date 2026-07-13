import { describe, expect, it } from "vitest";
import { createGame, submitPass, playCard, advanceAfterTrick, redactStateForSeat } from "../src/engine.js";
import { chooseMove, chooseTrickMove } from "../src/bot.js";

function playFullGameWithBots(seed, roundsTotal) {
  let s = createGame({ roomId: "r", seed, roundsTotal });
  let guard = 0;
  while (!s.gameOver) {
    if (guard++ > 10000) throw new Error("runaway game loop");

    if (s.phase === "passing") {
      for (const seat of [0, 1, 2, 3]) {
        if (s.passSelections[seat]) continue;
        const view = redactStateForSeat(s, seat);
        const move = chooseMove(view);
        s = submitPass(s, seat, move.cards);
      }
      continue;
    }

    if (s.trickJustCompleted) {
      s = advanceAfterTrick(s);
      continue;
    }

    const seat = s.turnSeat;
    const view = redactStateForSeat(s, seat);
    const move = chooseMove(view);
    s = playCard(s, seat, move.card);
  }
  return s;
}

describe("bot legality", () => {
  it("never attempts an illegal move across full bot-vs-bot games", () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const final = playFullGameWithBots(seed, 4);
      expect(final.gameOver).toBe(true);
    }
  });

  it("uses only the redacted view (own hand + public state), same shape a human seat would get", () => {
    const state = createGame({ roomId: "r", seed: 10, roundsTotal: 4 });
    const view = redactStateForSeat(state, state.turnSeat ?? 0);
    expect(view).not.toHaveProperty("hands");
    const move = chooseMove(view);
    expect(move).toBeDefined();
  });
});

describe("bot heuristic", () => {
  it("avoids taking the Queen of Spades when a safe discard exists", () => {
    const view = {
      seat: 1,
      hand: ["2S", "AS"],
      phase: "playing",
      turnSeat: 1,
      currentTrick: { leader: 0, ledSuit: "S", plays: [{ seat: 0, card: "QS" }] },
      trickNumber: 5,
      heartsBroken: true,
    };
    expect(chooseTrickMove(view)).toBe("2S");
  });

  it("prefers taking a trick that contains the Jack of Diamonds, as cheaply as possible", () => {
    const view = {
      seat: 1,
      hand: ["QD", "KD"],
      phase: "playing",
      turnSeat: 1,
      currentTrick: { leader: 0, ledSuit: "D", plays: [{ seat: 0, card: "JD" }] },
      trickNumber: 5,
      heartsBroken: true,
    };
    expect(chooseTrickMove(view)).toBe("QD");
  });
});
