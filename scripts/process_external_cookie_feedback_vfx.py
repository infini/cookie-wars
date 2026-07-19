#!/usr/bin/env python3
"""외부 CC0 스프라이트 시트를 Android용 애니메이션 WebP로 변환한다."""

from __future__ import annotations

import argparse
import gc
from pathlib import Path

from PIL import Image, ImageChops


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--critical-atlas", type=Path, required=True)
    parser.add_argument("--magma-atlas", type=Path, required=True)
    parser.add_argument("--super-gold-atlas", type=Path, required=True)
    parser.add_argument("--super-cyan-atlas", type=Path, required=True)
    parser.add_argument("--electric-atlas", type=Path, required=True)
    parser.add_argument("--lightning-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--quality", type=int, default=92)
    return parser.parse_args()


def split_atlas(path: Path, columns: int, rows: int) -> list[Image.Image]:
    with Image.open(path) as atlas_source:
        atlas = atlas_source.convert("RGBA")
    frame_width = atlas.width // columns
    frame_height = atlas.height // rows
    return [
        atlas.crop((
            column * frame_width,
            row * frame_height,
            (column + 1) * frame_width,
            (row + 1) * frame_height,
        ))
        for row in range(rows)
        for column in range(columns)
    ]


def fit_frame(frame: Image.Image, size: int, scale: float = 1.0) -> Image.Image:
    canvas = Image.new("RGBA", (size, size))
    fitted_size = round(size * scale)
    fitted = frame.resize((fitted_size, fitted_size), Image.Resampling.LANCZOS)
    offset = (size - fitted_size) // 2
    canvas.alpha_composite(fitted, (offset, offset))
    return canvas


def fit_sequence(
    frames: list[Image.Image],
    size: int,
    fill_ratio: float = 0.92,
) -> list[Image.Image]:
    """모든 프레임의 공통 알파 경계를 사용해 흔들림 없이 투명 여백을 제거한다."""
    combined_alpha = Image.new("L", frames[0].size)
    for frame in frames:
        combined_alpha = ImageChops.lighter(combined_alpha, frame.getchannel("A"))
    bounds = combined_alpha.getbbox()
    if bounds is None:
        return [fit_frame(frame, size, fill_ratio) for frame in frames]
    left, top, right, bottom = bounds
    center_x = (left + right) / 2
    center_y = (top + bottom) / 2
    side = max(right - left, bottom - top)
    crop_bounds = (
        round(center_x - side / 2),
        round(center_y - side / 2),
        round(center_x + side / 2),
        round(center_y + side / 2),
    )
    fitted_size = round(size * fill_ratio)
    offset = (size - fitted_size) // 2
    output: list[Image.Image] = []
    for frame in frames:
        cropped = frame.crop(crop_bounds).resize(
            (fitted_size, fitted_size),
            Image.Resampling.LANCZOS,
        )
        canvas = Image.new("RGBA", (size, size))
        canvas.alpha_composite(cropped, (offset, offset))
        output.append(canvas)
    return output


def save_animation(
    frames: list[Image.Image],
    destination: Path,
    duration_ms: int,
    quality: int,
) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    frame_duration_ms = max(1, round(duration_ms / len(frames)))
    first_frame = frames[0].copy()
    remaining_frames = [frame.copy() for frame in frames[1:]]
    first_frame.save(
        destination,
        format="WEBP",
        save_all=True,
        append_images=remaining_frames,
        duration=frame_duration_ms,
        loop=0,
        lossless=False,
        quality=quality,
        method=0,
    )
    first_frame.close()
    for frame in remaining_frames:
        frame.close()


def save_speed_variants(
    frames: list[Image.Image],
    output_dir: Path,
    name: str,
    full_duration_ms: int,
    compact_duration_ms: int | None,
    quality: int,
) -> None:
    save_animation(frames, output_dir / f"{name}.webp", full_duration_ms, quality)
    if compact_duration_ms is not None:
        save_animation(
            frames,
            output_dir / f"{name}-compact.webp",
            compact_duration_ms,
            quality,
        )


def compose_super_effect(
    gold_frames: list[Image.Image],
    cyan_frames: list[Image.Image],
    size: int,
) -> list[Image.Image]:
    fitted_gold = fit_sequence(gold_frames, size, 0.94)
    fitted_cyan = fit_sequence(cyan_frames, size, 0.78)
    output: list[Image.Image] = []
    for index, gold in enumerate(fitted_gold):
        canvas = gold.copy()
        cyan = fitted_cyan[index]
        canvas.alpha_composite(cyan)
        output.append(canvas)
    return output


def load_lightning_frames(path: Path) -> list[Image.Image]:
    files = sorted(path.glob("lightning-bolt-*.webp"))
    if not files:
        raise ValueError(f"번개 프레임을 찾을 수 없습니다: {path}")
    frames: list[Image.Image] = []
    for file in files:
        with Image.open(file) as source:
            frames.append(source.convert("RGBA"))
    return frames


def lightning_layer(
    lightning_frames: list[Image.Image],
    frame_index: int,
    size: int,
) -> Image.Image:
    canvas = Image.new("RGBA", (size, size))
    strike_width = round(size * 0.34)
    strike_height = round(size * 0.88)
    strike_positions = (-0.1, 0.28, 0.66, -0.1, 0.28, 0.66, -0.1, 0.28, 0.66)
    strike_delays = (0, 2, 4, 20, 22, 24, 40, 42, 44)
    for position, delay in zip(strike_positions, strike_delays):
        local_index = frame_index - delay
        if local_index < 0 or local_index >= len(lightning_frames):
            continue
        strike = lightning_frames[local_index].resize(
            (strike_width, strike_height),
            Image.Resampling.LANCZOS,
        )
        canvas.alpha_composite(strike, (round(size * position), 0))
    return canvas


def compose_electric_effect(
    impact_frames: list[Image.Image],
    lightning_frames: list[Image.Image],
    size: int,
) -> list[Image.Image]:
    fitted_impacts = fit_sequence(impact_frames, size, 0.72)
    output: list[Image.Image] = []
    for index, impact in enumerate(fitted_impacts):
        canvas = lightning_layer(lightning_frames, index, size)
        canvas.alpha_composite(impact)
        output.append(canvas)
    return output


def main() -> None:
    args = parse_args()
    critical = fit_sequence(split_atlas(args.critical_atlas, 4, 4), 384)
    save_speed_variants(critical, args.output_dir, "critical", 1_100, 650, args.quality)
    del critical
    gc.collect()

    magma = fit_sequence(split_atlas(args.magma_atlas, 8, 8), 512)
    save_speed_variants(magma, args.output_dir, "magma", 1_500, None, args.quality)
    del magma
    gc.collect()

    gold = split_atlas(args.super_gold_atlas, 8, 8)
    cyan = split_atlas(args.super_cyan_atlas, 8, 8)
    super_effect = compose_super_effect(gold, cyan, 576)
    save_speed_variants(
        super_effect,
        args.output_dir,
        "super-critical",
        1_800,
        720,
        args.quality,
    )
    del gold, cyan, super_effect
    gc.collect()

    electric = split_atlas(args.electric_atlas, 8, 8)
    lightning = load_lightning_frames(args.lightning_dir)
    electric_effect = compose_electric_effect(electric, lightning, 640)
    save_speed_variants(
        electric_effect,
        args.output_dir,
        "electric",
        2_200,
        None,
        args.quality,
    )


if __name__ == "__main__":
    main()
