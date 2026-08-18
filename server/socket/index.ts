import { Server } from "socket.io";
import { roomSocket } from "./roomHandlers";
import { messageSocket } from "./messageHandlers";
import { gameSocket } from "./gameHandlers";

export const initSocket = (io: Server) => {
  io.on("connection", (socket) => {
    roomSocket(io, socket);
    messageSocket(io, socket);
    gameSocket(io, socket);
  });
};
