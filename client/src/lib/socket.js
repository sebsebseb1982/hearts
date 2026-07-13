import { io } from "socket.io-client";

export const socket = io({ autoConnect: true });

/** Emits an event and resolves with the server's ack payload. */
export function request(event, payload = {}) {
  return new Promise((resolve) => {
    socket.emit(event, payload, resolve);
  });
}
