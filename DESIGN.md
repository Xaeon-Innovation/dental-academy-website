# Design DNA: Mobadra - Medical Marketing & Acquisition

## 1. Overview & Creative North Star: "The Clinical Curator"

This design system is a departure from the sterile, rigid grids of traditional medical marketing. Our Creative North Star is **"The Clinical Curator"**—a vision that blends the precision of high-science with the bespoke elegance of a luxury editorial magazine. 

We move beyond the "template" look by embracing **Cinematic Whitespace** and **Intentional Asymmetry**. In this system, information is not just displayed; it is staged. By utilizing high-contrast typography scales and overlapping translucent layers, we create an environment that feels authoritative yet deeply empathetic. The goal is to evoke the feeling of a high-end gallery where the patient's journey is the primary exhibit.

---

## 2. Global Tokens

*   **Color Mode**: Dark
*   **Color Variant**: Fidelity
*   **Custom Theme Color**: `#E9D7B1` (Warm Gold)
*   **Spacing Scale Token**: `3` (Base structural multiplier)
*   **Roundness Token**: `ROUND_FOUR` (Corresponds to `sm` or `0.125rem` sharp primitives)

---

## 3. Typography: The Editorial Voice

We utilize a high-contrast pairing to balance scientific rigor with human warmth.

*   **Headline / Display Font**: Noto Serif
    *   *Usage*: Used for `display` and `headline` levels. Conveys heritage, trust, and the "Editorial" authority.
    *   *Styling*: Slightly tighter letter spacing (-2%) in large formats.
    *   **Display-LG**: `3.5rem` - For evocative hero statements.
    *   **Headline-MD**: `1.75rem` - For section introductions that require immediate authority.
*   **Body / Label / Title Font**: Inter (or Satoshi)
    *   *Usage*: Used for `title`, `body`, and `label` levels. Clinical, clean, and highly legible.
    *   **Body-LG**: `1rem` - For patient-centric narratives, with a generous line-height (`1.6`) for empathy and readability.

---

## 4. Color Palette: Tonal Depth

The palette is anchored in deep, midnight greens and warm, medicinal golds.

### Core Brand Colors
*   **Primary (Gold Accent)**: `#fff4e1` (Container: `#e9d7b1`, On-Primary: `#3a2f15`)
*   **Secondary (Soft Sage)**: `#a7cfc2` (Container: `#2b5046`, On-Secondary: `#10362e`)
*   **Tertiary (Warm Sand)**: `#fff4e7` (Container: `#f2d5a7`, On-Tertiary: `#3f2d0d`)

### Surface & Background Stack
We treat the UI as a physical stack of premium materials.
1.  **Base (Background/Surface)**: `#0a1514` (The deep, infinite canvas)
2.  **Middle (Surface Container)**: `#172220` (For grouping related content blocks - transitions from `#131e1c` to `#212c2b` and `#2c3735`)
3.  **Top (Surface Bright)**: `#303b3a` (For high-contrast focal points atop dark layers)

### The "No-Line" Rule
*   **Explicit Instruction**: Do not use 1px solid borders to define sections. Traditional dividers are prohibited. 
*   **Boundaries**: Must be established through background shifts (e.g., from `surface` to `surface_container_low` `#131e1c`) or luminance steps.

---

## 5. Elevation & Depth: Tonal Layering

We reject the standard drop-shadow. Depth in this system is a result of light physics and material stacking.

*   **The Layering Principle**: Achieve a "soft lift" by placing a `surface_container_lowest` (`#06100f`) element inside a `surface_container_low` (`#131e1c`) section. This recessed look implies depth without adding visual noise.
*   **Ambient Shadows**: When an element must float (modals, FABs), use an ambient glow rather than a harsh silhouette:
    *   *Color*: `on_secondary` (`#10362e`) at 6% opacity.
    *   *Blur*: `40px` to `60px`.
    *   *Offset Y*: `20px`.
*   **"Ghost Border" Fallback**: If an element lacks sufficient contrast against a background, apply a Ghost Border: `1px solid outline_variant` (`#4b463c`) at 15% opacity.

---

## 6. Components: Luxury Primitives

*   **Glassmorphism Signature**: All floating UI elements should use a glass effect.
    *   *Background*: `rgba(255, 255, 255, 0.04)`
    *   *Backdrop-blur*: `20px`
*   **Buttons: "Soft-Touch" Interaction**
    *   *Primary*: Background `#f3e1ba`, Text `#231a04`, Radius `sm` (0.125rem). On hover, subtly expand letter-spacing (do not change color drastically).
    *   *Secondary (Glass)*: Background `rgba(255,255,255,0.04)`, Border uses Ghost Border with deep gold `primary_container`.
*   **Cards: The Frosted Portfolio**
    *   *Structure*: Use `surface_container_high` (`#212c2b`) with a `backdrop-blur` of `12px`.
    *   *Padding*: Always use `spacing-8` (`2.75rem`) for internal card padding to maintain the "Cinematic" feel.
    *   *Forbid*: Divider lines and 100% opaque borders.
*   **Input Fields: Minimalist Science**
    *   *State*: Underline-only or subtle background shift.
    *   *Active*: Label transitions to primary gold.
    *   *Error*: Use `error` color (`#ffb4ab`) minimally as a thin 1px line at the base (never a thick box).
*   **The "Medical Insight" Chip (Signature Component)**
    *   Pill-shaped indicator using `secondary_container` (`#2b5046`) with `on_secondary_container` (`#99c1b5`) text.

---

## 7. Do's and Don'ts

### Do
- **Embrace asymmetry**. Offset your headlines to create a dynamic flow rather than center-aligning everything like a template.
- **Use expansive spacing**. Use `20` (7rem) and `24` (8.5rem) spacing scales to separate major sections. Let the design breathe.
- **Use Gold sparingly**. `primary` should be an accent to lead the eye toward high-value conversions.

### Don't
- **Don't use standard borders**. 0.5px or 1px grey borders cheapen the editorial look.
- **Don't use pure black (`#000000`)**. Always use the `surface` token (`#0a1514`) to maintain the deep, medicinal green undertone.
- **Don't crowd**. If a section feels busy, increase the vertical white space using the `16` (5.5rem) token.
- **Don't use heavy roundness**. This system is authoritative; stick to `sm` (0.125rem) or `none` (0px) for a sharp edge, avoiding `xl` smooth curves.
