<script>
  import Lobby from "./lib/Lobby.svelte";
  import Table from "./lib/Table.svelte";
  import { roomState, connected } from "./lib/store.js";

  function parseRoomIdFromPath() {
    const match = window.location.pathname.match(/^\/r\/([A-Za-z0-9]+)$/);
    return match ? match[1] : null;
  }

  let roomIdFromUrl = parseRoomIdFromPath();
  let mySeat = null;

  function handleJoined(event) {
    mySeat = event.detail.seat;
  }

  function handleCreateNew() {
    roomIdFromUrl = null;
    history.pushState({}, "", "/");
  }

  $: inGame = mySeat !== null && $roomState?.started;
</script>

<main>
  {#if !$connected}
    <div class="offline">Reconnecting to server…</div>
  {/if}

  {#if inGame}
    <Table {mySeat} />
  {:else}
    <Lobby {roomIdFromUrl} on:joined={handleJoined} on:createNew={handleCreateNew} />
  {/if}
</main>

<style>
  main {
    min-height: 100vh;
    padding: 16px;
    box-sizing: border-box;
  }
  .offline {
    text-align: center;
    background: #7c2d12;
    color: #fed7aa;
    padding: 6px;
    border-radius: 6px;
    margin-bottom: 12px;
  }
</style>
