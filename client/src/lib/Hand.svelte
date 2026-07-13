<script>
  import { createEventDispatcher } from "svelte";
  import PlayingCard from "./PlayingCard.svelte";
  import { sortHand } from "@hearts/shared";

  export let hand = [];
  export let legalMoves = [];
  export let myTurn = false;

  const dispatch = createEventDispatcher();

  $: sorted = sortHand(hand);
  $: legalSet = new Set(legalMoves);
</script>

<div class="hand">
  {#each sorted as card (card)}
    <PlayingCard
      {card}
      interactive={myTurn}
      disabled={myTurn && !legalSet.has(card)}
      on:click={() => dispatch("play", card)}
    />
  {/each}
</div>

<style>
  .hand {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    justify-content: center;
    padding: 8px;
  }
</style>
