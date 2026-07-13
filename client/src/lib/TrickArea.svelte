<script>
  import PlayingCard from "./PlayingCard.svelte";

  export let roster = [];
  export let mySeat = 0;
  export let currentTrick = null;
  export let handCounts = [0, 0, 0, 0];
  export let turnSeat = null;

  const POSITION_LABEL = { 1: "left", 2: "top", 3: "right" };

  $: seatsByPosition = [1, 2, 3].map((offset) => {
    const seat = (mySeat + offset) % 4;
    return { seat, position: POSITION_LABEL[offset] };
  });

  function playedCard(seat) {
    return currentTrick?.plays.find((p) => p.seat === seat)?.card ?? null;
  }

  function rosterEntry(seat) {
    return roster.find((r) => r.seat === seat);
  }
</script>

<div class="table">
  {#each seatsByPosition as { seat, position } (seat)}
    <div class="seat {position}" class:active={turnSeat === seat}>
      <div class="seat-label">
        {rosterEntry(seat)?.name ?? `Seat ${seat + 1}`}
        {#if rosterEntry(seat)?.kind?.startsWith("bot")}<span class="tag">bot</span>{/if}
        {#if rosterEntry(seat) && !rosterEntry(seat).connected}<span class="tag warn">away</span>{/if}
      </div>
      <div class="mini-hand">
        {#each Array(handCounts[seat] ?? 0) as _}<div class="mini-card"></div>{/each}
      </div>
      <div class="played">
        <PlayingCard card={playedCard(seat)} small />
      </div>
    </div>
  {/each}

  <div class="center">
    <div class="played">
      <PlayingCard card={playedCard(mySeat)} small />
    </div>
  </div>
</div>

<style>
  .table {
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: auto auto auto;
    gap: 8px;
    align-items: center;
    justify-items: center;
    min-height: 260px;
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
  .center {
    grid-column: 2;
    grid-row: 2;
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
  .mini-hand {
    display: flex;
    gap: 2px;
  }
  .mini-card {
    width: 10px;
    height: 14px;
    border-radius: 2px;
    background: #2b4a7a;
    border: 1px solid #10203a;
  }
</style>
