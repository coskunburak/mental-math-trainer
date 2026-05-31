# Neuro Pass Migration Plan (Local -> Backend)

This document defines how Neuro Pass transitions from client-only local storage to backend-authoritative state while preserving player progress and minimizing risk.

## 1) Data Model Mapping

### Local XP grants -> Server ledger
- Local entity: `NeuroPassXpGrant`
- Server request DTO: `XpGrantRequest`
- Mapping:
  - `id` -> `idempotencyKey`
  - `amount` -> `amount`
  - `source` -> `source`
  - `meta` -> `meta`
  - `createdAtUtc` -> `createdAtUtc`
- Idempotency policy:
  - Run grant: `xpGrantId = runId`
  - Quest grants: existing period-based keys remain stable

### Local claims -> Server claims
- Local key format (formalized): `seasonId:tier:track`
- Server request DTO: `ClaimRequest`
- Mapping:
  - local key -> `idempotencyKey`
  - split key to `seasonId`, `tier`, `track`

### Entitlements
- Local entitlement per season remains cached (`premiumOwned`, skip balances)
- Server becomes source of truth once available
- Restore/purchase history still retained locally as cache and audit trail

## 2) Migration Phases

### Phase 1: Dual-write (safe warm-up)
- Reads remain local-first.
- Every XP grant and claim writes both:
  - Local repositories (current behavior)
  - Backend APIs (best-effort)
- Failed server writes are queued/retried (non-blocking UI).
- Idempotency keys guarantee server dedupe when retries occur.

### Phase 2: Server-read with local fallback
- Primary reads from backend:
  - progress, ledger aggregates, quests, claims, entitlement
- Local state used as fallback cache when:
  - offline
  - API timeout
  - backend disabled by flag
- Reconciliation runs when connectivity is restored.

### Phase 3: Server-authoritative
- Server is canonical source.
- Local storage is cache only:
  - fast startup
  - offline grace UX
- Client-side anti-abuse remains as soft signal generation.
- Server anti-fraud and receipt validation enforce authoritative decisions.

## 3) Conflict Resolution

### Duplicate grants/claims
- Prevented with idempotency keys on server endpoints.
- Client may retry safely without double-credit.

### State conflicts
- Rule: **server wins** on disputes.
- Client reconciles by replacing local cache with server response.
- Any unresolved local-only grants are retried by idempotency key.

### Clock anomalies
- Current client-only time spoof heuristic remains advisory during migration.
- Once backend exists, server time should define period boundaries.

## 4) Multi-device Strategy

### Progress merge
- Merge strategy:
  - XP ledger append-only on server
  - progress derived from ledger + claims
- Device A and B can grant safely due idempotency and append-only model.
- Last-write-wins is avoided for numeric totals; totals are recomputed from ledger.

### Claims/entitlements across devices
- Claims are idempotent by `seasonId:tier:track`.
- Entitlements are user-account scoped server-side; local cache mirrors server snapshot.
- Restore operation syncs server + local cache.

## 5) Rollback Strategy

If backend rollout causes regressions:
1. Set `neuroPassBackendEnabled=false` (feature flag).
2. DI routes all repositories back to local implementations.
3. App continues operating with existing local ledger/cache.
4. Server writes can remain disabled until incident resolution.

Rollback is safe because Sprint 6 keeps local repositories complete and API repositories isolated behind interfaces.

## 6) Known Risks

- Client-only verification is not secure (expected until server verification).
- Device clock manipulation can still influence local-only behavior.
- Local storage corruption is mitigated with normalization/fallback, but not fully preventable.
- Refund and chargeback handling requires backend entitlements and store server validation.

## 7) Operational Checklist Before Enabling Backend

- Implement `NeuroPassApiClient` endpoints.
- Enable server-side idempotency for XP and claims.
- Add retry queue + reconciliation job.
- Add server time-based period keys.
- Validate receipt processing and refund revocation flows.
- Gradually roll out `neuroPassBackendEnabled` by cohort.
