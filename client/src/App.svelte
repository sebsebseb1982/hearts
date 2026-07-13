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

  <div class="content">
    {#if inGame}
      <Table {mySeat} />
    {:else}
      <Lobby {roomIdFromUrl} on:joined={handleJoined} on:createNew={handleCreateNew} />
    {/if}
  </div>
</main>

<style>
  main {
    height: 100dvh;
    display: flex;
    flex-direction: column;
    padding: 12px;
    box-sizing: border-box;
    gap: 8px;
  }
  .content {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }
  .offline {
    flex: 0 0 auto;
    text-align: center;
    background: #7c2d12;
    color: #fed7aa;
    padding: 6px;
    border-radius: 6px;
  }
</style>
