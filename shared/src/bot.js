import { cardSuit, rankValue, isHeart, QUEEN_OF_SPADES, JACK_OF_DIAMONDS } from "./cards.js";
import { legalMovesFromView } from "./engine.js";

/** Higher = more dangerous/undesirable to hold. Used both for passing and for safe discards. */
function danger(card) {
  if (card === QUEEN_OF_SPADES) return 1000;
  if (card === JACK_OF_DIAMONDS) return -100; // worth keeping/taking, not shedding
  if (cardSuit(card) === "S" && rankValue(card) >= 12) return 700 + rankValue(card);
  if (isHeart(card)) return 300 + rankValue(card);
  return rankValue(card);
}

function highestByDanger(cards) {
  return cards.slice().sort((a, b) => danger(b) - danger(a))[0];
}

function lowest(cards) {
  return cards.slice().sort((a, b) => rankValue(a) - rankValue(b))[0];
}

/** Heuristic choice of 3 cards to pass: shed the most dangerous cards, keep the Jack of Diamonds. */
export function choosePassCards(hand) {
  return hand
    .slice()
    .sort((a, b) => danger(b) - danger(a))
    .slice(0, 3);
}

function currentBestOfLedSuit(trick) {
  const ledPlays = trick.plays.filter((p) => cardSuit(p.card) === trick.ledSuit);
  if (ledPlays.length === 0) return null;
  return ledPlays.reduce((best, p) => (rankValue(p.card) > rankValue(best.card) ? p : best));
}

/**
 * Chooses a trick-play move from a redacted view only (own hand + public state) — a bot never
 * sees hidden state, matching exactly what a human in that seat would have access to.
 */
export function chooseTrickMove(view) {
  const legal = legalMovesFromView(view);
  if (legal.length === 0) return null;
  if (legal.length === 1) return legal[0];

  const trick = view.currentTrick;
  const isLeading = trick.plays.length === 0;

  if (isLeading) {
    const safe = legal.filter((c) => c !== QUEEN_OF_SPADES);
    const candidates = safe.length > 0 ? safe : legal;
    return lowest(candidates);
  }

  const followingSuit = legal.every((c) => cardSuit(c) === trick.ledSuit);
  if (!followingSuit) {
    // Void in the led suit: this discard can never win the trick, so dump the most dangerous card.
    return highestByDanger(legal);
  }

  const best = currentBestOfLedSuit(trick);
  const winningCandidates = legal.filter((c) => !best || rankValue(c) > rankValue(best.card));
  const losingCandidates = legal.filter((c) => best && rankValue(c) <= rankValue(best.card));

  const jackPresent = trick.plays.some((p) => p.card === JACK_OF_DIAMONDS);
  const dangerInTrick = trick.plays.some((p) => isHeart(p.card) || p.card === QUEEN_OF_SPADES);

  if (jackPresent && winningCandidates.length > 0) {
    return lowest(winningCandidates);
  }
  if (dangerInTrick && losingCandidates.length > 0) {
    return highestByDanger(losingCandidates);
  }
  if (dangerInTrick && winningCandidates.length > 0) {
    // Forced to win a dangerous trick: take it as cheaply as possible.
    return lowest(winningCandidates);
  }
  return lowest(legal);
}

/** Chooses a bot's full move: either a 3-card pass or a single trick-play card. */
export function chooseMove(view) {
  if (view.phase === "passing") {
    return { type: "pass", cards: choosePassCards(view.hand) };
  }
  return { type: "play", card: chooseTrickMove(view) };
}
