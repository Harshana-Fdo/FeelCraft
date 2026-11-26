# Template schema

The database migration seeds the five original letter templates with editable version 1 documents. The bundled starter collection carries the same document format for browser-local mode.

| Field | Meaning |
| --- | --- |
| schemaVersion | Integer 1 |
| canvas | Width and height plus an editable color or raster-image background |
| elements | Array ordered back to front. Layers have independent IDs, positions, dimensions, rotation, opacity, visibility, and locking |
| text layer | Plain text, font family, font size, alignment, and fill. Sinhala typography uses Noto Sans Sinhala |
| shape layer | Editable rectangle, ellipse, heart or star |
| decoration layer | Bundled illustration key, such as flower or butterfly |
| image layer | Compressed PNG, JPEG or WebP data URL from the photo picker |
| animation | Optional layer fade or rise with duration and delay |
| experience | Opening and background effect presets. Music is reserved |

Uploaded images are decoded and re-encoded in the browser. The API checks raster types and signatures, geometry, presets, and size. Each document can contain up to 80 layers. Draft API requests are limited to 4 MiB. Text is rendered as text. Decorative assets resolve through a fixed map.

The editor copies a template document into an independent draft. Editing a draft never changes the catalog record.
