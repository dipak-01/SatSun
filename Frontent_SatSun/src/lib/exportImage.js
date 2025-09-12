// Lightweight wrapper around html-to-image to export a DOM node to PNG
// Handles scaling for crisp output and safe filename defaults.
import { toPng } from "html-to-image";

function sanitizeFilename(name) {
  if (!name) return "export.png";
  const base = name.replace(/[\\/:*?"<>|\n\r]+/g, "-").trim();
  return base.endsWith(".png") ? base : `${base}.png`;
}

function triggerDownload(dataUrl, filename) {
  const link = document.createElement("a");
  link.download = filename || "export.png";
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportNodeToPng(node, opts = {}) {
  if (!node) throw new Error("exportNodeToPng: target node not found");
  const {
    filename = "weekend.png",
    pixelRatio = 2, // 2x for sharper result
    backgroundColor, // optional override
    cacheBust = true,
    style = {},
  } = opts;

  // Ensure fonts have rendered
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // ignore font loading issues; not critical for export
    }
  }

  const dataUrl = await toPng(node, {
    pixelRatio,
    cacheBust,
    backgroundColor,
    style,
  });
  triggerDownload(dataUrl, sanitizeFilename(filename));
  return dataUrl;
}
