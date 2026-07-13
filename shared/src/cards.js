export const SUITS = ["C", "D", "H", "S"];
export const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];

const RANK_VALUE = Object.fromEntries(RANKS.map((r, i) => [r, i + 2]));

/** A card is represented as a 2-char string: rank + suit, e.g. "AS", "TD", "2C". */
export function makeCard(rank, suit) {
  return `${rank}${suit}`;
}

export function cardRank(card) {
  return card[0];
}

export function cardSuit(card) {
  return card[1];
}

/** Numeric rank value, 2..14 (Ace high). Doubles as a Heart's face value. */
export function rankValue(card) {
  return RANK_VALUE[cardRank(card)];
}

export function isHeart(card) {
  return cardSuit(card) === "H";
}

export const QUEEN_OF_SPADES = "QS";
export const JACK_OF_DIAMONDS = "JD";
export const TWO_OF_CLUBS = "2C";

export function buildDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(makeCard(rank, suit));
    }
  }
  return deck;
}

/** Deterministic PRNG (mulberry32) so a numeric seed always yields the same sequence. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates shuffle using a seeded RNG; does not mutate the input. */
export function seededShuffle(items, seed) {
  const rand = seededRandom(seed);
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function sortHand(cards) {
  return cards.slice().sort((a, b) => {
    if (cardSuit(a) !== cardSuit(b)) {
      return SUITS.indexOf(cardSuit(a)) - SUITS.indexOf(cardSuit(b));
    }
    return rankValue(a) - rankValue(b);
  });
}
