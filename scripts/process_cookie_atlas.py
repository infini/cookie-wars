#!/usr/bin/env python3
"""2×2 크로마키 atlas를 검증된 쿠키 WebP 에셋으로 변환한다."""

from __future__ import annotations

import argparse
import tempfile
from pathlib import Path

from PIL import Image

from process_cookie_assets import process_asset


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--atlas", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--output-size", type=int, default=512)
    parser.add_argument("--quality", type=int, default=90)
    parser.add_argument(
        "--content-scale",
        type=float,
        default=0.9,
        help="각 셀의 피사체가 경계에 닿지 않도록 중앙 축소하는 비율",
    )
    parser.add_argument(
        "--chroma-helper",
        type=Path,
        default=Path.home()
        / ".codex/skills/.system/imagegen/scripts/remove_chroma_key.py",
    )
    parser.add_argument("ids", nargs="+", help="행 우선 순서의 쿠키 imageKey 1~4개")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if not args.atlas.is_file():
        raise FileNotFoundError(args.atlas)
    if len(args.ids) > 4:
        raise ValueError("2×2 atlas에는 imageKey를 최대 4개 지정할 수 있습니다.")
    if len(set(args.ids)) != len(args.ids):
        raise ValueError("imageKey는 중복될 수 없습니다.")
    if not 0 < args.content_scale <= 1:
        raise ValueError("content-scale은 0보다 크고 1 이하여야 합니다.")
    with Image.open(args.atlas) as source:
        atlas = source.convert("RGB")
    if atlas.width != atlas.height or atlas.width % 2 != 0:
        raise ValueError(f"정사각형 짝수 크기 atlas가 필요합니다: {atlas.size}")

    cell_size = atlas.width // 2
    outputs: list[Path] = []
    with tempfile.TemporaryDirectory(prefix="cookie-wars-cookie-atlas-") as temporary:
        cell_dir = Path(temporary)
        for index, image_key in enumerate(args.ids):
            column = index % 2
            row = index // 2
            cell = atlas.crop((
                column * cell_size,
                row * cell_size,
                (column + 1) * cell_size,
                (row + 1) * cell_size,
            ))
            if args.content_scale < 1:
                scaled_size = max(1, round(cell_size * args.content_scale))
                scaled = cell.resize((scaled_size, scaled_size), Image.Resampling.LANCZOS)
                background = Image.new("RGB", cell.size, cell.getpixel((0, 0)))
                inset = ((cell_size - scaled_size) // 2,) * 2
                background.paste(scaled, inset)
                cell = background
            cell_path = cell_dir / f"{image_key}.png"
            cell.save(cell_path, "PNG")
            outputs.append(process_asset(
                cell_path,
                args.output_dir,
                args.output_size,
                args.chroma_helper,
                args.quality,
                False,
            ))
    print(f"생성 완료: {len(outputs)}개 쿠키 WebP -> {args.output_dir}")


if __name__ == "__main__":
    main()
