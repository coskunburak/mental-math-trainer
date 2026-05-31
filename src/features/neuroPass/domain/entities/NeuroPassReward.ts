export type NeuroPassRewardType =
  | 'coins'
  | 'track_fragment'
  | 'music_track'
  | 'puzzle_pack'
  | 'boss_theme'
  | 'badge'
  | 'metronome_skin'
  | 'profile_frame';

export interface NeuroPassReward {
  id: string;
  type: NeuroPassRewardType;
  contentId: string;
  amount: number;
  title: string;
}
