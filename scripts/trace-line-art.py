#!/usr/bin/env python3
"""라인 아트 소스 PNG → 마스크용 SVG 트레이스 파이프라인.

시리즈 카드 대기 상태 레이어(thumbnail.line)용 에셋 생성기.

컨벤션(배치 모드 — 권장 워크플로):
  각 시리즈 폴더에 소스를 `thumbnail-line.png`로 두면, 인자 없이 실행 시
  전 시리즈를 스캔해 소스가 산출물(thumbnail-line.svg)보다 새것인 경우만 재생성한다.
    python3 scripts/trace-line-art.py          # = pnpm run thumbnail-trace
  ※ 산출 SVG는 커밋한다(빌드/CI에 potrace·pillow 의존성이 생기지 않게).
  ※ series.json의 thumbnail.line 참조는 스키마(사용자) 소유 — 누락 시 경고만 한다.

단일 파일 모드(굵기 실험 등):
  python3 scripts/trace-line-art.py <input.png> <output.svg> [dilate]

소스 규격: 흰 바탕 + 검은 선(생성형 출력 그대로 OK), 원본 썸네일과 같은 구도
  (hover가 "도면→실물" 크로스페이드라 구도 일치가 전환 품질을 결정).

의존성: pillow(pip), potrace(brew install potrace)
"""
import json
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageFilter

THRESHOLD = 128  # 명도 임계 — 선/지면 이진화 기준(0~255)
DILATE = 3       # 기본 선 굵힘 커널(홀수, 0=원본) — 사이트 채택값
SERIES_DIR = Path("src/content/blog/series")
SRC_NAME = "thumbnail-line.png"
OUT_NAME = "thumbnail-line.svg"


def trace(src: Path, dst: Path, dilate: int = DILATE) -> None:
    im = Image.open(src).convert("L")
    if dilate:
        # MinFilter = 어두운 픽셀(선) 팽창 — 스트로크 굵기는 에셋 파이프라인이 소유
        im = im.filter(ImageFilter.MinFilter(dilate))
    bw = im.point(lambda v: 0 if v < THRESHOLD else 255, "1")

    with tempfile.NamedTemporaryFile(suffix=".pbm", delete=False) as tmp:
        bw.save(tmp.name)
        subprocess.run(
            ["potrace", "-s", "--turdsize", "4", "--alphamax", "1", "-o", str(dst), tmp.name],
            check=True,
        )
    Path(tmp.name).unlink()
    print(f"traced: {dst} ({dst.stat().st_size / 1024:.1f}KB, dilate={dilate})")


def batch() -> None:
    regenerated = skipped = 0
    for src in sorted(SERIES_DIR.glob(f"*/{SRC_NAME}")):
        dst = src.parent / OUT_NAME
        if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
            skipped += 1
            continue
        trace(src, dst)
        regenerated += 1
    print(f"batch: {regenerated} regenerated, {skipped} up-to-date")

    # series.json 참조 누락 경고(수정은 안 함 — 데이터 계약은 사용자 소유)
    registry = json.loads((SERIES_DIR / "series.json").read_text())
    for entry in registry:
        sid = entry["id"]
        has_asset = (SERIES_DIR / sid / OUT_NAME).exists()
        has_ref = bool(entry.get("thumbnail", {}).get("line"))
        if has_asset and not has_ref:
            print(f"warn: {sid} — {OUT_NAME} 존재하나 series.json thumbnail.line 참조 없음")
        if has_ref and not has_asset:
            print(f"warn: {sid} — series.json이 참조하는 {OUT_NAME} 파일 없음")


def main() -> None:
    if len(sys.argv) == 1:
        batch()
    elif len(sys.argv) in (3, 4):
        dilate = int(sys.argv[3]) if len(sys.argv) == 4 else DILATE
        trace(Path(sys.argv[1]), Path(sys.argv[2]), dilate)
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
