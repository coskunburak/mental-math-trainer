# Neuro Fusion Design Doc

## Mode Positioning
**Mode name:** NEURO FUSION  
**Tagline:** Music-driven math + puzzles + cognition in one addictive run.  
**Core promise:** Train speed, accuracy, working memory, and pattern recognition under rhythm pressure.

Neuro Fusion is an advanced special mode that keeps each run in a compact 2-4 minute window and rotates phase pressure (rhythm timing, puzzle inference, cognitive load, boss burst) to maximize replayability.

## High-Level Loop
- **Run length:** Configurable, default 180s (clamped 120-240s).
- **Beat clock:** Deterministic beat timing from BPM; drift-correction hooks included.
- **Beat:** Smallest timing unit (e.g., 120 BPM = 500ms).
- **Phase:** Deterministic beat blocks. Rotation is `Rhythm -> Puzzle -> Cognitive`, with a final **Boss** phase.
- **Boss:** Fixed end-cap with mixed queue: 3 rhythm, 2 puzzle, 3 reaction, 1 memory.

## Phase Rules + UX

### 1) Rhythm Math
- Math prompts are timed in beat windows.
- Beat windows: perfect / great / good / offbeat (with calibration offset).
- Correct on-beat earns rhythm multipliers and builds flow.
- Question lifetime uses `beatsPerQuestion` and scales by adaptive difficulty.

### 2) Puzzle Phase
Implemented puzzle families:
1. Missing sequence
2. Mixed operation pattern
3. Grid mini puzzle
4. Odd one out
5. Equation balance
6. Quick estimate

- Puzzle sampling is weighted by weakness (low-accuracy puzzle types are sampled slightly more).
- Repetition cap prevents same-type spam.
- Hint + micro-explanation shown outside hardcore settings.

### 3) Cognitive Blend
Alternates:
- **Echo Stack (memory + math):** Operation stack over short beat sequence.
- **Reflex Gate (reaction + math):** True/false or threshold gates with shrinking windows.

Adaptive controller reduces memory steps and widens reaction window when struggling.

### 4) Boss Phase
- Mixed micro-challenges with stronger reward/penalty scaling.
- High combo ceiling and stronger wrong-pressure.
- Uses dedicated boss queue with deterministic shuffle per seed.

## Scoring + Difficulty
- Score components: base by challenge type + speed bonus + rhythm multiplier + combo multiplier + insight multiplier (+ boss multiplier).
- Penalties: wrong answers, misses/timeouts, off-beat, and anti-spam penalties.
- **Flow meter:** increases with consistent on-beat success, drops on mistakes/spam.
- **Adaptive difficulty:** bounded updates to beat window scale, beats/question, memory steps, reaction window.

## Balance Targets (Standard Preset)
- **P50 profile target:** ~1625 score, ~78% accuracy, ~128ms avg beat offset, expected grade `B`.
- **P75 profile target:** ~2140 score, ~85% accuracy, ~96ms avg beat offset, expected grade `A`.
- **P90 profile target:** ~2670 score, ~92% accuracy, ~68ms avg beat offset, expected grade `S`.

### Grade thresholds tuned to profile targets
- `S`: score >= 2550, accuracy >= 0.90, avg beat offset <= 90ms
- `A`: score >= 2050, accuracy >= 0.82, avg beat offset <= 135ms
- `B`: score >= 1500, accuracy >= 0.72, avg beat offset <= 190ms
- `C`: fallback

### Reward economy tuned to profile targets
- `XP`: `80 + score*0.055 + bestCombo*2.5 + gradeBonus`
- `Coins`: `20 + score*0.02 + bestCombo*1.3 + gradeBonus`
- `Track fragments`: `1 + floor(flowPeak/25) + gradeBonus`
- Grade bonuses are flat and monotonic (`S > A > B > C`).

## Rewards + Progression Hooks
- Reward bundle per run: XP, coins, track fragments, weekly league points, badges.
- Grades: S/A/B/C from score + accuracy + beat offset quality.
- Neuro Fusion progress persistence stores:
  - best score / best grade
  - run history
  - daily challenge seed map
  - calibration profile
  - cumulative coins/fragments

## Config + Balancing Knobs
`NeuroFusionConfig` supports remote-config-friendly knobs:
- BPM bounds
- Beat windows by tier
- Beats-per-question by tier
- Phase durations
- Scoring multipliers and penalties
- Flow gain/loss rates
- Puzzle mix distribution
- Memory steps by tier
- Reaction windows by tier
- Anti-spam thresholds

### Presets
- **Beginner:** wider windows, more beats per question, longer puzzle windows.
- **Standard:** balanced default.
- **Hardcore:** tighter windows, fewer hints, faster cadence, harsher penalties.

## Analytics
Events emitted:
- `neurofusion_run_start`
- `neurofusion_phase_start`
- `neurofusion_question_answered`
- `neurofusion_run_end`
- `neurofusion_reward_claimed`
- `neurofusion_calibration_completed`

Also mirrors existing taxonomy patterns through `screen_view`, `ui_tap`, `business_action`.
All event params are sanitized and PII-guarded.

## Example Run Walkthrough
Sample progression:
1. Rhythm question solved in perfect window -> base 34, rhythm +40%, combo starts, flow rises.
2. Puzzle solved quickly -> puzzle base + speed bonus; insight multiplier increases.
3. Echo Stack solved -> memory base reward, combo chain continues.
4. Reflex Gate missed -> combo reset, flow drop, wrong penalty.
5. Boss phase starts -> multipliers intensify; strong finish can recover grade.

Result output includes score, accuracy, avg beat offset, phase breakdown, grade, and reward bundle.
