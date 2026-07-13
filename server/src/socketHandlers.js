import {
  EVENTS,
  ROUND_OPTIONS,
  createGame,
  submitPass,
  playCard,
  advanceAfterTrick,
  redactStateForSeat,
  chooseMove,
} from "@hearts/shared";

const BOT_PASS_DELAY_MS = 300;
const BOT_PLAY_DELAY_MS = 500;
const TRICK_PAUSE_MS = Number(process.env.HEARTS_TRICK_PAUSE_MS) || 2500;

function roomStatePayload(room) {
  return {
    roomId: room.roomId,
    hostSeat: room.hostSeat,
    roundsTotal: room.roundsTotal,
    started: room.started,
    roster: room.roster(),
  };
}

function broadcastRoomState(io, room) {
  io.to(room.roomId).emit(EVENTS.ROOM_STATE, roomStatePayload(room));
}

function broadcastGameState(io, room) {
  if (!room.game) return;
  for (const seat of room.seats) {
    if (seat.connected && seat.socketId && (seat.kind === "human" || seat.kind === "bot-covering")) {
      io.to(seat.socketId).emit(EVENTS.GAME_STATE, redactStateForSeat(room.game, seat.seat));
    }
  }
}

/**
 * If the last play just completed a trick, holds it on screen for TRICK_PAUSE_MS, then clears
 * it and keeps the game moving. Otherwise runs `onImmediate` right away (the normal case).
 */
function scheduleTrickAdvance(io, room, onImmediate) {
  if (!room.game?.trickJustCompleted) {
    onImmediate();
    return;
  }
  setTimeout(() => {
    if (!room.game?.trickJustCompleted) return; // room/game changed underneath us; bail out
    room.game = advanceAfterTrick(room.game);
    broadcastGameState(io, room);
    driveBots(io, room);
  }, TRICK_PAUSE_MS);
}

function driveBots(io, room) {
  const state = room.game;
  if (!state || state.gameOver || state.trickJustCompleted) return;

  if (state.phase === "passing") {
    const pending = room.seats.find(
      (seat) => room.isBotControlled(seat) && !state.passSelections[seat.seat],
    );
    if (pending) {
      const view = redactStateForSeat(state, pending.seat);
      const move = chooseMove(view);
      room.game = submitPass(room.game, pending.seat, move.cards);
      broadcastGameState(io, room);
      setTimeout(() => driveBots(io, room), BOT_PASS_DELAY_MS);
    }
    return;
  }

  if (state.phase === "playing") {
    const seat = room.seats[state.turnSeat];
    if (seat && room.isBotControlled(seat)) {
      const view = redactStateForSeat(state, seat.seat);
      const move = chooseMove(view);
      room.game = playCard(room.game, seat.seat, move.card);
      broadcastGameState(io, room);
      scheduleTrickAdvance(io, room, () => setTimeout(() => driveBots(io, room), BOT_PLAY_DELAY_MS));
    }
  }
}

export function registerSocketHandlers(io, store) {
  io.on("connection", (socket) => {
    socket.on(EVENTS.CREATE_ROOM, ({ name } = {}, ack) => {
      const room = store.create();
      const seat = room.addHuman((name || "Host").slice(0, 24));
      seat.socketId = socket.id;
      socket.join(room.roomId);
      socket.data.roomId = room.roomId;
      socket.data.seatToken = seat.token;
      ack?.({
        ok: true,
        roomId: room.roomId,
        url: `/r/${room.roomId}`,
        seat: seat.seat,
        seatToken: seat.token,
      });
      broadcastRoomState(io, room);
    });

    socket.on(EVENTS.JOIN_ROOM, ({ roomId, name } = {}, ack) => {
      const room = store.get(roomId);
      if (!room) return ack?.({ ok: false, error: "Room not found" });
      if (room.started) return ack?.({ ok: false, error: "Game already started" });
      const seat = room.addHuman((name || "Player").slice(0, 24));
      if (!seat) return ack?.({ ok: false, error: "Room is full" });
      seat.socketId = socket.id;
      socket.join(room.roomId);
      socket.data.roomId = room.roomId;
      socket.data.seatToken = seat.token;
      ack?.({ ok: true, roomId: room.roomId, seat: seat.seat, seatToken: seat.token });
      broadcastRoomState(io, room);
    });

    socket.on(EVENTS.RECONNECT_ROOM, ({ roomId, seatToken } = {}, ack) => {
      const room = store.get(roomId);
      if (!room) return ack?.({ ok: false, error: "Room not found" });
      const seat = room.seatByToken(seatToken);
      if (!seat) return ack?.({ ok: false, error: "Invalid seat token" });

      room.reclaimSeat(seat, socket.id);
      socket.join(room.roomId);
      socket.data.roomId = room.roomId;
      socket.data.seatToken = seatToken;

      ack?.({ ok: true, roomId: room.roomId, seat: seat.seat });
      broadcastRoomState(io, room);
      if (room.game) {
        socket.emit(EVENTS.GAME_STATE, redactStateForSeat(room.game, seat.seat));
      }
    });

    socket.on(EVENTS.SET_ROUNDS, ({ rounds } = {}, ack) => {
      const room = store.get(socket.data.roomId);
      if (!room) return ack?.({ ok: false, error: "Not in a room" });
      const seat = room.seatByToken(socket.data.seatToken);
      if (!seat || seat.seat !== room.hostSeat) return ack?.({ ok: false, error: "Host only" });
      if (!ROUND_OPTIONS.includes(rounds)) return ack?.({ ok: false, error: "Invalid round count" });
      room.roundsTotal = rounds;
      ack?.({ ok: true });
      broadcastRoomState(io, room);
    });

    socket.on(EVENTS.START_GAME, (_payload, ack) => {
      const room = store.get(socket.data.roomId);
      if (!room) return ack?.({ ok: false, error: "Not in a room" });
      const seat = room.seatByToken(socket.data.seatToken);
      if (!seat || seat.seat !== room.hostSeat) return ack?.({ ok: false, error: "Host only" });
      if (room.started) return ack?.({ ok: false, error: "Already started" });

      room.fillEmptySeatsWithBots();
      room.started = true;
      room.game = createGame({ roomId: room.roomId, seed: room.seed, roundsTotal: room.roundsTotal });

      ack?.({ ok: true });
      broadcastRoomState(io, room);
      broadcastGameState(io, room);
      driveBots(io, room);
    });

    socket.on(EVENTS.PASS_CARDS, ({ cards } = {}, ack) => {
      const room = store.get(socket.data.roomId);
      const seat = room?.seatByToken(socket.data.seatToken);
      if (!room || !seat) return ack?.({ ok: false, error: "Not in a room" });
      try {
        room.game = submitPass(room.game, seat.seat, cards);
        ack?.({ ok: true });
        broadcastGameState(io, room);
        driveBots(io, room);
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on(EVENTS.PLAY_CARD, ({ card } = {}, ack) => {
      const room = store.get(socket.data.roomId);
      const seat = room?.seatByToken(socket.data.seatToken);
      if (!room || !seat) return ack?.({ ok: false, error: "Not in a room" });
      try {
        room.game = playCard(room.game, seat.seat, card);
        ack?.({ ok: true });
        broadcastGameState(io, room);
        scheduleTrickAdvance(io, room, () => driveBots(io, room));
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    socket.on("disconnect", () => {
      const room = store.get(socket.data.roomId);
      if (!room) return;
      const seat = room.seats.find((s) => s.socketId === socket.id);
      if (!seat) return;
      room.markDisconnected(seat, () => {
        broadcastRoomState(io, room);
        driveBots(io, room);
      });
      broadcastRoomState(io, room);
    });
  });
}
