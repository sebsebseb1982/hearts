import { customAlphabet } from "nanoid";

const roomIdAlphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous chars
const generateRoomId = customAlphabet(roomIdAlphabet, 6);
const generateToken = customAlphabet(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  24,
);

const DISCONNECT_GRACE_MS = Number(process.env.HEARTS_DISCONNECT_GRACE_MS) || 30_000;

/** @typedef {{seat:number, name:string|null, kind:'human'|'bot'|'empty', token:string|null, connected:boolean, socketId:string|null, disconnectTimer:any}} Seat */

export class Room {
  constructor(roomId, hostSeat = 0) {
    this.roomId = roomId;
    this.hostSeat = hostSeat;
    this.roundsTotal = 4;
    this.started = false;
    this.game = null;
    this.seed = Date.now() ^ Math.floor(Math.random() * 0xffffffff);
    this.seats = Array.from({ length: 4 }, (_, seat) => ({
      seat,
      name: null,
      kind: "empty",
      token: null,
      connected: false,
      socketId: null,
      disconnectTimer: null,
    }));
  }

  freeSeatIndex() {
    return this.seats.findIndex((s) => s.kind === "empty");
  }

  humanCount() {
    return this.seats.filter((s) => s.kind === "human").length;
  }

  addHuman(name) {
    const seatIndex = this.freeSeatIndex();
    if (seatIndex === -1) return null;
    const token = generateToken();
    this.seats[seatIndex] = {
      seat: seatIndex,
      name,
      kind: "human",
      token,
      connected: true,
      socketId: null,
      disconnectTimer: null,
    };
    return this.seats[seatIndex];
  }

  seatByToken(token) {
    return this.seats.find((s) => s.token === token) ?? null;
  }

  fillEmptySeatsWithBots() {
    for (const seat of this.seats) {
      if (seat.kind === "empty") {
        seat.kind = "bot";
        seat.name = `Bot ${seat.seat + 1}`;
        seat.connected = true;
      }
    }
  }

  markDisconnected(seat, onGraceExpired) {
    seat.connected = false;
    seat.socketId = null;
    if (seat.disconnectTimer) clearTimeout(seat.disconnectTimer);
    seat.disconnectTimer = setTimeout(() => {
      if (!seat.connected && seat.kind === "human") {
        seat.kind = "bot-covering";
        onGraceExpired(seat);
      }
    }, DISCONNECT_GRACE_MS);
  }

  reclaimSeat(seat, socketId) {
    if (seat.disconnectTimer) clearTimeout(seat.disconnectTimer);
    seat.disconnectTimer = null;
    seat.connected = true;
    seat.socketId = socketId;
    if (seat.kind === "bot-covering") seat.kind = "human";
  }

  isBotControlled(seat) {
    return seat.kind === "bot" || seat.kind === "bot-covering";
  }

  roster() {
    return this.seats.map((s) => ({
      seat: s.seat,
      name: s.name,
      kind: s.kind,
      connected: s.connected,
    }));
  }
}

export class RoomStore {
  constructor() {
    /** @type {Map<string, Room>} */
    this.rooms = new Map();
  }

  create() {
    let roomId = generateRoomId();
    while (this.rooms.has(roomId)) roomId = generateRoomId();
    const room = new Room(roomId);
    this.rooms.set(roomId, room);
    return room;
  }

  get(roomId) {
    return this.rooms.get(roomId) ?? null;
  }
}

export { DISCONNECT_GRACE_MS };
