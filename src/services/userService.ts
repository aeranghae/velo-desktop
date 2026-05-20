import API from './index';

export const userService = {
  //사용 가능한 LLM 모델 리스트 조화 (GET)
  getLlmModelList: async () => {
    try {
      const response = await API.get('/api/llm/list');
      return response.data; // 백엔드 데이터 반환
    } catch (error) {
      console.error("LLM 모델 리스트 조회 API 에러:", error);
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
  }
};