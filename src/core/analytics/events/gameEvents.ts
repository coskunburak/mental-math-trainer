export const gameEvents = {
  sessionStart: 'session_start',
  sessionEnd: 'session_end',
  questionAnswered: 'question_answered',
  accuracy: 'accuracy',
  streak: 'streak',
  sessionLength: 'session_length',
  retention: 'retention',
  dailyChallengeStarted: 'daily_challenge_started',
  dailyChallengeCompleted: 'daily_challenge_completed',
  insightsViewed: 'insights_viewed',
} as const;
