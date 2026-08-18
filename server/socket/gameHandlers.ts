import { Server, Socket } from "socket.io";
import { RoomService } from "../services/room.service.ts";


export const gameSocket = (io: Server, socket: Socket) => {
    socket.on("submit_secret", async (secret: string, roomId: string) => {
        try {
            const room = await RoomService.getRoom(roomId);
            if (!room) {
                socket.emit("game_error", "Room not found");
                return;
            }
            const updatedRoom = await RoomService.updatePlayerReady({ roomId, secret, socketId: socket.id });
            const cleanRoom = RoomService.getCleanRoom(updatedRoom);
            io.to(roomId).emit("room_updated", cleanRoom);
        }
        catch (error) {
            if (error instanceof Error)
                socket.emit("game_error", error.message);
        }
    })
    socket.on("play_again", async (roomId: string) => {
        try {
            const updatedRoom = await RoomService.resetPlayer(roomId);
            const cleanRoom = RoomService.getCleanRoom(updatedRoom);
            io.to(roomId).emit("room_updated", cleanRoom);
        }
        catch (error) {
            if (error instanceof Error)
                socket.emit("game_error", error.message);
        }
    })

}
