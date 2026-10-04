# i18n Notes — TOOLS subsite

Status: **language-ready, not translated.** No translation pages are built.

## What "language-ready" means here

The TOOLS subsite keeps all user-facing copy inline in English. There is no
per-language routing (`/zh/…`) and no translated pages yet. The architecture is
ready for translation later because:

1. **Site-wide URLs come from config** (`shared/config/config.ts`) — no hardcoded
   domains or paths, so a localized site can be pointed at the same config.
2. **All titles/descriptions are declared per page** in `BaseLayout` props, so they
   can be extracted into a message catalog without touching the markup.
3. **All data strings are in `shared/data/*.json`** with optional `name_zh` /
   `rule_text` fields already present for several entities — the data model already
   anticipates bilingual content.
4. **No string is computed in client scripts** in a way that blocks localization
   (numeric labels are the only inline strings, and those are small and isolated).

## When we do translate

- Add `hreflang` alternates in `BaseLayout` (an `alternates` prop).
- Add a lightweight message catalog (per-locale JSON) and swap page copy via a
  locale prefix in the URL.
- Keep calculations in `src/lib/calc.js` language-agnostic (they return numbers,
  not strings — already true).
- Do not translate schema.org JSON-LD values that must match the canonical URL.

## Deliberately not done now

- No machine-translated pages (quality risk).
- No translated currency/tax/rule data — sources remain English/authoritative
  until a human reviews the target language.
