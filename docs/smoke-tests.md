# Smoke Tests

Run these after any deploy that touches settings, orders, Storyous, Wolt, or delivery logic.

## Public site
- Homepage loads.
- Logo loads.
- Hero image loads.
- Product images render.
- Cart can be opened.

## Admin
- `/admin` loads.
- `OrderList` renders.
- Order selection works.
- Status transitions still work.
- Bottom action bar is visible and usable.

## Settings
- `/admin/settings` loads.
- Storyous settings render.
- Storyous preview loads.
- Delivery fee tiers render.
- Any selected tenant mapping data loads.

## Storyous
- Manual sync can be triggered.
- Auto sync still runs when the order enters the expected state.
- Preview matches the backend output shape.

## Wolt
- Wolt create flow works for an in-zone delivery.
- Wolt cancel flow works for an existing delivery.
- Out-of-zone handling still blocks or warns correctly.

## Delivery
- A near address resolves to a valid fee tier.
- A boundary address still resolves as expected.
- A missing coordinate fallback still behaves consistently.
