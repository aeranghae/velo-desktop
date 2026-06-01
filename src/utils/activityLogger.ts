// 클라이언트 측 활동 로그 중앙 관리 모듈 - 서버 없이로컬에서만 처리
export interface ActivityLogItem {
  text: string;          
  time: string;          
  type: 'success' | 'info' | 'warning';
}

const STORAGE_KEY = 'aeranghae_activity_logs';
const EVENT_NAME = 'dashboard-activity-update';
const MAX_LOGS = 50;     // 무한 누적 방지용 캡

const formatTime = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export const logActivity = (
  text: string,
  type: ActivityLogItem['type'] = 'info'
) => {
  const log: ActivityLogItem = { text, time: formatTime(new Date()), type };

  // 1) 로컬에 누적 저장 (페이지 이동/새로고침 대응)
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const prev: ActivityLogItem[] = raw ? JSON.parse(raw) : [];
    const next = [log, ...prev].slice(0, MAX_LOGS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch (e) {
    console.warn('활동 로그 저장 실패:', e);
  }

  // 2) 대시보드가 열려있으면 실시간 반영
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: log }));
};

// 대시보드 마운트 시 과거 로그 복원
export const getActivityLogs = (): ActivityLogItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

// 필요 시 전체 로그 비우기
export const clearActivityLogs = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(EVENT_NAME + '-cleared'));
};