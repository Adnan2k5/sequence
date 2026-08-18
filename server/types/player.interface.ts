export interface Player {
  socketId: string;
  username: string;

  ready: boolean;

  connected: boolean;
  secret?: string
  guesses?: { guess: string; correctCharacters: number; correctPositions: number }[]
}
