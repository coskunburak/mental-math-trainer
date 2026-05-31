export const routes = {
  home: 'home',
  game: 'game',
  result: 'result',
  neuroPass: 'neuro_pass',
} as const;

export type RootRouteName = (typeof routes)[keyof typeof routes];
