interface Game {
  id: string;
  status: "WAITING" | "READY" | "COUNTDOWN" | "PLAYING" | "FINISHED";
  players: {
    id: string;
    name?: string;
    secret?: string;
    ready: boolean;
    guesses: Guess[];
  }[];
  winner?: string;
  createdAt: number;
}

interface Guess {
  value: string;
  correctLetters: [];
  correctPositions: [];
  timestamp: number;
}
