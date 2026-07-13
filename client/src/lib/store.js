import { writable } from "svelte/store";
import { socket } from "./socket.js";

export const roomState = writable(null);
export const gameState = writable(null);
export const errorMessage = writable(null);
export const connected = writable(socket.connected);

socket.on("connect", () => connected.set(true));
socket.on("disconnect", () => connected.set(false));
socket.on("roomState", (payload) => roomState.set(payload));
socket.on("gameState", (payload) => gameState.set(payload));
socket.on("errorMessage", (payload) => errorMessage.set(payload));

export function clearError() {
  errorMessage.set(null);
}
