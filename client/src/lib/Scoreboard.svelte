<script>
  export let roster = [];
  export let scores = [0, 0, 0, 0];
  export let roundHistory = [];
  export let gameOver = false;
  export let winners = null;

  function name(seat) {
    return roster.find((r) => r.seat === seat)?.name ?? `Seat ${seat + 1}`;
  }
</script>

<div class="scoreboard">
  <table>
    <thead>
      <tr>
        <th>Player</th>
        <th>Score</th>
      </tr>
    </thead>
    <tbody>
      {#each [0, 1, 2, 3] as seat}
        <tr class:winner={gameOver && winners?.includes(seat)}>
          <td>{name(seat)}</td>
          <td>{scores[seat]}</td>
        </tr>
      {/each}
    </tbody>
  </table>

  {#if roundHistory.length > 0}
    <details class="history">
      <summary>Round history</summary>
      <ul>
        {#each roundHistory as round}
          <li>
            Round {round.roundIndex + 1}: {round.scores.join(" / ")}
            {#if round.shooterSeat !== null}
              — 🌟 {name(round.shooterSeat)} shot the star!
            {/if}
          </li>
        {/each}
      </ul>
    </details>
  {/if}

  {#if gameOver}
    <p class="final">
      🏆 {winners?.map(name).join(" & ")} won with the lowest score!
    </p>
  {/if}
</div>

<style>
  .scoreboard {
    padding: 8px;
    font-size: 0.9em;
  }
  table {
    border-collapse: collapse;
    width: 100%;
  }
  th,
  td {
    text-align: left;
    padding: 2px 8px;
  }
  tr.winner {
    font-weight: 700;
    color: #22c55e;
  }
  .history {
    margin-top: 6px;
  }
  .history ul {
    margin: 4px 0 0;
    padding-left: 16px;
  }
  .final {
    margin-top: 8px;
    font-weight: 700;
  }
</style>
