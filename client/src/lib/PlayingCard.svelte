<script>
  import { cardImageSrc, cardLabel } from "./cardAssets.js";

  export let card = null; // null => face-down placeholder
  export let interactive = false;
  export let disabled = false;
  export let selected = false;
  export let small = false;
</script>

{#if card}
  <button
    type="button"
    class="card"
    class:interactive
    class:disabled
    class:selected
    class:small
    disabled={!interactive || disabled}
    on:click
    aria-label={cardLabel(card)}
  >
    <img src={cardImageSrc(card)} alt={cardLabel(card)} draggable="false" />
  </button>
{:else}
  <div class="card back" class:small aria-hidden="true"></div>
{/if}

<style>
  .card {
    width: 64px;
    height: 90px;
    border-radius: 6px;
    border: none;
    padding: 0;
    background: transparent;
    cursor: default;
    display: inline-flex;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
  }
  .card.small {
    width: 48px;
    height: 68px;
  }
  .card img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.35));
  }
  .card.interactive:not(.disabled) {
    cursor: pointer;
  }
  .card.interactive:not(.disabled):hover {
    transform: translateY(-6px);
  }
  .card.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .card.selected {
    transform: translateY(-10px);
    box-shadow: 0 0 0 3px #4ea1ff inset;
    border-radius: 6px;
  }
  .card.back {
    background: repeating-linear-gradient(45deg, #2b4a7a, #2b4a7a 6px, #223a61 6px, #223a61 12px);
    border: 2px solid #10203a;
  }
</style>
