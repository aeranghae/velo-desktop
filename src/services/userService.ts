import API from './index';

export const userService = {
  //사용 가능한 LLM 모델 리스트 조회 (GET)
  getLlmModelList: async () => {
    try {
      const response = await API.get('/api/llm/list');
      return response.data; // 백엔드 데이터 반환
    } catch (error) {
      console.error("LLM 모델 리스트 조회 API 에러:", error);
      throw error;
    }
  },

  // AI 기본 모델 설정 변경 요청 (POST)
  // 추가된 리스트 값(modelName)을 데이터 객체 바디에 실어 서버로 전송
  setDefaultLlmModel: async (modelName: string) => {
    try {
      const response = await API.patch('/api/llm/setdefaultmodel', { modelName });
      return response.data;
    } catch (error) {
      console.error("기본 LLM 모델 설정 변경 API 에러:", error);
      throw error;
    }
  },

  //개인 저장소 사용량 조회 (GET)
  getStorageUsage: async () => {
    try {
      const response = await API.get('/api/storage/usage');
      return response.data;
    } catch (error) {
      console.error("저장소 용량 조회 API 에러:", error);
      throw error;
    }
  },

  //유저 이름 변경(PATCH)
  updateNickname: async (nickname: string) => {
    try {
      //두 번째 인자로 Body 데이터({ nickname })를 넘겨줌
      const response = await API.patch('/api/user/nickname', { nickname });
      return response.data;
    } catch (error) {
      console.error("닉네임 변경 API 에러:", error);
      throw error;
    }
  },

  //내 정보 조회(GET)
  getUserInfo: async () => {
    try {
      const response = await API.get('/api/user/me');
      return response.data;
    } catch (error) {
      console.error("내 정보 조회 API 에러:", error);
      throw error;
    }
  },

  // 프로젝트 메모리 삭제
clearAllProjects: async (): Promise<string> => {
  const DEFAULT_MSG = "모든 프로젝트가 초기화 되었습니다.";
  try {
    const response = await API.delete('/api/storage/projects/clean');
    const data = response.data;

    //서버가 어떤 형태로 주든 문자열로 정규화
    if (typeof data === 'string') return data;
    if (data && typeof data === 'object') {
      return data.message || data.msg || data.result || DEFAULT_MSG;
    }
    return DEFAULT_MSG;
  } catch (error) {
    console.error("프로젝트 전체 초기화 API 에러:", error);
    throw error;
  }
}
};