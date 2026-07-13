const NAME_KEY = "hearts:name";

export function getStoredName() {
  return localStorage.getItem(NAME_KEY) ?? "";
}

export function setStoredName(name) {
  localStorage.setItem(NAME_KEY, name);
}

function tokenKey(roomId) {
  return `hearts:room:${roomId}:token`;
}

export function getSeatToken(roomId) {
  return localStorage.getItem(tokenKey(roomId));
}

export function setSeatToken(roomId, token) {
  localStorage.setItem(tokenKey(roomId), token);
}

export function clearSeatToken(roomId) {
  localStorage.removeItem(tokenKey(roomId));
}
