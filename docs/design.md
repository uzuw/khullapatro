# Khulla Patro design

Implemented locally: three navigable pages with a shared restrained masthead and original art. Calendar remains the primary view.

The palette uses cloud/paper backgrounds, readable charcoal, muted calendar crimson, lavender for rashifal and brass/slate for gold/silver. Manrope is used for navigation and numbers; Noto Sans Devanagari for Nepali dates, events and full readings. Both are self-hosted by next/font.

Desktop calendar uses a broad seven-column grid beside a selected-date panel. Cells show BS/AD dates, tithi, two event previews and a remaining count; selecting reveals every event and qualifier. Mobile keeps seven columns with event counts and moves full details below. Month/year controls and Today stay visible. Current-day highlighting is derived from current Nepal AD date rather than a saved source Today flag.

Rashifal balances a twelve-sign chooser with a full reading. Mobile stacks them and uses four sign columns. Gold/silver balances two quote cards with a wider historical chart, observed-period statistics and an accessible table. SVG charts use actual dates and show gaps; controls update metal and period together.

Actual Obsidian UI button and Radix tabs components are adapted under MIT, with source/license in THIRD_PARTY_NOTICES.md. Original SVG artwork uses a 4×4 Bayer matrix to dither mountain/sun, moon/stars and bullion scenes. It is deterministic, decorative, local and rendered through next/image.

Framer Motion adds short page/sign fades and a moving navigation marker. System reduced-motion preferences disable translation/layout motion and CSS animation. Visible focus, named controls, full event/reading text and the market table support keyboard/screen-reader access.

All pages identify sources and content dates. Missing content is unavailable or visibly dated saved data; placeholder prices/readings are never inserted. No news, weather, forex, advertising, market predictions or unrelated dashboard tiles are included.

Desktop/mobile visual checks and any material limits are recorded in [verification.md](verification.md).
