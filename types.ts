export interface Profile {
  id: string;
  name: string;
  major: string;
  year: string;
  image: string;
  rating: number;
  wins: number;
  losses: number;
  matches: number;
  bio?: string;
  tags: string[];
}

export interface EloResult {
  newRatingWinner: number;
  newRatingLoser: number;
  expectedScoreWinner: number;
  expectedScoreLoser: number;
}

export type View = 'VOTE' | 'LEADERBOARD' | 'ADD_PROFILE';
