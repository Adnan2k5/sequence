import { io } from "socket.io-client";
import type { GameMessage } from "@/types/game.interface";

class SocketService {
  socket = io("http://localhost:3000");

  createRoom(username: string) {
    this.socket.emit("create_room", username);
  }

  leaveRoom() {
    this.socket.emit("leave_room");
  }

  joinRoom(room: string, user_name: string) {
    this.socket.emit("join_room", room, user_name);
  }

  /** Rejoin an existing socket.io room channel after a page refresh */
  getRoom(roomId: string) {
    this.socket.emit("get_room", roomId);
  }

  /** @deprecated Use getRoom() */
  sendMessage(data: { text: string }, roomId: string) {
    this.socket.emit("send_message", data, roomId);
  }

  /** Broadcast a structured game message (guess / feedback / game-over) to the room */
  sendGameMessage(message: GameMessage, roomId: string) {
    this.socket.emit("send_message", { text: JSON.stringify(message) }, roomId);
  }

  listen(event: string, callback: (data: any) => void) {
    this.socket.on(event, callback);
  }

  off(event: string) {
    this.socket.off(event);
  }

  getId() {
    return this.socket.id;
  }

  submitSecret(secret: string, roomId: string) {
    this.socket.emit("submit_secret", secret, roomId);
  }
  playAgain(roomId: string) {
    this.socket.emit("play_again", roomId);
  }
}

export const socketService = new SocketService();
