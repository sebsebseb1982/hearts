<script>
  import { createEventDispatcher } from "svelte";
  import PlayingCard from "./PlayingCard.svelte";
  import { sortHand } from "@hearts/shared";
  import { fanTransform } from "./fan.js";

  export let hand = [];
  export let legalMoves = [];
  export let myTurn = false;

  const dispatch = createEventDispatcher();

  $: sorted = sortHand(hand);
  $: legalSet = new Set(legalMoves);
</script>

<div class="hand">
  {#each sorted as card, i (card)}
    {@const { angle, dip } = fanTransform(i, sorted.length)}
    <div class="fan-slot" style="transform: rotate({angle}deg) translateY({dip}px); z-index: {i};">
      <PlayingCard
        {card}
        interactive={myTurn}
        disabled={myTurn && !legalSet.has(card)}
        on:click={() => dispatch("play", card)}
      />
    </div>
  {/each}
</div>

<style>
  .hand {
    display: flex;
    align-items: flex-end;
    justify-content: safe center;
    padding: 28px clamp(20px, 4vh, 50px) 34px;
    flex: 0 0 auto;
    max-width: 100%;
  }
  .fan-slot {
    transform-origin: bottom center;
    transition: transform 0.15s ease;
    margin: 0 clamp(-30px, -2.8vh, -16px);
  }
  .fan-slot:first-child {
    margin-left: 0;
  }
  .fan-slot:last-child {
    margin-right: 0;
  }
</style>
