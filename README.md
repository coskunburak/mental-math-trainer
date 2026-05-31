# Mental Math Trainer

![Mental Math Trainer icon](assets/icon.png)

Mental Math Trainer is an Expo + React Native mobile app that turns mental arithmetic into short, measurable, and replayable training sessions. The app evaluates more than the final answer: speed, accuracy, combo control, rhythm, level progression, and long-term habit metrics all feed into the player experience.

The goal is to go beyond a basic four-operation math game. Mental Math Trainer shows users how much they improve after each run, tracks strong and weak areas, adds motivation through a premium theme and reward economy, and introduces an advanced Neuro Fusion mode that combines math with rhythm, memory, and puzzle pressure.

## Highlights

- **Multiple game modes:** Daily, Sprint, Zen, Survival, Custom Training, and Neuro Fusion.
- **Smart question generation:** Addition, subtraction, multiplication, and division questions are generated with deterministic seeds based on level and difficulty.
- **Score and combo system:** Correctness, response time, difficulty level, and combo multiplier all contribute to scoring.
- **XP, levels, and streaks:** Player progress, daily clears, best score, best combo, and recent session history are persisted.
- **Performance insights:** Accuracy, average response time, total sessions, and best score are tracked per mode and operation type.
- **Neuro Fusion:** An advanced training mode that blends rhythm math, puzzles, memory, and reflex phases in a single run.
- **Neuro Pass:** A season-based progression layer with quests, rewards, premium track, tier skips, coins, and track fragments.
- **Theme system:** A 20-theme structure with free, premium, seasonal, limited, and collab categories tied to unlock rules.
- **Premium flow:** Monetization surfaces for custom training, advanced insights, unlimited practice, theme showcases, and rewarded bonus XP.
- **TR/EN localization:** App copy is managed through Turkish and English language resources.
- **Testable domain layer:** Jest tests cover scoring, question generation, difficulty, brain score, Neuro Fusion, and Neuro Pass economy logic.

## Game Modes

| Mode            | Description                                                                   |
| --------------- | ----------------------------------------------------------------------------- |
| Daily           | A daily seed-based challenge with a limited number of questions.              |
| Sprint          | A timed mode focused on answering as many questions as possible.              |
| Zen             | Untimed practice for focused training without pressure.                       |
| Survival        | A more competitive run type with stronger mistake pressure.                   |
| Custom Training | A premium training mode where players choose duration, limit, and operations. |
| Neuro Fusion    | The flagship mode combining math, rhythm, puzzles, memory, and reflexes.      |

## Neuro Fusion

Neuro Fusion turns the classic mental math loop into a denser cognitive workout. Runs start with BPM and preset selection, with optional latency calibration. The session then rotates through multiple pressure phases:

- **Rhythm Math:** Questions are answered inside beat windows; perfect, great, good, and offbeat timing affect the score.
- **Puzzle Phase:** Includes missing sequences, mixed operation patterns, grid puzzles, odd-one-out prompts, equation balancing, and quick estimates.
- **Cognitive Blend:** Echo Stack and Reflex Gate combine memory, reaction time, and math.
- **Boss Phase:** A more intense mixed micro-challenge at the end of the run.

The result screen shows score, grade, accuracy, average beat offset, flow peak, phase breakdown, XP, coins, track fragments, and badge rewards.

## Neuro Pass

Neuro Pass connects the game to a season-based reward system. Players earn NXP from Neuro Fusion runs, quests, and claim flows, then unlock rewards across free and premium tracks.

The system includes:

- Season manifest validation and fallback behavior.
- Daily, weekly, and boss quest structure.
- Idempotent XP grant and reward claim policies.
- Premium entitlement, restore purchases, and IAP product catalog flows.
- Tier skip purchase and usage logic.
- Anti-abuse checks for spam tapping, time spoofing, and cap policies.
- Repository interfaces and a local-first migration plan for a future backend.

## Themes and Visual Identity

The theme system supports runtime light, dark, and system modes. Each theme defines its palette, HUD style, animation character, typography profile, sound pack, particle type, and unlock rule.

Theme categories:

- Free starter themes
- Premium theme sets
- Streak and referral unlock themes
- Seasonal and limited-time campaign themes
- Hybrid themes unlocked by one-time purchase or subscription

See [docs/theme-system.md](docs/theme-system.md) for the detailed theme plan.

## Technical Architecture

The project uses a feature-first, domain-oriented structure. UI, domain, data, and infrastructure concerns are separated, and dependencies are resolved through a DI container.

```text
src/
  app/                 # Bootstrap, DI, navigation, theme, i18n, config
  core/                # Analytics, ads, storage, remote config, telemetry, utils
  features/
    game/              # Mental math domain, screens, store, scoring, Neuro Fusion
    neuroPass/         # Season pass, quests, rewards, IAP, anti-abuse
    theme/             # Theme catalog, unlock evaluator, preference store
  ui/                  # Shared layout, button, and feedback components
```

Key technical choices:

- **Expo 54 + React Native 0.81 + React 19**
- **TypeScript strict mode**
- **Jest + ts-jest** for domain and store tests
- **ESLint + Prettier + Husky + lint-staged**
- **Path aliases:** `@app`, `@core`, `@features`, `@ui`
- **Repository interfaces:** separated local storage and backend-ready implementations
- **Analytics sanitization:** event parameters pass through PII guards and sanitizer layers

## Installation

```bash
npm install
```

Start the development server:

```bash
npm start
```

Platform commands:

```bash
npm run ios
npm run android
npm run web
```

## Quality Checks

```bash
npm run lint
npm run test
npm run typecheck
npm run ci
```

Format the codebase:

```bash
npm run format
```

## Push to GitHub

If this repository is already connected to `origin`:

```bash
git status
git add README.md
git commit -m "docs: translate readme to english"
git push origin main
```

If you want to push all current project changes:

```bash
git status
git add .
git commit -m "feat: update mental math trainer"
git push origin main
```

If you are connecting the repository from scratch:

```bash
git init
git branch -M main
git remote add origin https://github.com/coskunburak/mental-math-trainer.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

## Documentation

- [Neuro Fusion Design Doc](docs/neuro-fusion-design.md)
- [Neuro Pass Migration Plan](docs/neuro_pass_migration_plan.md)
- [Theme System Blueprint](docs/theme-system.md)

## Summary

Mental Math Trainer combines fast arithmetic practice, level progression, personal performance insights, a premium theme economy, a season-based Neuro Pass system, and the rhythm/puzzle-driven Neuro Fusion mode in a single mobile app. On the code side, it provides testable domain services, a modular feature structure, and repository boundaries that are ready for future backend migration.
