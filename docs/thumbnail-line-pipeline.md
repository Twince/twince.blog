# 시리즈 썸네일 라인 아트 파이프라인

시리즈 카드의 대기 상태는 원본 썸네일이 아니라 **저작된 라인 아트**(도면)로 렌더되고,
hover 시 원본 컬러가 드러난다("도면 → 실물" 크로스페이드). 이 문서는 그 라인 에셋을
만들고 배선하는 반복 워크플로를 기록한다. 결정 배경은 [decisions.md](./decisions.md) D11·D12.

## 워크플로 (시리즈 추가/썸네일 교체 시)

```
1. 라인 PNG 생성    — 원본 썸네일과 같은 구도, 흰 바탕 + 검은 선 (생성형 출력 그대로 OK)
2. 저장             — src/content/blog/series/<id>/thumbnail-line.png
3. 트레이스         — pnpm run thumbnail-trace
4. 참조             — series.json 해당 시리즈 thumbnail에 "line": "./<id>/thumbnail-line.svg"
```

- 3단계는 **전 시리즈를 스캔해 소스가 산출물보다 새것인 경우만 재생성**(mtime 비교) —
  아무 때나 실행해도 안전하고, 소스 PNG를 교체하면 다음 실행 때 자동 재트레이스된다.
- 4단계를 잊으면 스크립트가 `warn: ... 참조 없음`으로 알려준다(자동 수정하지 않음 —
  데이터 계약은 스키마 소유).
- **산출 SVG는 커밋한다.** 생성은 로컬 개발 단계의 일이고, 빌드/CI는 potrace·pillow
  의존성 없이 커밋된 SVG만 소비한다.

## 소스 이미지 가이드

- **구도 일치가 품질의 핵심** — hover 크로스페이드가 같은 자리에서 도면→실물로 바뀌는
  구조라, 라인 버전은 원본과 같은 구도여야 한다. 생성형 프롬프트 예:
  *"same composition, clean black line art on white background"*
- 흰 바탕 + 검은 선. 회색 음영은 50% 임계 이진화에서 사라진다(의도된 동작).
- 해상도는 원본 썸네일과 비슷하면 충분(현재 ~1600px 폭 기준으로 검증됨).

## 폴백 사다리

```
thumbnail 없음        → desc 텍스트 (root 카드) / 썸네일 덱 (/series 목록)
thumbnail.line 없음   → 런타임 엣지 필터 (SeriesLayouts의 SVG 필터 — 시스템 기본 품질)
thumbnail.line 있음   → 저작된 라인 아트 (이 파이프라인)
```

새 시리즈는 원본만 넣고 배포해도 되고(필터 폴백), 여유 될 때 라인을 추가하면
자동으로 상위 품질로 올라간다.

## 노브 (조정 지점)

| 노브 | 위치 | 의미 |
|---|---|---|
| `DILATE = 3` | `scripts/trace-line-art.py` | 선 굵기(홀수 커널, 0=원본). 전체 재생성: 값 수정 → 소스 touch → 배치 실행 |
| `THRESHOLD = 128` | 〃 | 선/지면 이진화 임계 |
| `--line-ink-mix, 22%` | `root.css .series-thumb-line::after` | 잉크 톤 — 보더↔텍스트 토큰 사이 보간 위치 |
| `text-primary 1%` 혼합 | `root.css .series-thumb-line` | 대기 존 배경판의 "될락 말락" 분리(테마 자동 정합) |

단일 파일 실험(굵기 스윕 등): `python3 scripts/trace-line-art.py <in.png> <out.svg> [dilate]`

## 의존성 (로컬 개발만)

```
brew install potrace
pip3 install --user pillow
```
