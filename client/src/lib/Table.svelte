<script>
  import { gameState, roomState, errorMessage, clearError } from "./store.js";
  import { request } from "./socket.js";
  import TrickArea from "./TrickArea.svelte";
  import Hand from "./Hand.svelte";
  import PassPanel from "./PassPanel.svelte";
  import Scoreboard from "./Scoreboard.svelte";
  import { legalMovesFromView } from "@hearts/shared";

  export let mySeat;

  $: view = $gameState;
  $: roster = $roomState?.roster ?? [];
  $: myTurn = view && view.phase === "playing" && view.turnSeat === view.seat;
  $: legalMoves = view && myTurn ? legalMovesFromView(view) : [];

  async function playCard(event) {
    const card = event.detail;
    const res = await request("playCard", { card });
    if (!res.ok) errorMessage.set(res.error);
  }

  async function submitPass(event) {
    const cards = event.detail;
    const res = await request("passCards", { cards });
    if (!res.ok) errorMessage.set(res.error);
  }
</script>

{#if view}
  <div class="table-screen">
    {#if $errorMessage}
      <button type="button" class="error" on:click={clearError}>{$errorMessage} (dismiss)</button>
    {/if}

    <div class="status">
      Round {view.roundIndex + 1} / {view.roundsTotal} — {view.direction} — {view.phase}
    </div>

    <TrickArea
      {roster}
      {mySeat}
      currentTrick={view.currentTrick}
      handCounts={view.handCounts}
      turnSeat={view.turnSeat}
    />

    {#if view.phase === "passing"}
      <PassPanel
        hand={view.hand}
        direction={view.direction}
        passSubmitted={view.passSubmitted}
        {mySeat}
        on:submit={submitPass}
      />
    {:else if view.phase === "playing"}
      <Hand hand={view.hand} {legalMoves} {myTurn} on:play={playCard} />
    {/if}

    <Scoreboard
      {roster}
      scores={view.scores}
      roundHistory={view.roundHistory}
      gameOver={view.gameOver}
      winners={view.winners}
    />
  </div>
{:else}
  <p>Loading game…</p>
{/if}

<style>
  .table-screen {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    max-width: 480px;
    margin: 0 auto;
  }
  .status {
    text-align: center;
    opacity: 0.8;
    font-size: 0.9em;
  }
  .error {
    background: #7f1d1d;
    color: #fecaca;
    padding: 8px;
    border-radius: 6px;
    cursor: pointer;
    text-align: center;
    border: none;
    font: inherit;
    width: 100%;
  }
</style>
