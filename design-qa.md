# Design QA — Voir la Lune

## Evidence

- Source visual truth: `/Users/fabricecoroller/.codex/generated_images/01a0153d-c7db-7c71-9553-55605e277037/exec-ac0c8652-d496-4e12-841b-3c61b0fdaa49.png`
- Normalized source copy: `public/assets/qa/reference-option-3.png`
- Browser-rendered desktop implementation: `public/assets/qa/implementation-desktop.png`
- Combined source/implementation comparison: `public/assets/qa/comparison-desktop.png`
- Responsive evidence: `public/assets/qa/implementation-tablet-1024x768.png` and `public/assets/qa/implementation-mobile-390x844.png`
- Desktop viewport/state: 1487 × 1058 CSS px, Paris, 18 August 2026 at 21:00 Europe/Paris, lesson step 3.
- Pixel normalization: source 1487 × 1058 px; implementation 1487 × 1058 px. The in-app browser capture is normalized to CSS-pixel dimensions, so no density resampling was required.
- Responsive viewports: 1024 × 768 CSS px and 390 × 844 CSS px.

## Findings

No actionable P0, P1, or P2 findings remain.

- Fonts and typography: Manrope Variable reproduces the light geometric display treatment; Inter Variable handles interface copy. Weight, scale, line height, and acid-green emphasis preserve the source hierarchy without broken wrapping.
- Spacing and layout rhythm: desktop retains the left three-step rail, central orbital scene, right lunar dial, and bottom month timeline. Tablet and mobile evidence confirms that persistent controls are not clipped or overlapping.
- Colors and tokens: the navy-black field, lunar white, warm sunlight, muted annotation lines, and `#ddff6b` active state map closely to the mockup.
- Image quality and asset fidelity: Earth and Moon use NASA raster textures; the star field and solar photosphere are dedicated generated raster assets. Phosphor supplies all UI icons. No visible target imagery is replaced by inline SVG, CSS illustration, emoji, or placeholders.
- Copy and content: the source title/subtitle and lesson labels are retained. The illustrative `22 %` was intentionally replaced by Astronomy Engine’s calculated `37 %` for the fixed QA instant.
- States and accessibility: semantic DOM controls, visible keyboard focus, labelled dialogs/inputs, an `aria-live` textual canvas equivalent, reduced-motion handling, and touch-friendly mobile transport controls are present.

Residual P3: the real-time solar corona is more restrained than the strongly photographic mockup corona, and the functional timeline uses nine evenly spaced astronomical checkpoints rather than the mockup’s denser illustrative set. Both preserve the intended hierarchy and improve runtime clarity.

## Focused comparison evidence

The equal-size source and implementation were inspected at full resolution in addition to the combined comparison. The lunar dial, observer/date row, stepper typography, transport controls, and phase thumbnails remain readable at 1:1; no separate crop was needed. Responsive captures specifically validate the control row and lower timeline panel, the two regions that were not defined by the desktop-only source.

## Comparison history

1. P1 — The first browser capture was overexposed white because the post-processing composer cleared the transparent WebGL scene incorrectly. Fix: removed the bloom composer and retained emissive/basic materials. Post-fix evidence: `implementation-desktop.png` shows the restored star field and all 3D bodies.
2. P2 — The initial desktop pass placed the Sun over the phase dial and kept the Moon too high. Fix: separated the pedagogical orbit ellipse from the Moon’s display position, moved the Sun toward the top-right crop, and matched the Earth–Moon composition more closely.
3. P2 — The first 390 × 844 pass let the location/date row collide with the scene hint. Fix: compressed mobile icon/text widths, removed the redundant mobile hint, and kept the scale disclosure on its own line. Post-fix evidence: `implementation-mobile-390x844.png`.
4. P2 — The first 1024 × 768 pass clipped the observation controls below the scene. Fix: raised the tablet phase panel, kept controls on one compact row, relocated the scale disclosure, and removed the third tablet hint. Post-fix evidence: `implementation-tablet-1024x768.png`.
5. P1 — A later user-side WebGL reset could expose an opaque white canvas over the CSS star field. Root cause: development `StrictMode` initialized and disposed the texture-heavy Three renderer twice, while the second lunar WebGL surface compounded context pressure. Fix: keep one WebGL canvas, render the lunar dial from the existing raster phase assets, use 2K Earth textures, render the star field inside the scene, and retain the navy DOM fallback. A fresh 1487 × 1058 session now keeps its context throughout phase changes and interaction.
6. P1 — In phase 1, `CameraRig` continued lerping toward its preset on every frame, so a manual orbit appeared to spring back. Fix: the preset transition now ends once centered and is cancelled immediately by `OrbitControls.onStart`. Browser verification dragged the globe to a new viewpoint, waited through damping, and confirmed that the new viewpoint remained stable.
7. P1 — The Earth rotation was previously artistic/static, which could place the selected observer on the sunlit hemisphere at an evening observation time. Fix: derive the subsolar latitude/longitude from Astronomy Engine and orient the Earth toward the pedagogical Sun direction; the observer marker now reports day, twilight, or night. At Paris on 18 August 2026, 21:00 local is correctly shown as twilight (Sun altitude −0.1°); at 22:00 it changes to night and the Moon visibility copy reports the Moon below the horizon when applicable.
8. P1 — The displayed Moon used a taller ellipse than the visible orbit line, so its center could sit below the path. Fix: both now share `ORBIT_RADIUS_X` and `ORBIT_VISUAL_RADIUS_Y`; the browser capture confirms the Moon center sits on the line.
9. P1 — The shared orbit ellipse was vertically smaller than the Earth model, so its top and bottom arcs crossed the globe. Fix: increase the vertical radius to 3.65 (above the 2.75 Earth radius) while keeping the Moon on the same path; the browser capture now shows a clear gap around the Earth.
10. P2 — The solar treatment was flatter than the reference mockup. Fix: add a soft billboarded radial glow, tune the warm corona layers, add a restrained lunar and terrestrial rim light, and replace dotted rays with occluded warm beams plus a brighter central ray. The 1487 × 1058 browser capture keeps the scene readable with no console errors.

## Browser and interaction verification

- Lesson steps 2 and 3 changed correctly; the active step exposed `aria-current="step"`.
- Phase 1 manual orbit remained at the user-selected viewpoint after the damping interval; no preset snap-back occurred.
- The selected observer follows the calculated day/night boundary: Paris is marked `crépuscule` at 21:00 local and `nuit` at 22:00 local in the browser fixture.
- Play/pause changed state and advanced the observation instant.
- Manual coordinates changed the observer to Sydney-area coordinates, reverse-geocoded the label, and updated the astronomical result.
- Date/time dialog opened and accepted `22:15` in the local-time input.
- Desktop, tablet, and mobile browser logs contained zero errors. Only non-blocking Three.js dependency deprecation warnings were observed.
- Production build, TypeScript check, 18 unit/component tests, and Sites packaging tests passed.

## Implementation checklist

- [x] Source and implementation compared in one combined visual.
- [x] Fonts, spacing, colors, imagery, icons, and copy reviewed.
- [x] Desktop, tablet, and mobile rendered in the in-app browser.
- [x] Core educational interactions verified.
- [x] P0–P2 visual findings fixed and recaptured.

final result: passed
