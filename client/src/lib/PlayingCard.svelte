<script>
  import { cardImageSrc, cardLabel } from "./cardAssets.js";

  export let card = null; // null => face-down placeholder
  export let interactive = false;
  export let disabled = false;
  export let selected = false;
  export let small = false;
  export let tiny = false;
</script>

{#if card}
  <button
    type="button"
    class="card"
    class:interactive
    class:disabled
    class:selected
    class:small
    class:tiny
    disabled={!interactive || disabled}
    on:click
    aria-label={cardLabel(card)}
  >
    <img src={cardImageSrc(card)} alt={cardLabel(card)} draggable="false" />
  </button>
{:else}
  <div class="card back" class:small class:tiny aria-hidden="true"></div>
{/if}

<style>
  .card {
    height: clamp(90px, 15vh, 150px);
    aspect-ratio: 5 / 7;
    width: auto;
    border-radius: 6px;
    border: none;
    padding: 0;
    background: transparent;
    cursor: default;
    display: inline-flex;
    flex: none;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
  }
  .card.small {
    height: clamp(60px, 10vh, 100px);
  }
  .card.tiny {
    height: clamp(30px, 5.5vh, 58px);
    border-radius: 3px;
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
