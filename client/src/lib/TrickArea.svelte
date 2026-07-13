<script>
  import { fly, fade } from "svelte/transition";
  import { cubicOut } from "svelte/easing";
  import PlayingCard from "./PlayingCard.svelte";
  import { fanTransform } from "./fan.js";

  export let roster = [];
  export let mySeat = 0;
  export let currentTrick = null;
  export let handCounts = [0, 0, 0, 0];
  export let turnSeat = null;
  export let trickJustCompleted = null;

  const POSITION_LABEL = { 0: "bottom", 1: "left", 2: "top", 3: "right" };

  // Where each position rests within the pile, and where its card flies in from.
  const PILE = {
    top: { restX: 0, restY: -22, rotate: -4, flyX: 0, flyY: -140 },
    left: { restX: -22, restY: 0, rotate: 5, flyX: -140, flyY: 0 },
    right: { restX: 22, restY: 0, rotate: -5, flyX: 140, flyY: 0 },
    bottom: { restX: 0, restY: 22, rotate: 4, flyX: 0, flyY: 140 },
  };

  $: seatsByPosition = [1, 2, 3].map((offset) => {
    const seat = (mySeat + offset) % 4;
    return { seat, position: POSITION_LABEL[offset] };
  });

  // All 4 seats, positioned around the pile (used to place each played card in the center).
  $: pileSeats = [0, 1, 2, 3].map((offset) => {
    const seat = (mySeat + offset) % 4;
    return { seat, position: POSITION_LABEL[offset] };
  });

  // Derived (not plain functions) so Svelte's template tracks `currentTrick`/`roster` as
  // dependencies — a function merely *called* from the markup doesn't register the props
  // it closes over, so the display would never update past its initial render.
  $: playedCards = [0, 1, 2, 3].map(
    (seat) => currentTrick?.plays.find((p) => p.seat === seat)?.card ?? null,
  );
  $: rosterBySeat = [0, 1, 2, 3].map((seat) => roster.find((r) => r.seat === seat));
</script>

<div class="table">
  {#each seatsByPosition as { seat, position } (seat)}
    <div
      class="seat {position}"
      class:active={turnSeat === seat}
      class:winner={trickJustCompleted?.winner === seat}
    >
      <div class="seat-label">
        {rosterBySeat[seat]?.name ?? `Seat ${seat + 1}`}
        {#if rosterBySeat[seat]?.kind?.startsWith("bot")}<span class="tag">bot</span>{/if}
        {#if rosterBySeat[seat] && !rosterBySeat[seat].connected}<span class="tag warn">away</span>{/if}
        {#if trickJustCompleted?.winner === seat}<span class="tag win">won the trick</span>{/if}
      </div>
      <div class="mini-hand">
        {#each Array(handCounts[seat] ?? 0) as _, i}
          {@const { angle } = fanTransform(i, handCounts[seat] ?? 0, { maxAnglePerCard: 10, maxTotalAngle: 70 })}
          <div class="mini-slot" style="transform: rotate({angle}deg); z-index: {i};">
            <PlayingCard tiny />
          </div>
        {/each}
      </div>
    </div>
  {/each}

  <div class="trick-pile" class:winner={!!trickJustCompleted}>
    {#each pileSeats as { seat, position } (seat)}
      {@const spot = PILE[position]}
      {#if playedCards[seat]}
        <div
          class="pile-slot"
          style="transform: translate(-50%, -50%) translate({spot.restX}px, {spot.restY}px) rotate({spot.rotate}deg);"
        >
          <div
            in:fly={{ x: spot.flyX, y: spot.flyY, duration: 380, easing: cubicOut }}
            out:fade={{ duration: 150 }}
          >
            <PlayingCard card={playedCards[seat]} small />
          </div>
        </div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .table {
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: auto auto;
    row-gap: clamp(16px, 4vh, 48px);
    column-gap: 8px;
    align-items: center;
    justify-items: center;
    width: 100%;
  }
  .seat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 6px;
    border-radius: 8px;
  }
  .seat.active {
    outline: 2px solid #4ea1ff;
  }
  .seat.winner {
    outline: 2px solid #facc15;
    background: rgba(250, 204, 21, 0.08);
  }
  .seat.top {
    grid-column: 2;
    grid-row: 1;
  }
  .seat.left {
    grid-column: 1;
    grid-row: 2;
  }
  .seat.right {
    grid-column: 3;
    grid-row: 2;
  }
  .trick-pile {
    grid-column: 2;
    grid-row: 2;
    position: relative;
    width: clamp(140px, 18vh, 260px);
    height: clamp(140px, 18vh, 260px);
    border-radius: 50%;
    transition: background 0.2s ease, box-shadow 0.2s ease;
  }
  .trick-pile.winner {
    background: rgba(250, 204, 21, 0.1);
    box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.5);
  }
  .pile-slot {
    position: absolute;
    top: 50%;
    left: 50%;
  }
  .seat-label {
    font-size: 0.85em;
    display: flex;
    gap: 4px;
    align-items: center;
  }
  .tag {
    font-size: 0.75em;
    background: #334155;
    color: #cbd5e1;
    border-radius: 4px;
    padding: 1px 4px;
  }
  .tag.warn {
    background: #7c2d12;
    color: #fed7aa;
  }
  .tag.win {
    background: #713f12;
    color: #fde68a;
  }
  .mini-hand {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    min-height: 40px;
    padding-top: 12px;
  }
  .mini-slot {
    transform-origin: bottom center;
    margin: 0 -12px;
  }
  .mini-slot:first-child {
    margin-left: 0;
  }
  .mini-slot:last-child {
    margin-right: 0;
  }
</style>
