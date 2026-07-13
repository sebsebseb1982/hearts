import { describe, expect, it } from "vitest";
import { buildDeck, seededShuffle, rankValue, sortHand } from "../src/cards.js";

describe("cards", () => {
  it("builds a full 52-card deck with no duplicates", () => {
    const deck = buildDeck();
    expect(deck.length).toBe(52);
    expect(new Set(deck).size).toBe(52);
  });

  it("shuffles deterministically from a seed", () => {
    const a = seededShuffle(buildDeck(), 42);
    const b = seededShuffle(buildDeck(), 42);
    expect(a).toEqual(b);
  });

  it("produces a different order for a different seed", () => {
    const a = seededShuffle(buildDeck(), 1);
    const b = seededShuffle(buildDeck(), 2);
    expect(a).not.toEqual(b);
  });

  it("computes ace-high rank values, matching heart face values", () => {
    expect(rankValue("2H")).toBe(2);
    expect(rankValue("TC")).toBe(10);
    expect(rankValue("JH")).toBe(11);
    expect(rankValue("QH")).toBe(12);
    expect(rankValue("KH")).toBe(13);
    expect(rankValue("AH")).toBe(14);
  });

  it("sorts a hand by suit then rank", () => {
    const sorted = sortHand(["AS", "2C", "KH", "3C"]);
    expect(sorted).toEqual(["2C", "3C", "KH", "AS"]);
  });
});
