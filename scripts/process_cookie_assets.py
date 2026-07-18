#!/usr/bin/env python3
"""크로마키 쿠키 원본을 검증된 투명 PNG 게임 에셋으로 변환한다."""

from __future__ import annotations

import argparse
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--output-size", type=int, default=512)
    parser.add_argument("--quality", type=int, default=90)
    parser.add_argument(
        "--transparent-input",
        action="store_true",
        help="이미 투명한 PNG를 크로마키 제거 없이 런타임 WebP로 변환합니다.",
    )
    parser.add_argument(
        "--chroma-helper",
        type=Path,
        default=Path.home()
        / ".codex/skills/.system/imagegen/scripts/remove_chroma_key.py",
    )
    parser.add_argument("ids", nargs="*")
    return parser.parse_args()


def clear_fully_transparent_rgb(image: Image.Image) -> Image.Image:
    cleaned = image.copy()
    transparent_mask = cleaned.getchannel("A").point(
        lambda value: 255 if value == 0 else 0
    )
    cleaned.paste((0, 0, 0, 0), mask=transparent_mask)
    return cleaned


def validate_asset(image: Image.Image, source: Path) -> None:
    alpha = image.getchannel("A")
    minimum, maximum = alpha.getextrema()
    if minimum != 0 or maximum != 255:
        raise ValueError(
            f"{source}: 투명·불투명 픽셀이 모두 필요합니다 ({minimum}, {maximum})."
        )
    bounds = alpha.getbbox()
    if bounds is None:
        raise ValueError(f"{source}: 쿠키가 남아 있지 않습니다.")
    if bounds[0] == 0 or bounds[1] == 0 or bounds[2] == image.width or bounds[3] == image.height:
        raise ValueError(f"{source}: 쿠키가 캔버스 경계에 닿았습니다: {bounds}")
    corners = (
        alpha.getpixel((0, 0)),
        alpha.getpixel((image.width - 1, 0)),
        alpha.getpixel((0, image.height - 1)),
        alpha.getpixel((image.width - 1, image.height - 1)),
    )
    if any(value > 8 for value in corners):
        raise ValueError(f"{source}: 모서리 배경이 투명하지 않습니다: {corners}")


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


def process_asset(
    source: Path,
    output_dir: Path,
    output_size: int,
    helper: Path,
    quality: int,
    transparent_input: bool,
) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="cookie-wars-cookie-") as temporary:
        if transparent_input:
            transparent_path = source
        else:
            transparent_path = Path(temporary) / "transparent.png"
            remove_chroma(helper, source, transparent_path)
        with Image.open(transparent_path) as transparent_source:
            transparent = transparent_source.convert("RGBA")
        validate_asset(transparent, source)
        resized = clear_fully_transparent_rgb(transparent).resize(
            (output_size, output_size),
            Image.Resampling.LANCZOS,
        )
        resized = clear_fully_transparent_rgb(resized)
        output_path = output_dir / f"{source.stem}.webp"
        resized.save(
            output_path,
            "WEBP",
            quality=quality,
            method=6,
            lossless=False,
            exact=True,
        )
    return output_path


def main() -> None:
    args = parse_args()
    if args.output_size <= 0:
        raise ValueError("--output-size는 1 이상이어야 합니다.")
    if args.quality < 1 or args.quality > 100:
        raise ValueError("--quality는 1 이상 100 이하여야 합니다.")
    if not args.transparent_input and not args.chroma_helper.is_file():
        raise FileNotFoundError(args.chroma_helper)
    sources = (
        [args.input_dir / f"{item_id}.png" for item_id in args.ids]
        if args.ids
        else sorted(args.input_dir.glob("*.png"))
    )
    if not sources:
        raise FileNotFoundError(f"쿠키 원본이 없습니다: {args.input_dir}")
    missing = [path for path in sources if not path.is_file()]
    if missing:
        raise FileNotFoundError(", ".join(str(path) for path in missing))
    outputs = [
        process_asset(
            source,
            args.output_dir,
            args.output_size,
            args.chroma_helper,
            args.quality,
            args.transparent_input,
        )
        for source in sources
    ]
    print(f"생성 완료: {len(outputs)}개 쿠키 WebP -> {args.output_dir}")


if __name__ == "__main__":
    main()
