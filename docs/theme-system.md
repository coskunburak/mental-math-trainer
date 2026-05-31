# Theme System Blueprint

## 1. Theme System Architecture

### Domain model

Each theme uses `GameThemeDefinition` with:

- `id`
- `name`
- `category` (`free | premium | seasonal | limited | collab`)
- `primaryColor`
- `secondaryColor`
- `backgroundGradient`
- `accentColor`
- `successColor`
- `errorColor`
- `surfaceColor`
- `hudStyle` (`minimal | neon | glass | retro`)
- `animationStyle` (`subtle | energetic | glow | cyber`)
- `typographyStyle`
- `soundPack`
- `particleEffectType`
- `unlockRule` (free/premium/streak/referral/seasonal/limited-time/one-time purchase/combos)

### Theme engine

- Global runtime `ThemeProvider` in `src/app/theme/index.ts`
- Supports dynamic mode preference (`light`, `dark`, `system`)
- Supports runtime theme switching via `selectTheme`
- Unlock-aware selection (`evaluateThemeUnlock` + `resolveThemeSelection`)
- Persistent storage via `ThemePreferenceStore`
- Safe fallback using `DEFAULT_THEME_ID` (`focus-mode`)

### Performance and scalability

- Token-based color derivation (`createThemeColors`) from compact palette primitives
- Cached app theme objects (`themeCache`) keyed by `themeId:mode`
- Context value memoized to avoid unnecessary updates
- Light/dark adaptation done at token-generation level, not per-component
- No heavy runtime parsing in render loops (catalog and unlock checks are memoized)

## 2. Code Structure

```text
src/
  app/theme/
    index.ts                 # Provider, runtime switch, persistence wiring
    themeColorTokens.ts      # Token derivation + color math
    colors.ts                # Theme color token contract
    typography.ts            # Typography profiles by typographyStyle
    motion.ts                # Motion profiles by animationStyle
    shadows.ts               # Shadow profiles by hudStyle + mode

  features/theme/
    data/
      ThemePreferenceStore.ts
    domain/entities/
      GameTheme.ts           # Theme domain model + unlock context/rules
    domain/services/
      themeCatalog.ts        # 20 themes catalog + fallback
      themeUnlockEvaluator.ts
      themeCatalogService.ts # Access filtering + safe resolution
      __tests__/
        themeCatalog.test.ts
        themeUnlockEvaluator.test.ts

  ui/components/buttons/
    ThemeModeSwitch.tsx      # Mode/language/theme runtime controls

  features/game/presentation/screens/
    ThemeShowcaseScreen.tsx  # In-app premium marketing showcase page
```

## 3. Theme JSON Configuration Example

```json
{
  "id": "cyber-neon",
  "name": "Cyber Neon",
  "category": "premium",
  "primaryColor": "#00F5FF",
  "secondaryColor": "#8B5CF6",
  "backgroundGradient": ["#020617", "#0B102A", "#1B1145"],
  "accentColor": "#FF2DD1",
  "successColor": "#22FF9A",
  "errorColor": "#FF4D6D",
  "surfaceColor": "#101A3A",
  "hudStyle": "neon",
  "animationStyle": "cyber",
  "typographyStyle": "tech",
  "soundPack": "neon_pulses",
  "particleEffectType": "electric",
  "unlockRule": {
    "type": "premium"
  }
}
```

## 4. Detailed Breakdown of 20 Themes

### Legend

- Palette format: `Primary / Secondary / Gradient(3) / Accent / Success / Error / Surface`

| Theme            | Palette (Hex)                                                                         | Emotional Feel     | Animation | Persona                 | Tagline                             |
| ---------------- | ------------------------------------------------------------------------------------- | ------------------ | --------- | ----------------------- | ----------------------------------- |
| Focus Mode       | `#0B8F87 / #114A7A / #E8F4FF,#F4F8FF,#E6FFFA / #F97316 / #14B87A / #EF476F / #FFFFFF` | Clean focus        | Subtle    | Daily grinders          | Train clean. Think faster.          |
| Minimal Zen      | `#1A7F64 / #2D5F73 / #F8FFF9,#ECFFF5,#E8F8FF / #F59E0B / #16A34A / #DC2626 / #FDFEFE` | Calm control       | Subtle    | Mindful learners        | Calm practice. Relentless progress. |
| Color Blast      | `#0EA5E9 / #F43F5E / #FDF2FF,#E0F2FE,#FFF7ED / #8B5CF6 / #22C55E / #EF4444 / #FFFFFF` | Playful energy     | Energetic | Casual social players   | Fast math. Instant hype.            |
| Cyber Neon       | `#00F5FF / #8B5CF6 / #020617,#0B102A,#1B1145 / #FF2DD1 / #22FF9A / #FF4D6D / #101A3A` | Futuristic power   | Cyber     | Competitive users       | Run your brain at neon speed.       |
| Ice Glass        | `#67E8F9 / #C4B5FD / #DFF7FF,#F0F9FF,#E8F1FF / #38BDF8 / #10B981 / #FB7185 / #F8FDFF` | Premium calm       | Glow      | Aesthetic-focused users | Cold visuals. Hot brain speed.      |
| Cosmic Dark      | `#7C3AED / #0EA5E9 / #02030B,#0B1024,#1D1B4B / #F472B6 / #34D399 / #FB7185 / #111633` | Cinematic depth    | Glow      | Night players           | Train in deep space.                |
| Vaporwave        | `#FF4DD2 / #14B8A6 / #250B3B,#512B81,#1D4ED8 / #FDE047 / #4ADE80 / #FB7185 / #2F1A56` | Trendy nostalgia   | Energetic | Gen Z creators          | Retro future. Real gains.           |
| Golden Elite     | `#D4AF37 / #7A5E1D / #1B1204,#2A1C08,#3A2A0F / #FDE68A / #84CC16 / #F87171 / #2F210C` | Prestige           | Glow      | High-value subscribers  | Earn the gold standard.             |
| Lightning Pro    | `#38BDF8 / #312E81 / #020617,#0F172A,#1E1B4B / #FACC15 / #22C55E / #EF4444 / #12203F` | Speed rush         | Energetic | Reflex competitors      | Answer at lightning pace.           |
| Brain Matrix     | `#22C55E / #14532D / #020A04,#06210E,#0D2F16 / #86EFAC / #4ADE80 / #F87171 / #0A2311` | Hacker vibe        | Cyber     | Referral advocates      | Invite. Unlock. Dominate.           |
| Stock Market     | `#22C55E / #0F766E / #03150F,#053025,#0B4A3A / #F59E0B / #4ADE80 / #EF4444 / #0E2B24` | Tactical data      | Energetic | Finance-minded users    | Trade seconds for smarter results.  |
| Retro Arcade     | `#F59E0B / #0EA5E9 / #1A1035,#2F1D6E,#0C4A6E / #F43F5E / #84CC16 / #EF4444 / #2C1F57` | Arcade nostalgia   | Energetic | Pixel lovers            | Old-school look. New-school speed.  |
| Sunset Gradient  | `#FB7185 / #F97316 / #2D0B43,#6B21A8,#F97316 / #FDE047 / #4ADE80 / #F43F5E / #5B2575` | Warm aspiration    | Subtle    | Social sharers          | Golden hour for your brain.         |
| Ocean Deep       | `#0EA5E9 / #0F766E / #02132A,#02325E,#0A4C66 / #22D3EE / #34D399 / #FB7185 / #0A2B45` | Immersive calm     | Subtle    | Long-session users      | Dive into deep focus.               |
| Black Gold       | `#EAB308 / #F59E0B / #050505,#111111,#1F1B12 / #FDE68A / #84CC16 / #FB7185 / #17140D` | Luxury status      | Glow      | Prestige seekers        | Luxury in every answer.             |
| Diamond Pro      | `#60A5FA / #A5B4FC / #06122F,#11224A,#1E3A8A / #E0F2FE / #22C55E / #FB7185 / #152848` | Crisp precision    | Glow      | PB chasers              | Precision, cut like diamond.        |
| Space Launch     | `#38BDF8 / #F97316 / #020617,#1E293B,#334155 / #FACC15 / #22C55E / #F43F5E / #1B2538` | Mission momentum   | Energetic | Goal-driven achievers   | Launch your brain power.            |
| Dark Crimson     | `#DC2626 / #7F1D1D / #0A0205,#1B0B12,#3B0E1B / #FB7185 / #22C55E / #F43F5E / #2A1018` | High-stakes grit   | Cyber     | Survival players        | Play under pressure.                |
| Lab Mode         | `#06B6D4 / #2563EB / #F0F9FF,#E0F2FE,#DBEAFE / #0EA5E9 / #22C55E / #EF4444 / #FFFFFF` | Scientific mastery | Subtle    | Habit builders          | Built by streak. Backed by data.    |
| Festival Limited | `#F97316 / #EC4899 / #3B0764,#7E22CE,#F97316 / #FDE047 / #22C55E / #EF4444 / #5B1E7A` | Celebration        | Energetic | Event hunters           | Limited drop. Unlimited vibes.      |

## 5. Monetization Funnel Plan

### Theme inventory split

- Free base themes (3): `Focus Mode`, `Minimal Zen`, `Color Blast`
- Premium-exclusive themes (12): `Cyber Neon`, `Ice Glass`, `Cosmic Dark`, `Vaporwave`, `Golden Elite`, `Lightning Pro`, `Stock Market`, `Ocean Deep`, `Black Gold`, `Diamond Pro`, `Space Launch`, `Dark Crimson`
- Referral unlock theme: `Brain Matrix` (2 referrals)
- Streak reward theme: `Lab Mode` (7-day streak)
- Seasonal drop: `Sunset Gradient` (`summer_drop`)
- Limited-time campaign: `Festival Limited` (`festival_drop_2026` window)
- Hybrid one-time purchase + subscription theme: `Retro Arcade`

### Conversion path

1. New user sees free base themes and locked premium count in switch UI.
2. Locked messaging in runtime control surfaces upgrade need (`Premium subscription required`).
3. Premium purchase instantly unlocks 12 themes (high immediate value burst).
4. Retention loop:
   - 7-day streak unlock (`Lab Mode`) pushes habit formation.
   - Referral unlock (`Brain Matrix`) drives organic acquisition.
5. Revenue layering:
   - Subscription for broad unlock set.
   - One-time cosmetic pack (Retro Arcade) for non-subscribers.
   - Seasonal/limited scarcity for timed re-engagement and paid urgency.

## 6. Marketing Creative Strategy

### Per-theme creative framework (already encoded in catalog)

For every theme, include:

- App Store screenshot concept
- Instagram Story concept
- Before/After concept
- Sample ad copy

### Campaign-level execution

- App Store gallery sequence:
  1. Focus Mode (clarity baseline)
  2. Cyber Neon (premium wow shot)
  3. Golden Elite (status value)
  4. Lightning Pro (speed proof)
  5. Festival Limited (scarcity)
- Paid ad structure:
  - Hook (0-2s): visual transformation (Before -> After)
  - Proof (3-8s): score, combo, streak metrics
  - Offer (9-12s): "Unlock 12 premium themes"
- Social loop:
  - Weekly theme spotlight reel
  - Limited drop countdown stories
  - UGC challenge templates ("beat my Neon Sprint score")

### KPI mapping

- Theme selection rate by category
- Premium conversion after locked-theme exposure
- D7 retention lift for streak theme cohort
- Referral unlock completion rate
- Seasonal campaign reactivation rate
