# Weekend PNG Export

Export the currently selected weekend (including days and activities) as a PNG from the Weekend Planner page.

How to use:

- Open Weekend Planner and select a weekend.
- Click the "Export PNG" button in the weekend header.
- A file named like `<title>.png` will be downloaded.

Notes:

- Uses `html-to-image` to capture a hidden, export-friendly component (`ExportWeekendCard`).
- Renders at 2x pixel ratio for sharper output.
- Colors respect the current theme (light/dark).
