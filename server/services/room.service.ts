class roomService {
  async create({ socketId, username }: { socketId: string; username: string }) {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newRoom: Room = {
      id: newRoomId,
      ownerId: socketId,
      players: [{ socketId, username, ready: false, connected: true }],
    };
    return newRoom;
  }
  async join({
    room,
    socketId,
    username,
  }: {
    room: Room;
    socketId: string;
    username: string;
  }) {
    if (room.players.length >= 2) {
      throw new Error("Room is full");
    }
    room.players.push({ socketId, username, ready: false, connected: true });
    return room;
  }
  async leave({ room, socketId }: { room: Room; socketId: string }) {
    room.players = room.players.filter(
      (player) => player.socketId !== socketId,
    );
    return room;
  }
}

export const RoomService = new roomService();
