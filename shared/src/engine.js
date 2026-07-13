import {
  buildDeck,
  seededShuffle,
  sortHand,
  cardSuit,
  rankValue,
  isHeart,
  QUEEN_OF_SPADES,
  JACK_OF_DIAMONDS,
  TWO_OF_CLUBS,
} from "./cards.js";
import { passDirectionForRound } from "./messages.js";

const SEATS = [0, 1, 2, 3];

function passTargetSeat(seat, direction) {
  switch (direction) {
    case "left":
      return (seat + 1) % 4;
    case "right":
      return (seat + 3) % 4;
    case "across":
      return (seat + 2) % 4;
    default:
      return seat;
  }
}

function dealHands(seed) {
  const deck = seededShuffle(buildDeck(), seed);
  const hands = [[], [], [], []];
  deck.forEach((card, i) => {
    hands[i % 4].push(card);
  });
  return hands.map(sortHand);
}

function holderOfTwoOfClubs(hands) {
  return hands.findIndex((hand) => hand.includes(TWO_OF_CLUBS));
}

function startPlayingPhase(state) {
  state.phase = "playing";
  state.turnSeat = holderOfTwoOfClubs(state.hands);
  state.currentTrick = { leader: state.turnSeat, ledSuit: null, plays: [] };
  state.trickNumber = 0;
  state.heartsBroken = false;
}

function beginRound(state, roundIndex) {
  state.roundIndex = roundIndex;
  state.direction = passDirectionForRound(roundIndex);
  state.hands = dealHands(state.seed + roundIndex * 1000003);
  state.takenCards = [[], [], [], []];
  state.currentTrick = null;
  state.trickNumber = 0;
  state.heartsBroken = false;
  state.lastRoundResult = null;

  if (state.direction === "hold") {
    state.passSelections = [null, null, null, null];
    startPlayingPhase(state);
  } else {
    state.phase = "passing";
    state.passSelections = [null, null, null, null];
    state.turnSeat = null;
  }
}

/** Creates a fresh game state. `seed` is a number; `roundsTotal` is 4, 8, or 12. */
export function createGame({ roomId, seed, roundsTotal }) {
  const state = {
    roomId,
    seed,
    roundsTotal,
    scores: [0, 0, 0, 0],
    roundHistory: [],
    gameOver: false,
    winners: null,
  };
  beginRound(state, 0);
  return state;
}

function clone(state) {
  return {
    ...state,
    hands: state.hands.map((h) => h.slice()),
    takenCards: state.takenCards.map((t) => t.slice()),
    passSelections: state.passSelections.slice(),
    currentTrick: state.currentTrick
      ? { ...state.currentTrick, plays: state.currentTrick.plays.slice() }
      : null,
    scores: state.scores.slice(),
    roundHistory: state.roundHistory.slice(),
  };
}

/**
 * Records seat's chosen 3 cards to pass. Once all 4 seats have submitted,
 * transfers happen simultaneously and play begins.
 */
export function submitPass(state, seat, cards) {
  if (state.phase !== "passing") {
    throw new Error("Not in passing phase");
  }
  if (state.passSelections[seat]) {
    throw new Error("Pass already submitted for this seat");
  }
  if (cards.length !== 3) {
    throw new Error("Must pass exactly 3 cards");
  }
  const hand = state.hands[seat];
  for (const card of cards) {
    if (!hand.includes(card)) {
      throw new Error(`Seat ${seat} does not hold ${card}`);
    }
  }

  const next = clone(state);
  next.passSelections[seat] = cards.slice();

  if (next.passSelections.every(Boolean)) {
    const incoming = [[], [], [], []];
    for (const fromSeat of SEATS) {
      const toSeat = passTargetSeat(fromSeat, next.direction);
      incoming[toSeat].push(...next.passSelections[fromSeat]);
    }
    next.hands = SEATS.map((s) => {
      const passedAway = new Set(next.passSelections[s]);
      const kept = next.hands[s].filter((c) => !passedAway.has(c));
      return sortHand([...kept, ...incoming[s]]);
    });
    startPlayingPhase(next);
  }

  return next;
}

/** Core legality rules, driven only by a hand plus the public trick context. Shared by the
 * full-state engine (server) and by anything holding just a redacted view (bots, client UI). */
function computeLegalMoves(hand, { currentTrick, trickNumber, heartsBroken }) {
  const trick = currentTrick;
  const isLeading = trick.plays.length === 0;
  const isFirstTrick = trickNumber === 0;

  if (isLeading) {
    if (isFirstTrick) {
      return hand.includes(TWO_OF_CLUBS) ? [TWO_OF_CLUBS] : hand.slice();
    }
    if (!heartsBroken) {
      const nonHearts = hand.filter((c) => !isHeart(c));
      if (nonHearts.length > 0) return nonHearts;
    }
    return hand.slice();
  }

  const led = trick.ledSuit;
  const followCards = hand.filter((c) => cardSuit(c) === led);
  if (followCards.length > 0) return followCards;

  if (isFirstTrick) {
    const safe = hand.filter((c) => !isHeart(c) && c !== QUEEN_OF_SPADES);
    if (safe.length > 0) return safe;
  }
  return hand.slice();
}

/** Returns the list of cards `seat` may legally play right now. Pure, uses only public + own-hand info. */
export function legalMoves(state, seat) {
  if (state.phase !== "playing" || state.turnSeat !== seat) return [];
  return computeLegalMoves(state.hands[seat], {
    currentTrick: state.currentTrick,
    trickNumber: state.trickNumber,
    heartsBroken: state.heartsBroken,
  });
}

/** Same legality rules, but computed from a redacted view (what a bot or client actually has). */
export function legalMovesFromView(view) {
  if (view.phase !== "playing" || view.turnSeat !== view.seat) return [];
  return computeLegalMoves(view.hand, {
    currentTrick: view.currentTrick,
    trickNumber: view.trickNumber,
    heartsBroken: view.heartsBroken,
  });
}

function trickWinner(trick) {
  const ledSuit = trick.ledSuit;
  let winner = trick.plays[0];
  for (const play of trick.plays) {
    if (cardSuit(play.card) === ledSuit && rankValue(play.card) > rankValue(winner.card)) {
      winner = play;
    }
  }
  return winner.seat;
}

function heartFaceValue(card) {
  return rankValue(card);
}

/** Pure scoring calculator, exported for direct testing of scoring/shoot-the-star rules. */
export function computeRoundScores(takenCards) {
  const positive = [0, 0, 0, 0];
  const jackPenalty = [0, 0, 0, 0];

  SEATS.forEach((seat) => {
    for (const card of takenCards[seat]) {
      if (isHeart(card)) positive[seat] += heartFaceValue(card);
      if (card === QUEEN_OF_SPADES) positive[seat] += 50;
      if (card === JACK_OF_DIAMONDS) jackPenalty[seat] = -20;
    }
  });

  const totalPositive = positive.reduce((a, b) => a + b, 0);
  let shooterSeat = null;
  if (totalPositive === 154) {
    const idx = positive.findIndex((p) => p === 154);
    if (idx !== -1) shooterSeat = idx;
  }

  const roundScores = SEATS.map((seat) => {
    const base = shooterSeat === null ? positive[seat] : seat === shooterSeat ? 0 : 154;
    return base + jackPenalty[seat];
  });

  return { roundScores, shooterSeat };
}

function finishRound(state) {
  const { roundScores, shooterSeat } = computeRoundScores(state.takenCards);
  state.scores = state.scores.map((s, i) => s + roundScores[i]);
  state.roundHistory.push({ roundIndex: state.roundIndex, scores: roundScores, shooterSeat });
  state.lastRoundResult = { scores: roundScores, shooterSeat };

  const nextRoundIndex = state.roundIndex + 1;
  if (nextRoundIndex >= state.roundsTotal) {
    state.phase = "game-over";
    state.gameOver = true;
    const min = Math.min(...state.scores);
    state.winners = SEATS.filter((s) => state.scores[s] === min);
    state.turnSeat = null;
    state.currentTrick = null;
  } else {
    beginRound(state, nextRoundIndex);
  }
}

/** Validates and applies a play. Throws on illegal moves; never mutates the input state. */
export function playCard(state, seat, card) {
  const legal = legalMoves(state, seat);
  if (!legal.includes(card)) {
    throw new Error(`Illegal move: seat ${seat} cannot play ${card}`);
  }

  const next = clone(state);
  next.hands[seat] = next.hands[seat].filter((c) => c !== card);

  if (next.currentTrick.plays.length === 0) {
    next.currentTrick.leader = seat;
    next.currentTrick.ledSuit = cardSuit(card);
  }
  next.currentTrick.plays.push({ seat, card });
  if (isHeart(card)) next.heartsBroken = true;

  if (next.currentTrick.plays.length === 4) {
    const winner = trickWinner(next.currentTrick);
    next.takenCards[winner] = next.takenCards[winner].concat(
      next.currentTrick.plays.map((p) => p.card),
    );
    next.trickNumber += 1;
    next.turnSeat = winner;

    if (next.trickNumber === 13) {
      finishRound(next);
    } else {
      next.currentTrick = { leader: winner, ledSuit: null, plays: [] };
    }
  } else {
    next.turnSeat = (seat + 1) % 4;
  }

  return next;
}

export function isGameOver(state) {
  return state.phase === "game-over";
}

/** Produces the state view a single seat is allowed to see: own hand + public info only. */
export function redactStateForSeat(state, seat) {
  return {
    roomId: state.roomId,
    seat,
    hand: state.hands[seat].slice(),
    phase: state.phase,
    direction: state.direction,
    roundIndex: state.roundIndex,
    roundsTotal: state.roundsTotal,
    passSubmitted: state.passSelections.map(Boolean),
    currentTrick: state.currentTrick
      ? {
          leader: state.currentTrick.leader,
          ledSuit: state.currentTrick.ledSuit,
          plays: state.currentTrick.plays.slice(),
        }
      : null,
    trickNumber: state.trickNumber,
    heartsBroken: state.heartsBroken,
    turnSeat: state.turnSeat,
    handCounts: state.hands.map((h) => h.length),
    scores: state.scores.slice(),
    roundHistory: state.roundHistory.slice(),
    lastRoundResult: state.lastRoundResult,
    gameOver: state.gameOver,
    winners: state.winners,
  };
}
