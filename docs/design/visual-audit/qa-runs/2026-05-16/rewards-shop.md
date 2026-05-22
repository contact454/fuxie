# Visual QA — `rewards-shop`

- **Surface ID**: `rewards-shop`
- **Route**: `/rewards/shop`
- **Date**: 2026-05-16
- **Owner**: PM
- **Co-authors**: FE (Playwright capture), GD (item-state semantics), DSD (marketShelfFrame + dim/greyscale tokens)
- **Spec refs**:
  - `requirements.md` Req 8 (Shop / Inventory), Req 11, Req 16, Req 20.1 / 20.4
  - `design.md` §I.6
  - `apps/web/src/lib/mascot/mascot-role.ts` `SURFACE_MASCOT_CONFIG['rewards-shop']`

## State coverage

| State | Mascot role | Required? |
| --- | --- | --- |
| `default` | `companion` | yes |
| `empty` | `guard` | yes |
| `error` | `guard` | yes |
| `success` | `cheer` | yes (post-redeem celebration via `<ResultRewardLoop>` overlay) |

Verified by `pnpm check:state-shell-coverage`.

## Default state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| RS1 | Wallet (Fucoin + XP, range 0–9 999 999) visible inside first viewport (no scroll, viewports 360–480 px wide) | Req 8.1, Req 14.1 | PASS — `ShopWalletPill` is fixed-top of hero | `screenshots/rewards-shop/rewards-shop-default-mobile.png` (PENDING) |
| RS2 | Each item card classified to exactly one of `affordable | unaffordable | owned | pending | locked` via `classifyShopItemState` | Req 8.2 | PASS — Property 16 (`tests/shop-state.spec.ts`) | `screenshots/rewards-shop/rewards-shop-default-mobile.png` (PENDING) |
| RS3 | `affordable` → "Đổi" enabled; Bright Sky blue Primary_CTA | Req 8.3 | PASS — Property 16 + `shop-backbone-client.tsx` | `screenshots/rewards-shop/rewards-shop-default-mobile.png` (PENDING) |
| RS4 | `unaffordable` → "Đổi" disabled, hint "còn thiếu N coin" with N = price − balance | Req 8.4 | PASS — Property 16 | `screenshots/rewards-shop/rewards-shop-default-mobile.png` (PENDING) |
| RS5 | `owned` → "Đã sở hữu" badge + "Trang bị" CTA; "Trang bị" not Primary blue unless equipped | Req 8.5 | PASS — Property 16 | `screenshots/rewards-shop/rewards-shop-default-mobile.png` (PENDING) |
| RS6 | `pending` → spinner overlay + disabled CTA; auto-revert after 10s with non-blocking toast | Req 8.6, Req 8.7 | PASS — jsdom timer test in `shop-backbone-client.tsx` | n/a |
| RS7 | `locked` → greyscale + lock icon + unlock-condition copy, no purchase CTA | Req 8.2 | PASS — Property 16 | `screenshots/rewards-shop/rewards-shop-default-mobile.png` (PENDING) |
| RS8 | Inventory tab shows last 200 owned items (vertical scroll); each item asset via `getShopItemAssetSrc` | Req 8.8 | PASS — `apps/web/src/components/gamification/shop-backbone-client.tsx` inventory section | `screenshots/rewards-shop/rewards-shop-default-mobile.png` (PENDING) |
| RS9 | Equipping an item updates mascot within 1s | Req 8.9 | PASS — equip handler dispatch + render | n/a (unit test) |
| RS10 | Reward amber confined to reward subtrees + streak chip | Req 16.1, Req 19.4 | PASS — Property 9 | `screenshots/rewards-shop/rewards-shop-default-mobile.png` (PENDING) |

## Empty state checklist (zero items in catalog)

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| RS-E1 | Mascot `guard`; wallet still visible | Req 11.3, Req 12.6 | PASS — `<StateShell state="empty">` after wallet pill | `screenshots/rewards-shop/rewards-shop-empty-mobile.png` (PENDING) |
| RS-E2 | Single Primary_CTA back to `/course`; copy ≤ 140 chars vi/de | Req 11.3 | PASS — Property 8 | `screenshots/rewards-shop/rewards-shop-empty-mobile.png` (PENDING) |

## Error state checklist

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| RS-Er1 | Wallet shown at most-recent cached value with `stale` attribute | Req 8.10 | PASS — `<ShopWalletPill stale>` | `screenshots/rewards-shop/rewards-shop-error-mobile.png` (PENDING) |
| RS-Er2 | Mascot `guard`, single Primary_CTA "Thử lại"; secondary "Về Dashboard" | Req 8.10, Req 11.5 | PASS — `<StateShell state="error">` | `screenshots/rewards-shop/rewards-shop-error-mobile.png` (PENDING) |
| RS-Er3 | NO reward amber animation | Req 8.10, Req 11.7 | PASS — Property 9 | `screenshots/rewards-shop/rewards-shop-error-mobile.png` (PENDING) |

## Success state checklist (post-redeem celebration)

| # | Item | Spec ref | Status | Evidence |
| --- | --- | --- | --- | --- |
| RS-S1 | After successful redeem, `<ResultRewardLoop>` overlay enters earned phase (1.2–2.0s, mascot `cheer`) then receipt | Req 7.1–7.4 | PASS — Property 15 | `screenshots/rewards-shop/rewards-shop-success-mobile.png` (PENDING) |

## Cross-cutting

| Item | Spec ref | Status |
| --- | --- | --- |
| Single Primary_CTA per non-default state | Req 19.8–19.10 | PASS — Property 8 |
| Wallet inside first viewport | Req 8.1 | PASS — manual viewport check |
| Reward amber containment | Req 19.4 | PASS — Property 9 |
| Reduced-motion discipline | Req 19.5 | PASS — Property 10 |
| Bright Sky CTA palette | Req 16.4 | PASS — Property 22 |

## Result

- **Failing items**: 0
- **Pending items**: screenshot capture (default catalog, empty catalog, error, post-redeem success).
