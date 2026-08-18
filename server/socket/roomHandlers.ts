import { Server, Socket } from "socket.io";
import { RoomService } from "../services/room.service.ts";

export const roomSocket = (io: Server, socket: Socket) => {
  socket.on("create_room", async (username: string) => {
    try {
      const room = await RoomService.create({ username, socketId: socket.id });
      socket.join(room.id);
      socket.emit("room_created", RoomService.getCleanRoom(room));
    }
    catch (error) {
      socket.emit("room_error", "Failed to create room");
    }
  })
  socket.on("join_room", async (roomId: string, username: string) => {
    try {
      const room = await RoomService.join({
        roomId,
        socketId: socket.id,
        username,
      })
      socket.join(room.id);
      socket.emit("room_joined", RoomService.getCleanRoom(room));
      io.to(room.id).emit("room_updated", RoomService.getCleanRoom(room));
    }
    catch (error) {
      if (error instanceof Error)
        socket.emit("room_error", "Failed to join room");
    }
  })
  socket.on("get_room", async (roomId: string) => {
    try {
      const room = await RoomService.getRoom(roomId);
      if (!room) {
        socket.emit("room_not_found", roomId);
        return;
      }
      socket.join(room.id);
      socket.emit("room_data", RoomService.getCleanRoom(room));
    }
    catch (error) {
      socket.emit("room_error", "Failed to get room");
    }
  })
}