<script>
  import { createEventDispatcher, onMount } from "svelte";
  import { request } from "./socket.js";
  import { roomState, errorMessage, clearError } from "./store.js";
  import { getStoredName, setStoredName, getSeatToken, setSeatToken } from "./identity.js";
  import { ROUND_OPTIONS } from "@hearts/shared";

  export let roomIdFromUrl = null;

  const dispatch = createEventDispatcher();

  let name = getStoredName();
  let joining = false;
  let joined = false;
  let mySeat = null;
  let roomId = roomIdFromUrl;
  let reconnectAttempted = false;

  onMount(async () => {
    if (roomIdFromUrl) {
      const token = getSeatToken(roomIdFromUrl);
      if (token) {
        joining = true;
        const res = await request("reconnectRoom", { roomId: roomIdFromUrl, seatToken: token });
        reconnectAttempted = true;
        joining = false;
        if (res.ok) {
          mySeat = res.seat;
          joined = true;
          dispatch("joined", { seat: mySeat });
        }
      } else {
        reconnectAttempted = true;
      }
    }
  });

  async function createRoom() {
    if (!name.trim()) return;
    setStoredName(name.trim());
    joining = true;
    const res = await request("createRoom", { name: name.trim() });
    joining = false;
    if (!res.ok) return errorMessage.set(res.error ?? "Could not create room");
    roomId = res.roomId;
    setSeatToken(roomId, res.seatToken);
    mySeat = res.seat;
    joined = true;
    history.pushState({}, "", res.url);
    dispatch("joined", { seat: mySeat });
  }

  async function joinRoom() {
    if (!name.trim() || !roomId) return;
    setStoredName(name.trim());
    joining = true;
    const res = await request("joinRoom", { roomId, name: name.trim() });
    joining = false;
    if (!res.ok) return errorMessage.set(res.error ?? "Could not join room");
    setSeatToken(roomId, res.seatToken);
    mySeat = res.seat;
    joined = true;
    dispatch("joined", { seat: mySeat });
  }

  async function setRounds(event) {
    await request("setRounds", { rounds: Number(event.target.value) });
  }

  async function startGame() {
    const res = await request("startGame", {});
    if (!res.ok) errorMessage.set(res.error ?? "Could not start game");
  }

  function copyLink() {
    const url = `${location.origin}/r/${roomId}`;
    navigator.clipboard?.writeText(url);
  }

  $: isHost = joined && $roomState && mySeat === $roomState.hostSeat;
</script>

<div class="lobby">
  {#if $errorMessage}
    <button type="button" class="error" on:click={clearError}>{$errorMessage} (dismiss)</button>
  {/if}

  {#if !joined}
    {#if roomIdFromUrl && !reconnectAttempted}
      <p>Connecting…</p>
    {:else}
      <h1>♠️ Dame de pique</h1>
      <label>
        Your name
        <input bind:value={name} maxlength="24" placeholder="Pseudonym" />
      </label>
      {#if roomIdFromUrl}
        <p>Joining room <strong>{roomIdFromUrl}</strong></p>
        <button disabled={joining || !name.trim()} on:click={joinRoom}>Join room</button>
        <button class="link" on:click={() => dispatch("createNew")}>Or create a new room</button>
      {:else}
        <button disabled={joining || !name.trim()} on:click={createRoom}>Create a room</button>
      {/if}
    {/if}
  {:else}
    <h2>Room {roomId}</h2>
    <button class="link" on:click={copyLink}>Copy invite link</button>

    <ul class="roster">
      {#each ($roomState?.roster ?? []) as seat}
        <li>
          Seat {seat.seat + 1}: {seat.name ?? "(empty)"}
          {#if seat.kind === "empty"}<em>waiting…</em>{/if}
          {#if seat.seat === mySeat}<strong>(you)</strong>{/if}
        </li>
      {/each}
    </ul>

    {#if isHost}
      <label>
        Rounds
        <select value={$roomState?.roundsTotal} on:change={setRounds}>
          {#each ROUND_OPTIONS as n}
            <option value={n}>{n}</option>
          {/each}
        </select>
      </label>
      <button on:click={startGame}>Start game</button>
    {:else}
      <p>Waiting for the host to start the game…</p>
    {/if}
  {/if}
</div>

<style>
  .lobby {
    max-width: 420px;
    margin: 40px auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
  label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.9em;
  }
  input,
  select {
    padding: 8px;
    border-radius: 6px;
    border: 1px solid #475569;
    background: #0f172a;
    color: inherit;
  }
  button {
    padding: 10px 16px;
    border-radius: 6px;
    border: none;
    background: #4ea1ff;
    color: white;
    font-weight: 600;
    cursor: pointer;
  }
  button:disabled {
    background: #6b7280;
    cursor: not-allowed;
  }
  button.link {
    background: #334155;
  }
  .roster {
    list-style: none;
    padding: 0;
    text-align: left;
  }
  .error {
    background: #7f1d1d;
    color: #fecaca;
    padding: 8px;
    border-radius: 6px;
    cursor: pointer;
    border: none;
    font: inherit;
    width: 100%;
  }
</style>
