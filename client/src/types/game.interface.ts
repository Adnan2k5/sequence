export interface Guess {
  value: string;
  correctLetters: [];
  correctPositions: [];
  timestamp: number;
}

export interface Room {
  id: string;
  ownerId: string;
  status: "WAITING" | "READY" | "COUNTDOWN" | "PLAYING" | "FINISHED";
  players: Player[]
  winner?: string;
  createdAt: number;
}

export interface Player {
  socketId: string;
  username: string;

  ready: boolean;

  connected: boolean;
  secret?: string
  guesses?: Guess[]
}
