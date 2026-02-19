export const routes = {
  home: 'home',
  game: 'game',
  result: 'result',
} as const;

export type RootRouteName = (typeof routes)[keyof typeof routes];
