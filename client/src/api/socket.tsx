import { io } from "socket.io-client";

class SocketService {
  socket = io("http://localhost:3000");
  createRoom() {
    this.socket.emit("create_room");
  }
  leaveRoom() {
    this.socket.emit("leave_room");
  }
  joinRoom(room: string, user_name: string) {
    this.socket.emit("join_room", room, user_name);
  }
  sendMessage(data: { text: string }, roomId: string) {
    this.socket.emit("send_message", data, roomId);
  }
  listen(event: string, callback: (data: any) => void) {
    this.socket.on(event, callback);
  }
  stopListening(event: string) {
    this.socket.off(event);
  }
}

export const socketService = new SocketService();
