export const formatDateTime = (date: Date | string) => {
  const d = typeof date === "string" ? new Date(date) : date;

  const datePart = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);

  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);

  return `${datePart.replace(/\s/g, "").replace(/\.$/, "")} / ${timePart}`;
};
