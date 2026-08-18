import { Room } from "../types/room.interface.js";
class roomService {
  private rooms = new Map<string, Room>();
  async create({ socketId, username }: { socketId: string; username: string }) {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newRoom: Room = {
      id: newRoomId,
      ownerId: socketId,
      createdAt: Date.now(),
      status: "WAITING",
      players: [{ socketId, username, ready: false, connected: true, guesses: [], secret: undefined }],
    };
    this.rooms.set(newRoomId, newRoom);
    return newRoom;
  }
  async join({
    roomId,
    socketId,
    username,
  }: {
    roomId: string;
    socketId: string;
    username: string;
  }) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error("ROOM_NOT_FOUND");
    }
    if (room.players.length >= 2) {
      throw new Error("ROOM_FULL");
    }
    room.players.push({ socketId, username, ready: false, connected: true, guesses: [] });
    return room;
  }
  async leave({ roomId, socketId }: { roomId: string; socketId: string }) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error("ROOM_NOT_FOUND");
    }
    room.players = room.players.filter((player) => player.socketId !== socketId);
    return room;
  }
  async getRoom(roomId: string) {
    return this.rooms.get(roomId);
  }
  async resetPlayer(roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error("ROOM_NOT_FOUND")
    }
    room.players = room.players.map((player) => {
      return {
        ...player,
        secret: undefined,
        ready: false,
      }
    })
    return room;
  }
  async updatePlayerReady({ roomId, socketId, secret }: {
    roomId: string
    socketId: string
    secret: string
  }) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error("ROOM_NOT_FOUND");
    }
    const player = room.players.find((player) => player.socketId === socketId);
    if (!player) {
      throw new Error("PLAYER_NOT_FOUND");
    }
    if (room.status !== "WAITING") {
      throw new Error("INVALID_ROOM_STATE");
    }
    const normalizedSecret = secret.trim().toUpperCase();

    if (!/^[A-Z0-9]{5}$/.test(normalizedSecret)) {
      throw new Error("INVALID_SECRET");
    }
    player.secret = normalizedSecret;
    player.ready = true;
    return room;
  }
  getCleanRoom(room: Room) {
    return {
      id: room.id,
      ownerId: room.ownerId,
      status: room.status,
      createdAt: room.createdAt,
      winnerId: room.winnerId,
      players: room.players.map(p => ({
        socketId: p.socketId,
        username: p.username,
        ready: p.ready,
        connected: p.connected,
      })),
    };
  }
}

export const RoomService = new roomService();
