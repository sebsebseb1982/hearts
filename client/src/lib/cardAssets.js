const SUIT_NAMES = { C: "clubs", D: "diamonds", H: "hearts", S: "spades" };
const RANK_NAMES = { T: "10", J: "jack", Q: "queen", K: "king", A: "ace" };

export function cardImageSrc(card) {
  const rank = card[0];
  const suit = card[1];
  const rankName = RANK_NAMES[rank] ?? rank;
  return `/cards/${rankName}_of_${SUIT_NAMES[suit]}.svg`;
}

const SUIT_SYMBOL = { C: "♣", D: "♦", H: "♥", S: "♠" };
const RANK_LABEL = { T: "10", J: "J", Q: "Q", K: "K", A: "A" };

export function cardLabel(card) {
  const rank = card[0];
  const suit = card[1];
  return `${RANK_LABEL[rank] ?? rank}${SUIT_SYMBOL[suit]}`;
}

export function isRedSuit(card) {
  return card[1] === "D" || card[1] === "H";
}
