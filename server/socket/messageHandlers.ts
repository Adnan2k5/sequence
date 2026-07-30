import { Server, Socket } from "socket.io";
export const messageSocket = (io: Server, socket: Socket) => {
  socket.on("send_message", (data: { text: string }, roomId: string) => {
    const message = data.text.trim();
    io.to(roomId).emit("receive_message", message);
  });
};
