// 타임존 고정 — 정적 빌드 산출물이 빌드 머신 타임존에 종속되지 않게.
// frontmatter date는 +09:00 offset 명시가 규약(docs 참고), 표시도 항상 KST.
// 포맷터 생성은 로케일 데이터 로드로 format()보다 훨씬 비싸므로 모듈 스코프에 1회.
const DATE_FMT = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Seoul",
});
const TIME_FMT = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Seoul",
});

export const formatDateTime = (date: Date | string) => {
  // ※ string 경로는 offset 없는 문자열이면 머신 로컬로 파싱되는 함정이 남아 있음 —
  //   현재 소비처(ArticleMeta)는 Date만 전달. 규약 강제는 스키마 레벨 결정(EDGE) 대기.
  const d = typeof date === "string" ? new Date(date) : date;

  const datePart = DATE_FMT.format(d);
  const timePart = TIME_FMT.format(d);

  return `${datePart.replace(/\s/g, "").replace(/\.$/, "")} / ${timePart}`;
};
