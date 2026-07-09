// ABOUT 페이지 경력 데이터 — Figma about(4138:1240) EXPERIENCE(4816:895) 원문 전사.
// EDGE(사용자): content collection으로 승격할지(스키마 통제) vs 정적 모듈 유지 — 갱신 빈도 낮아 모듈로 시작.

export interface ExperienceItem {
  title: string;
  /** 제목이 두 줄인 경우 \n 포함 (예: 2023 IT 지원위원회) */
  bullets: string[];
  /** @핸들·비고 등 제목 아래 작은 회색 라벨 (Figma #9e9e9e) */
  mention?: string;
  /** 기간 라벨 — 제목 오른쪽 (예: "2024.3 ~ 2024.5") */
  period?: string;
}

export interface ExperienceYear {
  /** 연도 라벨 원문 (예: "2026", "2021 ~") */
  year: string;
  /** 연도 라벨 바로 아래 레일 보조 라벨 (예: "군복무") */
  railLabel?: string;
  items: ExperienceItem[];
}

export const EXPERIENCE_YEARS: ExperienceYear[] = [
  {
    year: "2026",
    items: [
      {
        title: "숭실대학교 축제 서비스 SINGAL 기획 및 개발, 운영",
        bullets: [
          "사용자 관점에서의 UX 설계 및 서비스 기획 및 발전",
          "3일간 운영 - 이용자 수 2528명",
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
          "지휘관 패치 및 부대 파카 로고 디자인",
        ],
      },
      {
        title: "Neural Network Visualization",
        mention: "개인정비시간활용",
        bullets: [
          "바닥부터 구현하는 AI 신경망 시각화 프로젝트",
          "MVC 아키텍쳐 설계 / EventBus 기반 실시간 숫자추론",
          "Vanilla JS를 통한 CNN 구현 / weight-training",
          "인터렉티브 UX 설계 / Vanilla Canvas 인터렉션",
        ],
      },
      {
        title: "진급평가 성적 우수자 포상",
        bullets: ["858기 진급평가 우수자"],
      },
      {
        title: "특급병사 / 체력검정 특급",
        bullets: ["2025년 하반기 체력검정 만점"],
      },
      {
        title: "대대 우수 사격자",
        bullets: ["부품정비대대 사격성적 최우수 병사"],
      },
    ],
  },
  {
    year: "2024",
    railLabel: "군입대",
    items: [
      {
        title: "YOURSSU PM Vice Lead",
        period: "2024.3 ~ 2024.5",
        bullets: ["@Yourssu PM팀 신설"],
      },
      {
        title: "교내동아리 멘토",
        period: "2024.2 ~ 2024.5",
        bullets: ["교내소모임 UNTITLE 멘토", "학부생 대상 커피챗 진행"],
      },
      {
        title: "군입대",
        period: "2024.6 ~ 2026.3",
        bullets: ["공군 제 858기 항공기전자장비정비특기"],
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
        mention: "@jonghokim27",
        bullets: [
          "숭실대학교 IT대학(정보과학관) 테라스 예약 및 학부 공지 시스템 기획",
          "서비스 UX 설계 및 모바일 UI 디자인",
          "Apple App Store 및 Google Playstore 출시",
        ],
      },
      {
        title: "남성시장 골목상권 활성화 프로젝트",
        mention: "@jeayungYoon",
        bullets: [
          "서울시 동작구와 연계하는 골목상권 살리기 프로젝트",
          "전통시장 활성화 소상공인시장진흥공단 - 남성역 골목시장 활성화 유공",
          "시장 정보를 담고 있는 static 웹페이지 배포",
        ],
      },
      {
        title: "숭실대학교 특별기구, 제 1대 IT 지원위원회 PM / DL,\n총학생회 신설 디지털혁신국 합류",
        bullets: [
          "교내 IT 서비스 개발 및 기술 지원담당을 위한 특별기구에서 디자인 리딩 및 PM",
          "숭실대학교 총학생회 홈페이지 리브랜딩 기획 및 UX/UI 디자인",
        ],
      },
      {
        title: "HCI LAB - 한국컴퓨터학회 논문기재",
        mention: "@jungkeechu @EunwooSong",
        bullets: [
          "DBpida / DOI 10.32431 / 컴퓨터교육학회논문지 제27권 제2호",
          "‘웹 기반 파이썬 개발 환경과 메타버스 플랫폼’ 공동개발 / UX 파트",
        ],
      },
      {
        title: "IT 공모전 우수상",
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
    ],
  },
  {
    year: "2022",
    items: [
      {
        title: "숭실대학교 입학",
        bullets: [
          "글로벌미디어학부 학생회 홍보국 소속",
          "학부 카드뉴스 및 캘린더 디자인 / 템플릿 제작",
          "@Yourssu 프론트엔드팀 합류",
        ],
      },
      {
        title: "숭실대학교 사물함 예약 시스템 공동개발",
        mention: "@EATSTEAK",
        bullets: [
          "교내 사물함 인프라 사용을 위한 신청 시스템 기획 및 프론트엔드 개발",
          "Figma를 통한 반응형 UX/UI 설계 및 디자인",
          "Svelte + tailwind를 활용한 SSG 사이트 구축, Github CI/CD 및 S3 배포",
        ],
      },
      {
        title: "2022 대동제 IT대학 포스터 메인 디자인",
        bullets: [
          "Adobe Photoshop / Illustrator를 이용한 그래픽 구현",
          "대동제 IT단과대학 디자인 컨셉 기획",
        ],
      },
    ],
  },
  {
    year: "2021 ~",
    items: [
      {
        title: "장애 인식개선 컨텐츠 공모전 교육부장관상",
        bullets: [
          "사회 문제 및 장애인식 개선을 주제로 그래픽 부문 교육부장관상 수상",
          "팀 총괄 및 기획, 모션 그래픽 편집을 통한 영상 컨텐츠 제작",
        ],
      },
      {
        title: "인천항만공사 아이디어톤 최우수상",
        bullets: [
          "항만공사 활성화를 위한 서비스 기획 및 컨텐츠 디자인",
          "문제점 재정의 및 스마트 인천항을 위한 온라인 입국 심사 서비스 기획",
        ],
      },
      {
        title: "온라인 수업 서비스 ZUDA - 기획 및 UX 설계",
        bullets: [
          "코로나 펜데믹 대비 효과적인 수업을 위한 서비스 주다(ZUDA) 기획",
          "서비스 UX/UI 설계 및 디자인",
          "react-parallax를 이용한 인터렉티브 웹 디자인 구현",
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
