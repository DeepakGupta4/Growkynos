# Service artwork — drop files here

Each service world can be backed by a piece of artwork that becomes its
environment (parallaxed, tinted to the world's accent, masked at the edges).

**This is optional.** Any world whose file is missing renders exactly as it
does today — no broken image, no gap, no layout shift. Adding the file is the
entire integration step; no code changes.

## Filenames

| File (extension-less)     | World                    |
| ------------------------- | ------------------------ |
| `app-development`         | 01 App Development       |
| `web-development`         | 02 Web Development       |
| `shopify-development`     | 03 Shopify Development   |
| `wordpress-development`   | 04 WordPress Development |
| `photo-editing`           | 07 Photo Editing         |
| `video-editing`           | 08 Video Editing         |
| `banner-poster-design`    | 06 UI/UX + 09 Banner/Poster |
| `more-services`           | 05 SaaS + 10 AI          |

## Extensions

Any of `.avif`, `.webp`, `.png`, `.jpg`, `.jpeg`. The backdrop probes them in
that order and uses the first that decodes, so you do not need to convert
anything — the order simply prefers the smaller formats when both exist.

Example: `app-development.png` and `app-development.webp` can both sit here;
the `.webp` wins.

## Video (optional)

Alongside the image, an `.mp4` of the same name plays as the backdrop while the
world is on screen, cross-fading up from the still:

```
app-development.mp4
```

Video is muted, looped, `playsInline`, `preload="none"`, and is paused whenever
the section leaves the viewport. It is skipped entirely on low-tier devices and
under `prefers-reduced-motion`.

## Composition guidance

The artwork is used with `object-fit: cover` and is scaled ~6% past the frame
for parallax headroom, then edge-masked. Keep the important part of the
composition near the centre — the outer ~10% will be cropped or faded.

It sits *behind* the interactive showcase (the phone, the browser, the
timeline), darkened to ~62% and tinted to the world accent, so it should read
as environment rather than compete with the foreground.

Mapping lives in `src/data/services.js` → `SERVICE_MEDIA`.
