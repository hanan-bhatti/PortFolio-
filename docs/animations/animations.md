# Portfolio Animations Reference

This document outlines the animation logic from the reference portfolio. We will use this logic to implement our own complex animations using GSAP, Lenis, and Anime.js.

## 1. Hero Text Shrink (GSAP FLIP-style)

**Goal:** Large hero text shrinks and translates smoothly into the top navbar when the user scrolls down.

**Logic Breakdown:**
1. **DOM Structure:**
   - The large hero text is split into "target letters" (e.g., the first letter of each name) and "expansion letters" (the rest of the name).
   - A hidden, fixed `spacer` div is used to create a scrollable area without pushing content down.
   - Invisible "flying" clones of the target letters are pre-rendered in the DOM.

2. **ScrollTrigger Setup:**
   - A `ScrollTrigger` is attached to the `spacer` div with `scrub: true`. 
   - Instead of pinning the hero, the hero remains `position: fixed` while the rest of the document scrolls over it.

3. **Animation Timeline (The Flight):**
   - **Phase 1 (Visibility Swap):** As scrolling begins, the static target letters fade out, and the flying clones fade in.
   - **Phase 2 (Pop):** A quick scale pop (e.g., 1.05) creates a burst effect on the flying letters.
   - **Phase 3 (Expansion Fade):** The expansion letters fade away.
   - **Phase 4 (Translate & Scale):** Using `getBoundingClientRect()`, we calculate the exact `x` and `y` coordinates of the tiny letters in the actual Navbar. We also calculate the `scale` ratio (e.g., `navbarFontSize / heroFontSize`). The flying clones are translated and scaled down to match the navbar. *Performance Note: Animating CSS `scale` instead of `fontSize` prevents expensive layout reflows (jank) during scrubbing.*
   - **Phase 5 (Docking):** A cross-dissolve happens when the flying clones reach the top left: the flying clones fade out, and the actual Navbar letters fade in.

4. **Resizing & Reflows:**
   - The timeline uses functional getters for `x`, `y`, and `scale`. 
   - `ScrollTrigger.create({ invalidateOnRefresh: true })` is used to recalculate positions whenever the window is resized.

---

## 2. GitHub Heatmap Snake Animation

**Goal:** A continuous snake roams an SVG GitHub contribution grid, "eating" lit cells (turning them off) in an organic, greedy path.

**Logic Breakdown:**
1. **Grid Setup:**
   - The GitHub contributions are rendered as an SVG grid of `<rect>` elements.
   - Lit cells (contributions > 0) are stored in an array of targets.

2. **The Snake Structure:**
   - The snake is a `<g>` (group) containing multiple `<rect>` elements (1 head + e.g., 7 tail segments).
   - Each segment has a different opacity, with the head being fully opaque and the tail fading out.

3. **Pathfinding (Greedy Nearest-Neighbor):**
   - The script picks a random lit cell to start.
   - It iterates through the remaining lit cells and finds the closest one (using Manhattan distance).
   - It builds an orthogonal "staircase" path (alternating between horizontal and vertical moves) to reach the next target.
   - This continues until all lit cells are part of the `route` array.

4. **Continuous Animation:**
   - A GSAP timeline animates a `proxy` object's `p` (parameter) property from `0` to `route.length - 1` linearly.
   - An `onUpdate` hook fires every frame. It samples the `route` array using `Math.floor(p)` and interpolates between the current and next point to calculate the exact `x` and `y` for the snake head.
   - Body segments trail the head using a fixed time lag (e.g., `p - k * SEG_GAP`), giving the snake fluid, curved movement around corners.

5. **The Bite Effect:**
   - As `Math.floor(p)` updates, the script checks if the current cell is a target.
   - If it is, the script applies an "eating" CSS class to the cell (a hard accent flash), then uses a delayed call to drain the cell back to the empty state color.

6. **Performance & Looping:**
   - The animation only runs when the section is visible in the viewport, using `ScrollTrigger`'s `onToggle` hook to pause/resume.
   - Once the snake eats all cells, it slithers off the grid, waits for a short delay (`CYCLE_PAUSE`), resets the grid to its initial lit state, recalculates a brand new random route, and restarts the loop.
