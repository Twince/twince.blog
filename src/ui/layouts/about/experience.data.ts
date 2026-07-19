// ABOUT 페이지 경력 데이터 — Figma about(4138:1240) EXPERIENCE(4816:895) 원문 전사.
// EDGE(사용자): content collection으로 승격할지(스키마 통제) vs 정적 모듈 유지 — 갱신 빈도 낮아 모듈로 시작.

/** 제목 아래 작은 회색 라벨의 한 조각 (Figma #9e9e9e). href 유무로 링크/plain 분기. */
export interface MentionSegment {
  /** 표시 텍스트 — 링크형(예: "@jungkeechu") 또는 plain 설명(예: "개인정비시간활용") */
  text: string;
  /** 있으면 <a>로 렌더, 없으면 plain <span>. ⚠ 아래 href는 GitHub placeholder — 실제 플랫폼 확인 후 교정 */
  href?: string;
}

export interface ExperienceItem {
  title: string;
  /** 제목이 두 줄인 경우 \n 포함 (예: 2023 IT 지원위원회) */
  bullets: string[];
  /** @핸들·비고 등 제목 아래 작은 회색 라벨. 조각 단위 배열 — 조각마다 링크 독립 */
  mention?: MentionSegment[];
  /** 기간 라벨 — 제목 오른쪽 (예: "2024.3 ~ 2024.5") */
  period?: string;
}

export interface ExperienceYear {
  /** 연도 라벨 원문 (예: "2026", "2021 ~") */
  year: string;
  /** 연도 라벨 바로 아래 레일 보조 라벨 (예: "군복무") */
  railLabel?: string;
  /** 바로 위 연도 박스와 divider 없이 하나로 합침(예: 군복무처럼 연속 기간). 위→아래 정렬에서 아래쪽 항목에 지정 */
  mergeUp?: boolean;
  items: ExperienceItem[];
}

export const EXPERIENCE_YEARS: ExperienceYear[] = [
  {
    year: "2026",
    items: [
      {
        title: "숭실대학교 축제 서비스 SIGNAL 기획 고도화 및 개발, 운영",
        mention: [{ text: "@Ren" }, { text: "@Emily" }, { text: "@Max" }, { text: "@Dean" }],
        bullets: [
          "축제 기간동안 서로의 프로필을 구경하고 마음에 드는 연락처를 얻을 수 있는 소개팅 서비스",
          "퍼포먼스 관점에서의 유저 사용 흐름과 접근성을 고려한 프로덕트 고도화 기획 - 운영 3일간 Unique User 3,089명 / 지난 분기 대비 87%p 수익률 증가",
          "Mixpanel등을 이용한 데이터 로깅 및 분석, 액션 플랜 수립",
          "AI Driven한 빠른 프로덕트 리팩토링 및 프론트엔드 개발 진행(온보딩 및 프로덕트 기획 고도화, 서비스 리팩토링, QA 포함 - 전체 10일)",
        ],
      },
    ],
  },
  {
    year: "2025",
    railLabel: "군복무",
    items: [
      {
        title: "8전투비행단 전대로고 및 패치 디자인",
        bullets: [
          "공군 8전투비행단 항공기정비전대 로고 제작",
          "지휘관 패치 및 부대 피복 로고 디자인",
        ],
      },
      {
        title: "Neural Network Visualization",
        mention: [{ text: "개인정비시간활용" }],
        bullets: [
          "바닥부터 구현하는 AI 신경망 시각화 프로젝트",
          "MVC 아키텍쳐 설계 / EventBus 기반 실시간 숫자추론",
          "Vanilla JS를 통한 CNN 구현 / MNEST 데이터 셋을 활용한 자체 weight-training",
          "멀티플랫폼 성능 계선을 위한 PreTrained weight 분리",
          "인터렉티브 UX 설계 / Vanilla Canvas 인터렉션 구현",
        ],
      },
      {
        title: "군복무 중 수상 및 포상",
        bullets: [
          "병 858기 진급평가 우수자 수상",
          "특급병사 / 체력검정 특급 포상 (2025 하반기 체력검정 만점)",
          "대대 사격 성적 최우수 병사"
        ],
      }
    ],
  },
  {
    year: "2024",
    railLabel: "군복무",
    mergeUp: true, // 위 2025 박스와 divider 없이 하나로(군복무 연속 기간)
    items: [
      {
        title: "YOURSSU PM Vice Lead",
        period: "2024.4 ~ 2024.5",
        bullets: ["@Yourssu PM팀 신설"],
      },
      {
        title: "교내동아리 멘토",
        period: "2024.3 ~ 2024.5",
        bullets: ["교내소모임 UNTITLE 멘토", "학부생 대상 커피챗 진행"],
      },
      {
        title: "군입대",
        period: "2024.5 ~ 2026.3",
        bullets: ["공군 제 858기 항공기전자장비정비특기(병장 만기전역) "],
      },
    ],
  },
  {
    year: "2023",
    items: [
      {
        title: "숭실대학교 글로벌미디어학부 부학생회장",
        bullets: [
          "학교 학부 / 단과대학과 관련한 전반적인 운영 및 예결산관리",
          "OT 및 새내기배움터, 캠퍼스투어, MT, LT, 대여사업, 축제 기획 및 운영",
          "인프라 관리, 신입국원 채용, 세부 부서 운영, 세칙인준, 학부장 간담회, 유관부서 합의, 학부관련 클레임 처리 등 다양한 이벤트 및 행사 총괄",
        ],
      },
      {
        title: "SSUTODAY - 숭실대학교 스터디룸 예약 시스템",
        mention: [{ text: "@jonghokim27", href: "https://github.com/jonghokim27" }],
        bullets: [
          "숭실대학교 IT대학(정보과학관) 테라스 예약 및 학부 공지 시스템 기획",
          "직관적인 예약 확인 및 사용성 관점을 우선으로 한 서비스 모바일 UX 설계 - 시간 선택 섹션 기반 휭 스크롤 예약 UI",
          "Apple App Store 및 Google Playstore 출시",
        ],
      },
      {
        title: "남성시장 골목상권 활성화 프로젝트",
        mention: [{ text: "@jeayungYoon", href: "https://github.com/jeayungYoon" }],
        bullets: [
          "서울시 동작구와 연계하는 골목상권 살리기 프로젝트",
          "전통시장 활성화 소상공인시장진흥공단 - 남성역 골목시장 활성화 유공",
          "시장 방문 및 일손 돕기 진행",
          "시장 정보를 담고 있는 static 웹페이지 배포",
        ],
      },
      {
        title: "숭실대학교 특별기구, 제 1대 IT 지원위원회 PM / DL,\n총학생회 신설 디지털혁신국 합류",
        bullets: [
          "교내 IT 서비스 개발 및 기술 지원담당을 위한 특별기구에서 디자인 리딩 및 PM",
          "개발·기획 부서 간 커뮤니케이션 및 요구사항 조율",
          "숭실대학교 총학생회 홈페이지 활성화를 위한 리브랜딩 제시 및 UX/UI 초안 설계",
        ],
      },
      {
        title: "IT 공모전 우수상",
        mention: [
          { text: "@YunaPyeoun", href: "https://github.com/Drizzle03" },
          { text: "@HyunsDev", href: "https://github.com/HyunsDev" },
        ],
        bullets: [
          "숭실대학교 IT 프로젝트 공모전 우수상",
          "쉽고 빠른 팀플 서비스 모여(Moyeo)",
        ],
      },
      {
        title: "YOURSSU Web FE Lead",
        bullets: [
          "@Yourssu Frontend팀 리드",
          "팀 리소스 관리 및 동아리 운영",
          "축제 TF Management 및 realworld 스터디 주도",
        ],
      },
      {
        title: "HCI LAB - 한국컴퓨터학회 논문기재",
        mention: [
          { text: "@jungkeechu", href: "https://github.com/jungkeechu" },
          { text: "@EunwooSong", href: "https://github.com/EunwooSong" },
        ],
        bullets: [
          "DBpida / DOI 10.32431 / 컴퓨터교육학회논문지 제27권 제2호",
          "‘웹 기반 파이썬 개발 환경과 메타버스 플랫폼’ 공동개발 / UX 파트",
        ],
      },
    ],
  },
  {
    year: "2022",
    items: [
      {
        title: "숭실대학교 입학",
        bullets: [
          "글로벌미디어학부 학생회 홍보국 소속",
          "학부 카드뉴스 및 캘린더 리뉴얼 작업 / 템플릿 제작",
          "학술 중앙동아리 @Yourssu 프론트엔드팀 합류",
        ],
      },
      {
        title: "숭실대학교 사물함 예약 시스템 공동개발",
        mention: [{ text: "@EATSTEAK", href: "https://github.com/EATSTEAK" }],
        bullets: [
          "교내 사물함 인프라 사용을 위한 신청 시스템 기획 및 프론트엔드 개발",
          "Figma를 통한 반응형 UX/UI 설계 및 디자인",
          "Svelte + tailwind를 활용한 SSG 사이트 구축, Github CI/CD 및 S3 배포",
        ],
      },
      {
        title: "2022 대동제 축제 IT대학 포스터 메인 디자인",
        bullets: [
          "Adobe Photoshop / Illustrator를 이용한 그래픽 구현",
          "대동제 IT단과대학 디자인 컨셉 기획",
          "컨셉 디자인 에셋 및 템플릿 제작",
        ],
      },
    ],
  },
  {
    year: "2021",
    items: [
      {
        title: "장애 인식개선 컨텐츠 공모전 교육부장관상",
        bullets: [
          "사회 문제 및 장애인식 개선을 주제로 그래픽 부문 교육부장관상 수상",
          "팀 총괄 및 디렉팅 - 영상의 흐름 및 주제 기획",
          "'틀림이 아닌 다름'을 주제로 쉽게 놓칠 수 있는 일상의 문화적 현상을 자각할 수 있도록 모션 그래픽 편집을 통한 영상 컨텐츠 제작",
        ],
      },
      {
        title: "인천항만공사 아이디어톤 최우수상",
        bullets: [
          "항만공사 활성화를 위한 서비스 기획 및 컨텐츠 디자인",
          "현재 기관이 겪고 있는 문제점을 재정의 - 입국 심사에서의 병목 현상 도출",
          "자동화된 인천항을 위한 온라인 입국 심사 서비스 기획",
        ],
      },
      {
        title: "온라인 수업 서비스 ZUDA - 기획 및 UX 설계",
        bullets: [
          "코로나 펜데믹 대비 효과적인 수업을 위한 서비스 주다(ZUDA) 기획",
          "기성 온라인 플랫폼의 정보 파편화 문제를 기반으로, 참여자와 교사가 실시간으로 인터렉션할 수 있는 대시보드 UX 제시",
          "뉴모피즘과 플랫 디자인 트랜드를 혼합한 Bento Grid UI 디자인 도입",
          "react-parallax를 이용한 인터렉티브 웹 디자인 및 구현",
        ],
      },
    ],
  },
];

export const CERTIFICATIONS: string[] = [
  "정보처리기능사",
  "컴퓨터활용능력 2급",
  "웹디자인기능사",
  "Adobe Certified Professional(ACA)",
];
