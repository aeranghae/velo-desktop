export interface FrameworkStats {
  totalProjectCount: number;                 // 총 프로젝트 개수 (ex: 3)
  frameworkCounts: { [key: string]: number }; // 프레임워크별 생성 누적 맵 (ex: {"SPRING_BOOT": 1, "REACT": 1})
}

export const FRAMEWORK_META: { [key: string]: { name: string; color: string } } = {
  SPRING_BOOT: { 
    name: 'spring-boot', 
    color: '#10b981' // 스프링 부트 상징색 (선명한 에메랄드 그린)
  },
  REACT: { 
    name: 'React', 
    color: '#3b82f6' // 리액트 상징색 (세련된 블루)
  },
  CPP: { 
    name: 'C++', 
    color: '#f59e0b' // C++ 상징색 (오렌지 골드)
  },
  PYTHON: { 
    name: 'Python', 
    color: '#a855f7' // 파이썬 상징색 (네온 퍼플)
  },
  NODE_JS: { 
    name: 'Node.js', 
    color: '#6366f1' // 노드 상징색 (인디고 블루)
  }
};