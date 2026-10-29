# The Pond design system

## Overview

The Pond is a reading room for people following Identity MD and its AI contributor ecosystem. It pairs a quiet, dark forest-green feed with lime accents and an AI-equipped Pepe: a robotic arm, chip, laptop, and companion drone. The desktop composition has a navigation rail, the working feed, and a supporting community rail. On mobile the feed takes priority.

The implemented source is React + TypeScript in `src/App.tsx` and `src/components/TweetCard.tsx`; all styling and tokens live in `src/styles.css`. The site has one dark appearance. It is an independent community project, not an official X client or a live ranking service.

## Colors

`src/styles.css:9` defines a green primitive ramp and semantic aliases. Components should consume the semantic names.

| Semantic token | Value | Use |
| --- | --- | --- |
| `--color-page` | `#09140e` | Canvas, select background |
| `--color-surface` | `#0d1b13` | Tweet cards, search, dialogs |
| `--color-surface-raised` | `#112218` | Community note, toast |
| `--color-hover` | `#193323` | Active navigation, selected filters, secondary buttons |
| `--color-border` | `#233b2c` | Structural separators and field/card borders |
| `--color-text` | `#edf3e9` | Body text, headings, authors |
| `--color-secondary` | `#c1cfc3` | Supporting copy, outbound actions |
| `--color-muted` | `#8ea696` | Metadata, summaries, secondary icons |
| `--color-accent` / `--color-focus` | `#c5f579` | Primary action, selected state, focus, headline signature |
| `--color-accent-hover` | `#d4ffa0` | Primary button hover |
| `--color-on-accent` | `#09140e` | Text on the primary action |

The intro's local `#0b1912` background blends with the illustration. Component-specific border colors are `#3b5b3c` for selected filters, `#57714e` for filter hover, and `#486345` for notices. Secondary-button hover is `#24452e`. The small decorative circuit drawing has its own olive ink; it carries no status or data.

Measured in rendered Chromium: body/page **16.63:1**, muted/card **6.80:1**, muted/raised surface **6.36:1**, primary-button text/fill **14.95:1**. Focus on the page/card/selected surface measures **14.95 / 14.12 / 10.86:1**. These are the measured solid pairs, not a claim about every pixel of the artwork. Details and coverage limits are in `artifacts/validation.md`.

## Typography

The locally bundled `public/fonts/dm-sans-latin.woff2` is the DM Sans Latin variable weight face, supporting weights 100–1000. The interface uses only **400, 500, and 600**. Fallbacks are `system-ui`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, and `sans-serif`. The font was confirmed loaded during browser validation. Its SIL license is alongside it.

| Token | Default size | Role |
| --- | --- | --- |
| `--text-xs` | 12px / .75rem | Metadata, compact filters, dates |
| `--text-sm` | 14px / .875rem | Summaries, ordinary controls, navigation |
| `--text-base` | 16px / 1rem | Tweet excerpts; mobile search input to avoid input zoom |
| `--text-lg` | 20px / 1.25rem | Section/empty headings, mobile wordmark |
| `--text-xl` | 24px / 1.5rem | Wordmark, rail headline, mobile page heading |
| `--text-display` | 36px / 2.25rem | Desktop page heading |

Body line height is 1.5; excerpts and summaries use 1.6. Headline line height is 1.12, or 1.14 on mobile. Headline tracking is −.04em on desktop and −.03em on mobile. Other section headings use −.02em or normal tracking; metadata is untracked and sentence case. Headings balance; descriptions use pretty wrapping. Tweet prose has a 68ch maximum measure and wraps long words. Counts use tabular numerals. Critical author names and tweet text are not ellipsized.

The share image contains rasterized display lettering. It does not add a runtime font or interface type size.

## Layout

The main grid and header are capped at **1440px**, centered. Desktop outer padding is **40px**, with **32px** gaps; at 1440px and above the grid has 206px navigation / flexible feed / 286px community columns, separated by 36px. The navigation is sticky with a 32px top inset, not fixed over the feed.

Spacing follows a mostly 4px rhythm: 8–12px within controls, 14–16px between feed elements, 20px desktop card padding, 24–32px between groups. `--space-1` through `--space-10` record 4, 8, 12, 16, 20, 24, 32, and 40px reference steps; current component rules mostly use explicit pixel values. Reuse the existing gaps before introducing another spacing step.

| Breakpoint | Implemented behavior |
| --- | --- |
| At least 90rem (1440px) | 206px / flexible / 286px grid, 36px gaps |
| At most 78rem (1248px) | 28px outer padding, 178px / flexible / 250px columns, 24px gaps; compact heading; hide view count |
| At most 66rem (1056px) | Hide community rail; 178px navigation plus flexible feed in a 1000px maximum grid |
| At most 47rem (752px) | One column capped at 660px; hide sidebar; inline navigation; 64px header; 20px outer margins; compact 192px minimum intro; 16px tweet padding |
| At most 23rem (368px) | 16px outer margins and 14px card padding; compact ordering controls; filter chips wrap |

The date field uses rem widths so its selected label grows with text enlargement. Search flexes into remaining space. Cards use `min-width: 0`; names and long copy wrap. Replies and view counts are hidden on mobile to preserve room for the original tweet action; likes and reposts remain visible. All metrics remain present in the committed data.

Reflow was checked from 320 to 1920px, including the breakpoints. At 390×844 the heading, Explore tweets, search, first tweet, and its Read tweet action fit in the first screen. Screenshots are in `artifacts/screenshots/`. Native device and native browser zoom testing were not performed.

## Elevation & Depth

The interface uses flat tonal separation and one-pixel structural borders. It has no box shadows, no gradient text, and no nested card surfaces. Avatars have a 1px `#ffffff1a` outline. The hero artwork is a locally bundled WebP.

Native dialogs use the browser top layer and a translucent `#030b07cc` backdrop with 5px blur. A notice sits above content at z-index 20; the keyboard skip link uses z-index 100. Neither is present over the initial reading surface. Notices stay until dismissed or replaced.

## Shapes

`--radius-control` is 8px, `--radius-card` 14px, and `--radius-panel` 16px. Filters use a local 7px radius. Avatars and the empty-state icon use circles. The hero illustration has a 15px trailing radius to sit inside the panel's 1px border. Avoid clipping text to preserve those shapes.

## Components

| Pattern / source | Usage and states |
| --- | --- |
| `FrogMark`, `NavLinks` — `src/App.tsx:18` | Shared brand asset and desktop/mobile navigation. Native hash links select feed or saved view; active state has color plus shape/underline and `aria-current`. Saved count is derived from stored IDs. |
| Intro — `src/App.tsx:136` | Short title, plain product description, one filled lime action, Pepe artwork. Explore tweets scrolls to the feed and focuses search. Saved view changes title and explains storage location. |
| Feed toolbar — `src/App.tsx:145` | Top/Latest native buttons plus an accessible native ordering select. Order alternatives are likes, date, reposts, and views. All reflect the current state. |
| Search/date/topic filters — `src/App.tsx:154` | Explicitly labelled search and date inputs; topic buttons expose `aria-pressed`. Search, topic, date and saved membership intersect. `/` focuses search outside inputs/dialogs; Escape clears the query. Result count is a polite status. |
| `TweetCard` — `src/components/TweetCard.tsx:20` | Takes `tweet`, `saved`, `copied`, `onSave`, and `onCopy`. Real author/date, short quote, muted editorial summary, topic, read-only engagement data, save toggle, copy action, original permalink. Native anchors retain new-tab and modifier-key behavior. |
| `Avatar` — `src/components/TweetCard.tsx:13` | Local author avatar, normal/small sizes. Decorative beside an author name; fallback initial if the image fails. |
| Empty state — `src/App.tsx:161` | Empty saved view explains bookmarks and links to feed. Empty search names the query and offers Clear filters; empty topic/date combination also offers reset. |
| Notices — `src/App.tsx:176` | Stable polite live region with a visible dismissible message. Save/copy results say what happened. Blocked storage explicitly says the save is for this visit. |
| About/copy dialogs — `src/App.tsx:179` | Native modal dialogs with names, close buttons, Escape, native modal background inertness and focus return. About describes selection/ranking/sources/storage. Clipboard failure opens a selectable original URL and an original-tweet link. |
| Community rail — `src/App.tsx:168` | Snapshot-derived topic counts, three creators selected by total recorded likes, and real profile/project links. Secondary content disappears before it crowds the feed. |

Every control has a visible focus rule: 2px lime outline with 4px offset. Forced colors uses `Highlight`. Hover is enabled only for hover-capable pointers. Transitions name their properties and run for 150ms with `cubic-bezier(.2, 0, 0, 1)`, only when reduced motion is not requested. Press feedback uses `.96` scale. No autoplay, endless animation, loading skeleton, wallet flow, or theme switch exists.

## Do's and Don'ts

- Start from `.page-grid`, the semantic color/type/radius tokens, and the existing field and card patterns.
- Keep one filled primary action in a view. Use neutral secondary actions and underlined active navigation for the rest.
- Keep the original tweet URL, attribution, captured date, and distinction between excerpt and editorial summary. Count likes within the supplied snapshot; never describe these numbers as live.
- Keep native links, selects, buttons and dialogs. Add explicit labels and state; preserve focus and motion settings.
- Keep the product usable before the hero or supporting content gets more space. Test 320 and 390px after changes.
- To add another view, reuse `NavLinks` and a hash location, place the working controls above its results in the existing `main`, and use `TweetCard` or the existing empty-state pattern. Verify it under a static subpath and update this document from the final source.

Design review followed the supplied Better Interface six-domain workflow (Jakub Krehel, MIT, pinned commit `267330e1adfc66a718fb65fa6918c1f06d0a689e`). Documentation method was adapted from Paul Bakaus's Impeccable (Apache-2.0, pinned commit `9d715cc4f5564a990ca8345abfdd5df6dc9b41c8`). Full supplied license notices are retained in `artifacts/licenses/design-guidance.txt`.
