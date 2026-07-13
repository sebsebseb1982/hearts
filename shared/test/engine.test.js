import { describe, expect, it } from "vitest";
import {
  createGame,
  submitPass,
  legalMoves,
  playCard,
  computeRoundScores,
  redactStateForSeat,
} from "../src/engine.js";

function baseState(overrides) {
  return {
    roomId: "test",
    seed: 1,
    roundsTotal: 4,
    scores: [0, 0, 0, 0],
    roundHistory: [],
    gameOver: false,
    winners: null,
    roundIndex: 0,
    direction: "hold",
    hands: [[], [], [], []],
    passSelections: [null, null, null, null],
    takenCards: [[], [], [], []],
    currentTrick: null,
    trickNumber: 0,
    heartsBroken: false,
    phase: "playing",
    turnSeat: 0,
    lastRoundResult: null,
    ...overrides,
  };
}

/** Plays exactly one trick (4 plays), always choosing the first legal move for the seat on turn. */
function playOneTrick(state) {
  let s = state;
  for (let i = 0; i < 4; i++) {
    if (s.phase !== "playing") break;
    const seat = s.turnSeat;
    const moves = legalMoves(s, seat);
    s = playCard(s, seat, moves[0]);
  }
  return s;
}

/** Auto-submits a trivial pass (first 3 cards) for any seat that hasn't passed yet. */
function autoAdvancePassing(state) {
  let s = state;
  if (s.phase === "passing") {
    for (const seat of [0, 1, 2, 3]) {
      if (!s.passSelections[seat]) {
        s = submitPass(s, seat, s.hands[seat].slice(0, 3));
      }
    }
  }
  return s;
}

/** Plays exactly one full round (13 tricks) starting from wherever `state` currently is. */
function playFullRound(state) {
  let s = autoAdvancePassing(state);
  for (let trick = 0; trick < 13; trick++) {
    s = playOneTrick(s);
  }
  return s;
}

describe("dealing", () => {
  it("deals 13 distinct cards to each of the 4 seats, all 52 cards used", () => {
    const state = createGame({ roomId: "r", seed: 123, roundsTotal: 4 });
    const all = state.hands.flat();
    expect(all.length).toBe(52);
    expect(new Set(all).size).toBe(52);
    state.hands.forEach((h) => expect(h.length).toBe(13));
  });

  it("deals identically for the same seed", () => {
    const a = createGame({ roomId: "r", seed: 555, roundsTotal: 4 });
    const b = createGame({ roomId: "r", seed: 555, roundsTotal: 4 });
    expect(a.hands).toEqual(b.hands);
  });
});

describe("passing phase", () => {
  it("round 0 requires a pass to the left", () => {
    const state = createGame({ roomId: "r", seed: 7, roundsTotal: 4 });
    expect(state.direction).toBe("left");
    expect(state.phase).toBe("passing");
  });

  it("does not reveal or transfer cards until all 4 seats submit", () => {
    const state = createGame({ roomId: "r", seed: 7, roundsTotal: 4 });
    const selections = state.hands.map((h) => h.slice(0, 3));
    let s = state;
    for (const seat of [0, 1, 2]) {
      s = submitPass(s, seat, selections[seat]);
    }
    expect(s.phase).toBe("passing");
    expect(s.hands[0]).toEqual(state.hands[0]);
    expect(s.hands[1]).toEqual(state.hands[1]);
  });

  it("transfers 3 cards to the left once all 4 have submitted, leaving 13 cards per seat", () => {
    const state = createGame({ roomId: "r", seed: 7, roundsTotal: 4 });
    const selections = state.hands.map((h) => h.slice(0, 3));
    let s = state;
    for (const seat of [0, 1, 2, 3]) {
      s = submitPass(s, seat, selections[seat]);
    }
    expect(s.phase).toBe("playing");
    s.hands.forEach((h) => expect(h.length).toBe(13));
    for (const card of selections[0]) {
      expect(s.hands[1]).toContain(card);
      expect(s.hands[0]).not.toContain(card);
    }
  });

  it("skips passing entirely on a hold round", () => {
    let s = createGame({ roomId: "r", seed: 42, roundsTotal: 8 });
    s = playFullRound(s); // round 0 (left)
    s = playFullRound(s); // round 1 (right)
    s = playFullRound(s); // round 2 (across)
    expect(s.roundIndex).toBe(3);
    expect(s.direction).toBe("hold");
    expect(s.phase).toBe("playing");
  });
});

describe("trick play legality", () => {
  it("only allows leading the 2 of clubs on the first trick", () => {
    const state = baseState({
      trickNumber: 0,
      currentTrick: { leader: 0, ledSuit: null, plays: [] },
      hands: [["2C", "5D", "9S"], [], [], []],
      turnSeat: 0,
    });
    expect(legalMoves(state, 0)).toEqual(["2C"]);
  });

  it("forces following suit when possible", () => {
    const state = baseState({
      trickNumber: 3,
      currentTrick: { leader: 0, ledSuit: "C", plays: [{ seat: 0, card: "2C" }] },
      hands: [[], ["2H", "5C", "9C"], [], []],
      turnSeat: 1,
    });
    expect(legalMoves(state, 1).sort()).toEqual(["5C", "9C"]);
  });

  it("forbids leading hearts before hearts are broken, unless only hearts remain", () => {
    const notBroken = baseState({
      trickNumber: 4,
      currentTrick: { leader: 2, ledSuit: null, plays: [] },
      hands: [[], [], ["3H", "5D", "9S"], []],
      turnSeat: 2,
      heartsBroken: false,
    });
    expect(legalMoves(notBroken, 2).sort()).toEqual(["5D", "9S"]);

    const forcedHearts = baseState({
      trickNumber: 4,
      currentTrick: { leader: 2, ledSuit: null, plays: [] },
      hands: [[], [], ["3H", "9H"], []],
      turnSeat: 2,
      heartsBroken: false,
    });
    expect(legalMoves(forcedHearts, 2).sort()).toEqual(["3H", "9H"]);
  });

  it("forbids discarding a penalty card on the first trick unless forced", () => {
    const hasSafeCard = baseState({
      trickNumber: 0,
      currentTrick: { leader: 0, ledSuit: "C", plays: [{ seat: 0, card: "2C" }] },
      hands: [[], ["QS", "5H", "9D"], [], []],
      turnSeat: 1,
    });
    expect(legalMoves(hasSafeCard, 1)).toEqual(["9D"]);

    const forced = baseState({
      trickNumber: 0,
      currentTrick: { leader: 0, ledSuit: "C", plays: [{ seat: 0, card: "2C" }] },
      hands: [[], ["QS", "5H"], [], []],
      turnSeat: 1,
    });
    expect(legalMoves(forced, 1).sort()).toEqual(["5H", "QS"]);
  });

  it("rejects an illegal move", () => {
    const state = baseState({
      trickNumber: 3,
      currentTrick: { leader: 0, ledSuit: "C", plays: [{ seat: 0, card: "2C" }] },
      hands: [[], ["2H", "5C", "9C"], [], []],
      turnSeat: 1,
    });
    expect(() => playCard(state, 1, "2H")).toThrow();
  });

  it("resolves a trick to the highest card of the led suit, who then leads next", () => {
    const state = baseState({
      trickNumber: 5,
      heartsBroken: true,
      currentTrick: { leader: 0, ledSuit: null, plays: [] },
      turnSeat: 0,
      hands: [
        ["9C", "2D", "3D"],
        ["QH", "2S", "3S"],
        ["4C", "5S", "6S"],
        ["KC", "7S", "8S"],
      ],
      takenCards: [[], [], [], []],
    });

    let s = playCard(state, 0, "9C");
    s = playCard(s, 1, "2S");
    s = playCard(s, 2, "4C");
    s = playCard(s, 3, "KC");

    expect(s.turnSeat).toBe(3);
    expect(s.currentTrick.leader).toBe(3);
    expect(s.currentTrick.plays).toEqual([]);
    expect(s.takenCards[3].sort()).toEqual(["2S", "4C", "9C", "KC"].sort());
  });
});

describe("round scoring", () => {
  it("tallies face-value hearts, Queen of Spades +50, Jack of Diamonds -20", () => {
    const { roundScores, shooterSeat } = computeRoundScores([
      ["2H", "3H"],
      ["QS"],
      ["JD"],
      [],
    ]);
    expect(roundScores).toEqual([5, 50, -20, 0]);
    expect(shooterSeat).toBeNull();
  });

  it("scores court-card hearts at their face value", () => {
    const { roundScores } = computeRoundScores([["JH", "QH", "KH", "AH"], [], [], []]);
    expect(roundScores[0]).toBe(11 + 12 + 13 + 14);
  });

  it("detects a shoot the star and redistributes 154 to the other three seats", () => {
    const allHeartsAndQueen = [
      "2H", "3H", "4H", "5H", "6H", "7H", "8H", "9H", "TH", "JH", "QH", "KH", "AH", "QS",
    ];
    const { roundScores, shooterSeat } = computeRoundScores([allHeartsAndQueen, [], [], []]);
    expect(shooterSeat).toBe(0);
    expect(roundScores).toEqual([0, 154, 154, 154]);
  });

  it("keeps the Jack of Diamonds penalty independent of a shoot", () => {
    const allHeartsAndQueen = [
      "2H", "3H", "4H", "5H", "6H", "7H", "8H", "9H", "TH", "JH", "QH", "KH", "AH", "QS",
    ];
    const { roundScores, shooterSeat } = computeRoundScores([
      allHeartsAndQueen,
      ["JD"],
      [],
      [],
    ]);
    expect(shooterSeat).toBe(0);
    expect(roundScores).toEqual([0, 134, 154, 154]);
  });

  it("does not redistribute when the 154 points are split across seats", () => {
    const allHearts = [
      "2H", "3H", "4H", "5H", "6H", "7H", "8H", "9H", "TH", "JH", "QH", "KH", "AH",
    ];
    const { roundScores, shooterSeat } = computeRoundScores([["QS"], allHearts, [], []]);
    expect(shooterSeat).toBeNull();
    expect(roundScores).toEqual([50, 104, 0, 0]);
  });
});

describe("redaction", () => {
  it("only exposes the receiving seat's own hand, never other seats' cards", () => {
    const state = createGame({ roomId: "r", seed: 321, roundsTotal: 4 });
    for (let seat = 0; seat < 4; seat++) {
      const view = redactStateForSeat(state, seat);
      expect(view.hand).toEqual(state.hands[seat]);
      const serialized = JSON.stringify(view);
      for (let other = 0; other < 4; other++) {
        if (other === seat) continue;
        for (const card of state.hands[other]) {
          expect(serialized.includes(`"${card}"`)).toBe(false);
        }
      }
    }
  });

  it("exposes hand sizes but not pass selection contents before the reveal", () => {
    const state = createGame({ roomId: "r", seed: 321, roundsTotal: 4 });
    const s = submitPass(state, 0, state.hands[0].slice(0, 3));
    const view = redactStateForSeat(s, 1);
    expect(view.passSubmitted).toEqual([true, false, false, false]);
    expect(view).not.toHaveProperty("passSelections");
  });
});

describe("game length and winner", () => {
  it("ends the game after the configured number of rounds and declares the lowest score winner", () => {
    let s = createGame({ roomId: "r", seed: 99, roundsTotal: 4 });
    for (let i = 0; i < 4; i++) {
      s = playFullRound(s);
    }
    expect(s.gameOver).toBe(true);
    expect(s.phase).toBe("game-over");
    expect(s.roundIndex).toBe(3);

    const min = Math.min(...s.scores);
    const expectedWinners = s.scores
      .map((score, seat) => (score === min ? seat : null))
      .filter((seat) => seat !== null);
    expect(s.winners).toEqual(expectedWinners);
  });

  it.each([8, 12])("completes a full %i-round game (2-3 passing cycles)", (roundsTotal) => {
    let s = createGame({ roomId: "r", seed: 4242, roundsTotal });
    for (let i = 0; i < roundsTotal; i++) {
      s = playFullRound(s);
    }
    expect(s.gameOver).toBe(true);
    expect(s.roundHistory.length).toBe(roundsTotal);
    expect(s.winners.length).toBeGreaterThan(0);
  });
});
