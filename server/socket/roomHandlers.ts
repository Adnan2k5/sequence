import { Server, Socket } from "socket.io";
import { RoomService } from "../services/room.service.ts";
export const roomSocket = (io: Server, socket: Socket) => {
  socket.on("create_room", () => {
    RoomService.create({
      socketId: socket.id,
      username: socket.data.username,
    });
  });
  socket.on("join_room", (room: Room, user_name: string) => {
    RoomService.join({
      room,
      socketId: socket.id,
      username: user_name,
    });
  });
};
