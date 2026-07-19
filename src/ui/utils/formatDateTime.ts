export const formatDateTime = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;

  // 타임존 고정 — 정적 빌드 산출물이 빌드 머신 타임존에 종속되지 않게.
  // frontmatter date는 +09:00 offset 명시가 규약(docs 참고), 표시도 항상 KST.
  const datePart = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(d);

  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Seoul",
  }).format(d);

  return `${datePart.replace(/\s/g, "").replace(/\.$/, "")} / ${timePart}`;
};
