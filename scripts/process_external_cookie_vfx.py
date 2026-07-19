#!/usr/bin/env python3
"""CC0 폭발 atlas와 번개 PNG를 React Native용 투명 WebP로 변환한다."""

from __future__ import annotations

import argparse
import io
import struct
from pathlib import Path

from PIL import Image, ImageChops


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--explosion-atlas", type=Path, required=True)
    parser.add_argument("--lightning-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--quality", type=int, default=90)
    return parser.parse_args()


def without_png_chunks(source: bytes, excluded: set[bytes]) -> bytes:
    """메타데이터 CRC가 잘못된 원본에서도 픽셀 데이터만 안전하게 읽는다."""
    signature = source[:8]
    offset = 8
    chunks: list[bytes] = []
    while offset < len(source):
        length = struct.unpack(">I", source[offset:offset + 4])[0]
        end = offset + 12 + length
        chunk_type = source[offset + 4:offset + 8]
        if chunk_type not in excluded:
            chunks.append(source[offset:end])
        offset = end
        if chunk_type == b"IEND":
            break
    return signature + b"".join(chunks)


def process_explosion(atlas_path: Path, output_dir: Path, quality: int) -> None:
    sanitized = without_png_chunks(atlas_path.read_bytes(), {b"iCCP"})
    with Image.open(io.BytesIO(sanitized)) as source:
        atlas = source.convert("RGBA")
    if atlas.size != (1600, 1600):
        raise ValueError(f"4×4 1600px 폭발 atlas가 필요합니다: {atlas.size}")
    for index in range(16):
        column = index % 4
        row = index // 4
        frame = atlas.crop((
            column * 400,
            row * 400,
            (column + 1) * 400,
            (row + 1) * 400,
        ))
        frame.save(
            output_dir / f"magma-eruption-{index + 1:02d}.webp",
            "WEBP",
            quality=quality,
            method=4,
        )


def process_lightning(lightning_dir: Path, output_dir: Path, quality: int) -> None:
    sources = sorted(lightning_dir.glob("*.png"), key=lambda path: int(path.stem))
    if len(sources) != 11:
        raise ValueError(f"번개 원본 11개가 필요합니다: {len(sources)}개")
    for index, source_path in enumerate(sources):
        with Image.open(source_path) as source:
            rgb = source.convert("RGB")
        red, green, blue = rgb.split()
        alpha = ImageChops.lighter(ImageChops.lighter(red, green), blue)
        rgba = rgb.convert("RGBA")
        rgba.putalpha(alpha)
        vertical = rgba.rotate(90, expand=True, resample=Image.Resampling.BICUBIC)
        vertical.thumbnail((256, 512), Image.Resampling.LANCZOS)
        vertical.save(
            output_dir / f"lightning-bolt-{index + 1:02d}.webp",
            "WEBP",
            quality=quality,
            method=4,
        )


def main() -> None:
    args = parse_args()
    if not args.explosion_atlas.is_file():
        raise FileNotFoundError(args.explosion_atlas)
    if not args.lightning_dir.is_dir():
        raise NotADirectoryError(args.lightning_dir)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    process_explosion(args.explosion_atlas, args.output_dir, args.quality)
    process_lightning(args.lightning_dir, args.output_dir, args.quality)
    print(f"외부 VFX 변환 완료: 폭발 16프레임, 번개 11종 -> {args.output_dir}")


if __name__ == "__main__":
    main()
