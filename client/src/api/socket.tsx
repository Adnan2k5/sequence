import { io } from "socket.io-client";

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
  sendMessage(data: { text: string }, roomId: string) {
    this.socket.emit("send_message", data, roomId);
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
  getRoom(roomId: string) {
    this.socket.emit("get_room", roomId);
  }
  submitSecret(secret: string, roomId: string) {
    this.socket.emit("submit_secret", secret, roomId);
  }
}

export const socketService = new SocketService();
