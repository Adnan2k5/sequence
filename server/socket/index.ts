import { Server } from "socket.io";
import { roomSocket } from "./roomHandlers.js";
import { messageSocket } from "./messageHandlers.js";
import { gameSocket } from "./gameHandlers.js";

export const initSocket = (io: Server) => {
  io.on("connection", (socket) => {
    roomSocket(io, socket);
    messageSocket(io, socket);
    gameSocket(io, socket);
  });
};
