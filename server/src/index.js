import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { Server } from "socket.io";
import { RoomStore } from "./rooms.js";
import { registerSocketHandlers } from "./socketHandlers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const CLIENT_DIST = path.resolve(__dirname, "../../client/dist");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const store = new RoomStore();

registerSocketHandlers(io, store);

app.use(express.static(CLIENT_DIST));
app.get(/^\/(?!socket\.io).*/, (req, res) => {
  res.sendFile(path.join(CLIENT_DIST, "index.html"), (err) => {
    if (err) res.status(200).send("Hearts server is running. Build the client with `npm run build`.");
  });
});

httpServer.listen(PORT, () => {
  console.log(`Hearts server listening on http://localhost:${PORT}`);
});
