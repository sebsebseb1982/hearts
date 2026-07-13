/** Socket.IO event names shared between client and server so the protocol can't drift. */
export const EVENTS = {
  // client -> server (all ack-style, callback(response))
  CREATE_ROOM: "createRoom",
  JOIN_ROOM: "joinRoom",
  RECONNECT_ROOM: "reconnectRoom",
  SET_ROUNDS: "setRounds",
  START_GAME: "startGame",
  PASS_CARDS: "passCards",
  PLAY_CARD: "playCard",

  // server -> room (broadcast)
  ROOM_STATE: "roomState",
  GAME_STATE: "gameState",
  ERROR: "errorMessage",
};

export const ROUND_OPTIONS = [4, 8, 12];

export const PASS_DIRECTIONS = ["left", "right", "across", "hold"];

export function passDirectionForRound(roundIndex) {
  return PASS_DIRECTIONS[roundIndex % 4];
}

/**
 * @typedef {Object} RedactedView
 * @property {string} roomId
 * @property {number} seat - the receiving client's own seat index (0-3)
 * @property {string[]} hand - the receiving client's own hand
 * @property {string} phase - "passing" | "playing" | "round-end" | "game-over"
 * @property {string} direction - current round's pass direction
 * @property {number} roundIndex
 * @property {number} roundsTotal
 * @property {boolean[]} passSubmitted - whether each seat has submitted its pass (no contents)
 * @property {{leader:number, ledSuit:string|null, plays:{seat:number,card:string}[]}|null} currentTrick
 * @property {number} trickNumber
 * @property {boolean} heartsBroken
 * @property {number|null} turnSeat
 * @property {number[]} handCounts - card counts per seat (own included)
 * @property {number[]} scores - cumulative scores per seat
 * @property {{roundIndex:number, scores:number[], shooterSeat:number|null}[]} roundHistory
 * @property {boolean} gameOver
 * @property {number[]|null} winners
 */
