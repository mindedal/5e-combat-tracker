# Research: Encounter Persistence & Shareable Sessions

## Decisions

### 1) Shareable link encoding strategy

**Decision:** Use URL search params with a base64url-encoded JSON snapshot payload, with strict size checks to keep the query string under ~1,500 characters and total URL under ~2,000 characters. If the payload exceeds the safe limit, show a clear error and instruct the user to reduce encounter size or use local-only persistence.

**Rationale:** URL length limits vary and are not standardized; older clients and common server defaults can fail around 2,000 characters. Base64url is simple, dependency-free, and reliable for nested JSON. A size check prevents broken links and corrupted shares.

**Alternatives considered:**

- Server-side storage with short IDs (rejected: violates “no external services” constraint and increases scope).
- LZ-based compression (rejected for now to avoid extra dependencies; may be added later if size becomes a frequent issue).
- Custom packed schema (rejected: high complexity and migration risk).

### 2) Local persistence store

**Decision:** Persist saved encounters in `localStorage` using a versioned schema with safe read/write helpers and quota handling.

**Rationale:** localStorage is widely supported and simple for device-based persistence. It must be wrapped in try/catch because quota limits and privacy settings can throw errors.

**Alternatives considered:**

- IndexedDB (rejected: more complex for this scope).
- File downloads (rejected: poorer UX for quick save/restore).

### 3) URL state access pattern in Next.js

**Decision:** Read URL search params in `page.tsx` via `searchParams` for initial load, and use client components for interactive controls. Do not read query params in layouts.

**Rationale:** `searchParams` in page components is the App Router supported pattern, avoids stale values, and supports dynamic rendering. Client-only reads (`useSearchParams`) must be isolated with Suspense to avoid hydration issues.

**Alternatives considered:**

- Reading params in layout (rejected: layouts don’t re-render on navigation).
- Reading params only client-side (rejected: worse UX on initial load).

## Key Evidence

### URL length limits

- RFC 3986 defines URL syntax but no size cap; older clients and proxies may fail at larger lengths.
- Internet Explorer hard limit around 2,083 characters; IIS defaults `maxQueryString=2048`.

**Practical limit chosen:** keep query strings under ~1,500 characters and total URLs under ~2,000.

### localStorage behavior

- Common per-origin limits are roughly 5–10 MB on modern browsers; failures occur with `QuotaExceededError` or `SecurityError`.
- Private browsing can disable or sandbox storage, causing reads/writes to throw.

**Mitigation:** safe wrappers with try/catch, versioned payload, and fallback when storage is unavailable.

## Implications for the plan

- Enforce payload size checks before generating a share link.
- Provide clear errors for invalid or oversized links.
- Use versioned storage and migrations to handle format changes.
- Keep URL payload minimal (strip defaults, avoid redundant data).
