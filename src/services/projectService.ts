import API from './index';
import { fetchEventSource } from '@microsoft/fetch-event-source';

const BACKEND_URL = 'https://oxxultus.cloud';
const TOKEN_KEY = 'aeranghae_token';

// 실시간 로그 프로젝트 상태 타입
export type ProjectStatus =
  | 'INIT' | 'CREATED' | 'PROVISIONING' | 'CONFIGURING'
  | 'ANALYZING' | 'CODING' | 'GENERATING' | 'EXECUTING'
  | 'COMPLETED' | 'FAILED';

// 실시간 로그용 초기 데이터 응답 인터페이스
export interface ProjectLogResponse {
  uuid: string;
  status: ProjectStatus;
  framework: string;
  previousLogs: string; // \n(줄바꿈) 포함된 단일 텍스트
}

// ProjectAnalysisRequest 규격 (백엔드: request.getIdea())
export interface ProjectAnalysisRequest {
  idea: string;
}

// ProjectArchitectureResponse 규격
export interface ProjectArchitectureResponse {
  subject: string;
  architectureType: 'FULL_STACK' | 'CLIENT_SERVER';
  projectDescription: string;
  framework: { unified: string; backend: string; frontend: string };
  language: { unified: string; backend: string; frontend: string };
  database: string;
  coreFeatures: string[];
  constraints: string[];
  rationale: string;
}

// ProjectCreateRequestDto 규격에 맞춘 타입 정의
export interface ProjectCreateRequestDto {
  projectName: string;
  artifact: string;
  architecture_type: string;
  fullstack_framework: string;
  backend_framework: string;
  frontend_framework: string;
  fullstack_language: string;
  backend_language: string;
  frontend_language: string;
  database: string;
  license: string;
  model: string;
  prompt: string;
}

//ProjectResponseDto 규격에 맞춘 타입 정의
export interface ProjectResponseDto {
  projectName: string;
  uuid: string;
  model: string;
  framework: string;
  status: string;
  description: string; 
  createdAt: string;
  lastModified: string;
  size: number;
  fileCount: number;
}

export const projectService = {
  /*프로젝트 생성 요청*/
  generateProject: async (data: ProjectCreateRequestDto) => {
    try {
      const response = await API.post('/api/project/projects/generate', data);
      return response.data;
    } catch (error) {
      console.error("프로젝트 생성 API 에러:", error);
      throw error;
    }
  },

  //프로젝트 전체 목록 조회 (GET)
  getProjects: async (): Promise<ProjectResponseDto[]> => {
    try {
      const response = await API.get('/api/storage/projects');
      return response.data; 
    } catch (error) {
      console.error("프로젝트 목록 조회 에러:", error);
      throw error;
    }
  },

  //프로젝트 이름 변경(PATCH)
  updateProjectName: async (uuid: string, newName: string) => {
    try {
      const response = await API.patch(`/api/storage/projects/${uuid}`, {
        newName: newName
      });
      return response.data;
    } catch (error) {
      console.error("프로젝트 이름 변경 API 에러:", error);
      throw error;
    }
  },

  //프로젝트 삭제(DELETE)
  deleteProject: async (uuid: string) => {
    try {
      const response = await API.delete(`/api/storage/projects/${uuid}`);
      return response.data;
    } catch (error) {
      console.error("프로젝트 삭제 API 에러:", error);
      throw error;
    }
  },

  // (로그) 초기 상태 및 과거 공정 로그 조회(GET)
  getProjectInitialLog: async (uuid: string): Promise<ProjectLogResponse> => {
    const requestPath = `/api/projects/${uuid}/status`;
    try {
      const response = await API.get(requestPath);
      return response.data;
    } catch (error) {
      console.error("초기 로그 조회 에러:", error);
      throw error;
    }
  },

  // (로그) 실시간 공정 로그 SSE 스트림 연결
  // 백엔드 규격: 헤더 인증(Authorization) +5파트 데이터(레벨||시간||상태||메시지||isActivityFeed)
  // onLog   : 포맷된 로그 라인을 한 줄씩 전달
  // onStatus: 4파트 중 status를 전달 (상단 진행 상태 갱신용)
  // onError : 스트림 종료/에러 시 호출 (최종 상태 재조회용)
  // 반환값  : 연결을 끊는 함수 (AbortController.abort)
  connectProjectLogStream: (
    uuid: string,
    onLog: (line: string) => void,
    onStatus: (status: ProjectStatus) => void,
    onError: () => void
  ): (() => void) => {
    const token = localStorage.getItem(TOKEN_KEY) || '';
    const controller = new AbortController();

    fetchEventSource(`${BACKEND_URL}/api/projects/${uuid}/logs/stream`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,

      onmessage(event) {
        // 백엔드 이벤트명: log-stream 만 처리
        if (event.event !== 'log-stream') return;

        // 고정 5파트 파싱 진행
        const [logLevel, timestamp, status, message, isActivityFeed] = String(event.data).split('||', 5);

        // 시간은 ISO 문자열에서 HH:mm:ss만 추출
        const displayTime = timestamp ? timestamp.substring(11, 19) : '';
        onLog(`[${logLevel ?? ''}] [${displayTime}] ${message ?? ''}`);

        //활동 피드 전송 로직 (isActivityFeed가 'true'이면 커스텀 이벤트 발행)
        if (isActivityFeed === 'true') {
          const activityEvent = new CustomEvent('dashboard-activity-update', {
            detail: {
              text: message ?? '',
              time: displayTime || '방금 전',
              type: 'info'
            }
          });
          window.dispatchEvent(activityEvent);
        }

        // 상태 갱신
        if (status) onStatus(status as ProjectStatus);

        // 종료 상태면 스트림 닫기
        if (status === 'COMPLETED' || status === 'FAILED') {
          controller.abort();
        }
      },

      onerror(err) {
        // 에러 시 종료하고 콜백 호출 (재시도 방지를 위해 throw)
        controller.abort();
        onError();
        throw err;
      },

      onclose() {
        // 서버가 연결을 닫은 경우에도 최종 상태 재확인
        onError();
      },
    }).catch(() => {
      // abort로 인한 정상 종료 등은 무시
    });

    // 호출부에서 연결을 끊을 수 있도록 abort 함수 반환
    return () => controller.abort();
  },


  analyzeProject: async (idea: string): Promise<ProjectArchitectureResponse> => {
    try {
      const requestBody: ProjectAnalysisRequest = { idea };
      
      const response = await API.post('/api/llm/projects/analyze', requestBody);
      return response.data;
    } catch (error) {
      console.error("프로젝트 분석 API 에러 수신:", error);
      throw error;
    }
  },

  // 프로젝트 다운로드 (GET)
  downloadProjectZip: async (uuid: string, onProgress: (percent: number) => void): Promise<any> => {
    try {
      const response = await API.get(`/api/storage/${uuid}/download`, {
        responseType: 'blob', 
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        }
      });
      return response;
    } catch (error) {
      console.error("프로젝트 압축 다운로드 통신 장애:", error);
      throw error;
    }
  },
};