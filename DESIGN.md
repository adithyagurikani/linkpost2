# Design System: Premium Greyscale (Minimal Stark Dark/Light)

## Core Palette
The palette consists entirely of stark, rich greys, pure black, and bright white to create a clean, editorial, high-fashion tech aesthetic.

| Token | Dark Mode | Light Mode | Hex Value (Dark) | Hex Value (Light) |
|---|---|---|---|---|
| Background | Neutral Darkest | Neutral Lightest | `#09090b` | `#f4f4f5` |
| Surface | Deep Zinc | Pure White | `#18181b` | `#ffffff` |
| Primary / Action | Pure White | Pure Black | `#ffffff` | `#000000` |
| Secondary | Medium Zinc | Soft Grey | `#27272a` | `#e4e4e7` |
| Text / Foreground | High Contrast White | High Contrast Black | `#fafafa` | `#09090b` |
| Muted Text | Medium Grey | Slate Grey | `#a1a1aa` | `#71717a` |
| Border | Fine Border Grey | Soft Border Grey | `#27272a` | `#d4d4d8` |

## Typography
- **Headings**: `Inter`, sans-serif (bold, tracking-tight, uppercase where appropriate for headers)
- **Body / Interface**: `Inter`, sans-serif (medium, tracking-normal)
- **Mono / Metrics**: `JetBrains Mono` or system mono font for logs, schedules, and metrics.

## Shapes and Elevation
- **Border Radius**:
  - Small elements (buttons, inputs): `8px`
  - Medium elements (cards, modals): `12px`
  - Large containers: `16px`
- **Focus Ring**: `2px solid #ffffff` in Dark Mode, `2px solid #000000` in Light Mode.
- **Shadows**:
  - Dark Mode: Subtle inner borders, zero blur shadows.
  - Light Mode: Crisp, thin grey borders with soft, non-colored drop shadows.

## Transitions
- Smooth easing for all interactive states (`all 200ms cubic-bezier(0.4, 0, 0.2, 1)`).
- Hover scales of `0.98` for active clicks and `1.02` for interactive hover elevations.
