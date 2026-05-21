import API from './index';

const BACKEND_URL = 'https://oxxultus.cloud';
const TOKEN_KEY = 'aeranghae_token';

// 실시간 로그 프로젝트 상태 타입
export type ProjectStatus = 'CREATED' | 'ANALYZING' | 'GENERATING' | 'COMPLETED' | 'FAILED';

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
  // onLog: "레벨||시간||메시지" 파싱 결과를 한 줄씩 전달
  // onError: 스트림 종료/에러 시 호출 (최종 상태 재조회용)
  // 반환값: 연결을 끊을 수 있는 EventSource 객체
  connectProjectLogStream: (
    uuid: string,
    onLog: (line: string) => void,
    onError: () => void
  ): EventSource => {
    const token = localStorage.getItem(TOKEN_KEY) || '';
    // EventSource는 헤더를 못 보내므로 토큰을 쿼리 파라미터로 전달
    const url = `${BACKEND_URL}/api/projects/${uuid}/logs/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(url);

    eventSource.addEventListener('log-stream', (event: MessageEvent) => {
      // 데이터 형식: "레벨||시간||메시지"
      const parts = String(event.data).split('||');
      const level   = parts[0] ?? '';
      const time    = parts[1] ?? '';
      const message = parts[2] ?? '';
      onLog(`[${level}][${time}] ${message}`);
    });

    eventSource.onerror = () => {
      eventSource.close();
      onError();
    };

    return eventSource;
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
};