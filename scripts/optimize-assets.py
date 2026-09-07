#!/usr/bin/env python3
"""Create smaller WebP build assets without modifying source artwork.

Source assets live in ``lab/assets``. Generated files mirror that directory in
``lab/assets-optimized`` and are selected by Vite only when a smaller WebP is
available. The manifest makes unchanged inputs inexpensive to process again.
"""

from __future__ import annotations

import json
import os
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from PIL import Image, ImageOps, UnidentifiedImageError


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = PROJECT_ROOT / "lab" / "assets"
OUTPUT_ROOT = PROJECT_ROOT / "lab" / "assets-optimized"
MANIFEST_PATH = OUTPUT_ROOT / ".asset-optimizer.json"
SUPPORTED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".bmp", ".tiff", ".tif"}
WEBP_QUALITY = 82
WEBP_METHOD = 6
MANIFEST_VERSION = 2


class AnimatedImageError(ValueError):
    """Raised when an animated source must remain in its original format."""


@dataclass
class Summary:
    scanned: int = 0
    processed: int = 0
    optimized: int = 0
    cached: int = 0
    skipped: int = 0
    errors: int = 0
    original_bytes: int = 0
    delivered_bytes: int = 0


def display_path(path: Path) -> str:
    return path.relative_to(PROJECT_ROOT).as_posix()


def format_size(size: int) -> str:
    units = ("B", "KB", "MB", "GB")
    value = float(size)
    for unit in units:
        if value < 1024 or unit == units[-1]:
            return f"{value:.0f} {unit}" if unit == "B" else f"{value:.2f} {unit}"
        value /= 1024
    return f"{value:.2f} GB"


def load_manifest() -> dict[str, Any]:
    if not MANIFEST_PATH.exists():
        return {"version": MANIFEST_VERSION, "files": {}}

    try:
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        if manifest.get("version") == MANIFEST_VERSION and isinstance(manifest.get("files"), dict):
            return manifest
    except (OSError, json.JSONDecodeError):
        print("[WARN] Ignoring an unreadable optimizer manifest; assets will be checked again.")

    return {"version": MANIFEST_VERSION, "files": {}}


def save_manifest(manifest: dict[str, Any]) -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    temporary_path = MANIFEST_PATH.with_suffix(".tmp")
    temporary_path.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    temporary_path.replace(MANIFEST_PATH)


def source_fingerprint(source: Path) -> dict[str, int]:
    stat = source.stat()
    return {"mtime_ns": stat.st_mtime_ns, "size": stat.st_size}


def is_current(record: object, fingerprint: dict[str, int]) -> bool:
    return isinstance(record, dict) and record.get("source") == fingerprint


def target_for(source: Path) -> Path:
    relative_path = source.relative_to(SOURCE_ROOT)
    return (OUTPUT_ROOT / relative_path).with_suffix(".webp")


def remove_generated_file(target: Path) -> None:
    if target.exists():
        target.unlink()


def image_has_alpha(image: Image.Image) -> bool:
    return image.mode in {"RGBA", "LA"} or (image.mode == "P" and "transparency" in image.info)


def encode_webp(source: Path, target: Path) -> tuple[Path, int]:
    """Encode one source image once and return its temporary path and byte size."""
    with Image.open(source) as image:
        if getattr(image, "is_animated", False):
            raise AnimatedImageError("animated GIFs are intentionally preserved")

        has_alpha = image_has_alpha(image)
        image.load()
        prepared = ImageOps.exif_transpose(image)
        if has_alpha:
            if prepared.mode != "RGBA":
                prepared = prepared.convert("RGBA")
        elif prepared.mode != "RGB":
            prepared = prepared.convert("RGB")

        target.parent.mkdir(parents=True, exist_ok=True)
        file_descriptor, temporary_name = tempfile.mkstemp(prefix=f".{target.stem}-", suffix=".webp", dir=target.parent)
        os.close(file_descriptor)
        temporary_path = Path(temporary_name)
        try:
            prepared.save(temporary_path, format="WEBP", quality=WEBP_QUALITY, method=WEBP_METHOD)
            return temporary_path, temporary_path.stat().st_size
        except Exception:
            if temporary_path.exists():
                temporary_path.unlink()
            raise


def process_image(source: Path, manifest_files: dict[str, Any], summary: Summary) -> None:
    relative_path = source.relative_to(SOURCE_ROOT)
    key = relative_path.as_posix()
    target = target_for(source)
    fingerprint = source_fingerprint(source)
    record = manifest_files.get(key)
    source_size = fingerprint["size"]

    summary.scanned += 1
    summary.original_bytes += source_size

    if is_current(record, fingerprint):
        if record.get("status") == "optimized" and target.exists():
            optimized_size = target.stat().st_size
            if optimized_size == record.get("optimized_size"):
                summary.cached += 1
                summary.optimized += 1
                summary.delivered_bytes += optimized_size
                print(f"[CACHED] {display_path(source)}")
                return
        elif record.get("status") != "optimized":
            if record.get("status") == "error":
                summary.errors += 1
                summary.delivered_bytes += source_size
                print(f"[ERROR] {display_path(source)}\n        cached optimizer error: {record.get('reason', 'unknown error')}")
                return
            summary.cached += 1
            summary.skipped += 1
            summary.delivered_bytes += source_size
            print(f"[CACHED] {display_path(source)} ({record.get('reason', 'source asset retained')})")
            return

    summary.processed += 1
    try:
        temporary_path, candidate_size = encode_webp(source, target)
        if candidate_size >= source_size:
            temporary_path.unlink()
            remove_generated_file(target)
            manifest_files[key] = {"source": fingerprint, "status": "skipped", "reason": "WebP is not smaller"}
            summary.skipped += 1
            summary.delivered_bytes += source_size
            print(
                f"[SKIP] {display_path(source)}\n"
                f"       WebP ({format_size(candidate_size)}) is not smaller than source ({format_size(source_size)})"
            )
            return

        temporary_path.replace(target)
        optimized_size = candidate_size
        saved_percent = (1 - optimized_size / source_size) * 100
        manifest_files[key] = {"source": fingerprint, "status": "optimized", "optimized_size": optimized_size}
        summary.optimized += 1
        summary.delivered_bytes += optimized_size
        print(
            f"[OPTIMIZE] {display_path(source)}\n"
            f"           original: {format_size(source_size)}\n"
            f"           webp:     {format_size(optimized_size)}\n"
            f"           saved:    {saved_percent:.1f}%"
        )
    except AnimatedImageError:
        remove_generated_file(target)
        manifest_files[key] = {"source": fingerprint, "status": "skipped", "reason": "animated image retained"}
        summary.skipped += 1
        summary.delivered_bytes += source_size
        print(f"[SKIP] {display_path(source)}\n       animated GIF retained")
    except (OSError, UnidentifiedImageError, ValueError) as error:
        remove_generated_file(target)
        manifest_files[key] = {"source": fingerprint, "status": "error", "reason": str(error)}
        summary.errors += 1
        summary.delivered_bytes += source_size
        print(f"[ERROR] {display_path(source)}\n        {error}")


def main() -> int:
    if not SOURCE_ROOT.is_dir():
        print(f"[ERROR] Source directory does not exist: {display_path(SOURCE_ROOT)}")
        return 1

    manifest = load_manifest()
    manifest_files: dict[str, Any] = manifest["files"]
    summary = Summary()
    sources = sorted(path for path in SOURCE_ROOT.rglob("*") if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS)

    # Two source extensions can otherwise map to one destination (for example,
    # icon.png and icon.jpg). Leave both on their original representation.
    targets: dict[Path, list[Path]] = {}
    for source in sources:
        targets.setdefault(target_for(source), []).append(source)
    conflicting_sources = {source for paths in targets.values() if len(paths) > 1 for source in paths}

    for source in sources:
        if source in conflicting_sources:
            summary.scanned += 1
            source_size = source.stat().st_size
            summary.original_bytes += source_size
            summary.delivered_bytes += source_size
            summary.skipped += 1
            key = source.relative_to(SOURCE_ROOT).as_posix()
            manifest_files[key] = {"source": source_fingerprint(source), "status": "skipped", "reason": "destination path collision"}
            print(f"[SKIP] {display_path(source)}\n       another source image maps to the same .webp path")
            continue
        process_image(source, manifest_files, summary)

    save_manifest(manifest)
    saved_bytes = summary.original_bytes - summary.delivered_bytes
    saved_percent = (saved_bytes / summary.original_bytes * 100) if summary.original_bytes else 0
    print(
        "\nSummary:\n"
        f"  scanned:   {summary.scanned}\n"
        f"  processed: {summary.processed}\n"
        f"  optimized: {summary.optimized}\n"
        f"  cached:    {summary.cached}\n"
        f"  skipped:   {summary.skipped}\n"
        f"  original:  {format_size(summary.original_bytes)}\n"
        f"  delivered: {format_size(summary.delivered_bytes)}\n"
        f"  saved:     {format_size(saved_bytes)} ({saved_percent:.1f}%)"
    )
    return 1 if summary.errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
