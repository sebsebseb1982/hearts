<script>
  import { createEventDispatcher } from "svelte";
  import PlayingCard from "./PlayingCard.svelte";
  import { sortHand } from "@open-hearts/shared";
  import { fanTransform } from "./fan.js";

  export let hand = [];
  export let direction = "left";
  export let passSubmitted = [false, false, false, false];
  export let mySeat = 0;

  const dispatch = createEventDispatcher();

  let selected = [];

  $: sorted = sortHand(hand);
  $: alreadySubmitted = passSubmitted[mySeat];
  $: submittedCount = passSubmitted.filter(Boolean).length;

  const DIRECTION_LABEL = {
    left: "Pass 3 cards to your left ⟵",
    right: "Pass 3 cards to your right ⟶",
    across: "Pass 3 cards across ⟷",
  };

  function toggle(card) {
    if (alreadySubmitted) return;
    if (selected.includes(card)) {
      selected = selected.filter((c) => c !== card);
    } else if (selected.length < 3) {
      selected = [...selected, card];
    }
  }

  function submit() {
    if (selected.length !== 3) return;
    dispatch("submit", selected);
  }
</script>

<div class="pass-panel">
  <p class="direction">{DIRECTION_LABEL[direction] ?? direction}</p>

  {#if alreadySubmitted}
    <p class="waiting">Waiting for other players… ({submittedCount}/4 submitted)</p>
  {:else}
    <div class="hand">
      {#each sorted as card, i (card)}
        {@const { angle, dip } = fanTransform(i, sorted.length)}
        <div class="fan-slot" style="transform: rotate({angle}deg) translateY({dip}px); z-index: {i};">
          <PlayingCard
            {card}
            interactive
            selected={selected.includes(card)}
            on:click={() => toggle(card)}
          />
        </div>
      {/each}
    </div>
    <button class="submit" disabled={selected.length !== 3} on:click={submit}>
      Pass {selected.length}/3 cards
    </button>
  {/if}
</div>

<style>
  .pass-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 8px;
  }
  .direction {
    font-weight: 600;
  }
  .hand {
    display: flex;
    align-items: flex-end;
    justify-content: safe center;
    padding: 28px clamp(20px, 4vh, 50px) 34px;
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
  .submit {
    padding: 8px 16px;
    border-radius: 6px;
    border: none;
    background: #4ea1ff;
    color: white;
    font-weight: 600;
    cursor: pointer;
  }
  .submit:disabled {
    background: #6b7280;
    cursor: not-allowed;
  }
  .waiting {
    opacity: 0.8;
  }
</style>
