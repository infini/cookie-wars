#!/usr/bin/env python3
"""3x2 chroma-key animation atlases into validated transparent WebP frames."""

from __future__ import annotations

import argparse
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image


FRAME_SUFFIXES = {
    "boss": (
        "walk-1",
        "walk-2",
        "walk-3",
        "hammer-windup",
        "hammer-impact",
        "hammer-recovery",
    ),
    "bot": (
        "run-1",
        "run-2",
        "run-3",
        "throw-windup",
        "throw-release",
        "throw-recovery",
    ),
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--kind", choices=FRAME_SUFFIXES, required=True)
    parser.add_argument("--atlas-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--output-size", type=int, default=384)
    parser.add_argument(
        "--chroma-helper",
        type=Path,
        default=Path.home()
        / ".codex/skills/.system/imagegen/scripts/remove_chroma_key.py",
    )
    parser.add_argument("ids", nargs="*")
    return parser.parse_args()


def validate_alpha(image: Image.Image, source: Path) -> None:
    alpha = image.getchannel("A")
    minimum, maximum = alpha.getextrema()
    if minimum != 0 or maximum != 255:
        raise ValueError(f"{source}: 투명·불투명 픽셀이 모두 필요합니다 ({minimum}, {maximum}).")
    corners = (
        alpha.getpixel((0, 0)),
        alpha.getpixel((image.width - 1, 0)),
        alpha.getpixel((0, image.height - 1)),
        alpha.getpixel((image.width - 1, image.height - 1)),
    )
    if any(value > 8 for value in corners):
        raise ValueError(f"{source}: 모서리 배경이 투명하지 않습니다: {corners}")
    if alpha.getbbox() is None:
        raise ValueError(f"{source}: 캐릭터가 남아 있지 않습니다.")


def clear_fully_transparent_rgb(image: Image.Image) -> Image.Image:
    cleaned = image.copy()
    transparent_mask = cleaned.getchannel("A").point(
        lambda value: 255 if value == 0 else 0
    )
    cleaned.paste((0, 0, 0, 0), mask=transparent_mask)
    return cleaned


def remove_chroma(helper: Path, source: Path, output: Path) -> None:
    subprocess.run(
        [
            sys.executable,
            str(helper),
            "--input",
            str(source),
            "--out",
            str(output),
            "--auto-key",
            "border",
            "--soft-matte",
            "--transparent-threshold",
            "48",
            "--opaque-threshold",
            "115",
            "--despill",
            "--force",
        ],
        check=True,
    )


def process_atlas(
    atlas_path: Path,
    output_dir: Path,
    suffixes: tuple[str, ...],
    output_size: int,
    helper: Path,
) -> list[Path]:
    with Image.open(atlas_path) as atlas_source:
        atlas = atlas_source.convert("RGB")
    if atlas.width % 3 != 0 or atlas.height % 2 != 0:
        raise ValueError(f"{atlas_path}: 3x2로 정확히 나눌 수 없는 크기입니다.")
    cell_width = atlas.width // 3
    cell_height = atlas.height // 2
    if cell_width != cell_height:
        raise ValueError(f"{atlas_path}: 셀이 정사각형이 아닙니다.")

    output_dir.mkdir(parents=True, exist_ok=True)
    generated: list[Path] = []
    with tempfile.TemporaryDirectory(prefix="cookie-wars-atlas-") as temporary:
        temporary_dir = Path(temporary)
        for frame_index, suffix in enumerate(suffixes):
            column = frame_index % 3
            row = frame_index // 3
            crop_path = temporary_dir / f"crop-{frame_index}.png"
            transparent_path = temporary_dir / f"transparent-{frame_index}.png"
            atlas.crop(
                (
                    column * cell_width,
                    row * cell_height,
                    (column + 1) * cell_width,
                    (row + 1) * cell_height,
                )
            ).save(crop_path)
            remove_chroma(helper, crop_path, transparent_path)
            with Image.open(transparent_path) as transparent_source:
                transparent = transparent_source.convert("RGBA")
            validate_alpha(transparent, transparent_path)
            resized = clear_fully_transparent_rgb(transparent).resize(
                (output_size, output_size),
                Image.Resampling.LANCZOS,
            )
            resized = clear_fully_transparent_rgb(resized)
            output_path = output_dir / f"{atlas_path.stem}-{suffix}.webp"
            resized.save(output_path, "WEBP", lossless=True, method=6)
            generated.append(output_path)
    return generated


def main() -> None:
    args = parse_args()
    if args.output_size <= 0:
        raise ValueError("--output-size는 1 이상이어야 합니다.")
    if not args.chroma_helper.is_file():
        raise FileNotFoundError(args.chroma_helper)
    atlas_paths = (
        [args.atlas_dir / f"{item_id}.png" for item_id in args.ids]
        if args.ids
        else sorted(args.atlas_dir.glob("*.png"))
    )
    if not atlas_paths:
        raise FileNotFoundError(f"atlas가 없습니다: {args.atlas_dir}")
    missing = [path for path in atlas_paths if not path.is_file()]
    if missing:
        raise FileNotFoundError(", ".join(str(path) for path in missing))
    generated = []
    for atlas_path in atlas_paths:
        generated.extend(process_atlas(
            atlas_path,
            args.output_dir,
            FRAME_SUFFIXES[args.kind],
            args.output_size,
            args.chroma_helper,
        ))
    print(f"생성 완료: {len(generated)}개 프레임 -> {args.output_dir}")


if __name__ == "__main__":
    main()
