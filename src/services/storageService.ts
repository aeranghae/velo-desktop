import API from './index';

// 타입스크립트 인터페이스 정의 (ProjectDetail에서 깨지지 않게 규격 유지)
export interface ProjectNode {
  name: string;
  type: 'DIRECTORY' | 'FILE';
  path?: string;
  children?: ProjectNode[];
}

export const storageService = {

  /**
   * 1. 특정 프로젝트의 1차원 파일 트리 구조 가져오기 (GET)
   * URL 규격: GET /api/storage/projects/{projectUuid}/tree
   */
  getProjectTree: async (projectUuid: string): Promise<any[]> => {
    const requestPath = `/api/storage/projects/${projectUuid}/tree`;

    // ===== 요청 디버그 로그 =====
    console.group("[storageService.getProjectTree] 요청 정보");
    console.log("요청 경로:", requestPath);
    console.log("Project UUID:", projectUuid);
    console.groupEnd();

    try {
      // 토큰은 API 인스턴스의 인터셉터에서 자동 첨부됨
      const response = await API.get(requestPath);

      // ===== 성공 응답 디버그 =====
      console.group("[storageService.getProjectTree] 응답 성공");
      console.log("Status:", response.status);
      console.log("Response Data 타입:", Array.isArray(response.data) ? "Array" : typeof response.data);
      console.log("Response Data 길이:", Array.isArray(response.data) ? response.data.length : "N/A");

      if (Array.isArray(response.data) && response.data.length > 0) {
        console.log("Data 샘플 (처음 3개):", response.data.slice(0, 3));
      }
      console.groupEnd();

      // 서버가 준 순수 flat 배열 데이터를 그대로 리턴
      return response.data;

    } catch (error: any) {
      //===== 에러 상세 디버그 =====
      console.group(`[storageService.getProjectTree] 요청 실패 (UUID: ${projectUuid})`);
      console.error("에러 메시지:", error.message);

      if (error.response) {
        console.error("응답 Status:", error.response.status);
        console.error("응답 Body:", error.response.data);

        switch (error.response.status) {
          case 400:
            console.error("해석: 잘못된 요청 - URL 형식이나 파라미터를 확인하세요.");
            break;
          case 401:
            console.error("해석: 인증 실패 - 토큰이 없거나 만료/위조되었습니다.");
            break;
          case 403:
            console.error("해석: 권한 없음 - 토큰은 유효하지만 이 리소스에 접근할 권한이 없습니다.");
            break;
          case 404:
            console.error("해석: 리소스 없음 - 이 UUID의 프로젝트가 DB에 존재하지 않습니다.");
            break;
          case 500:
            console.error("해석: 서버 내부 오류 - 백엔드 로그를 확인해야 합니다.");
            break;
        }
      } else if (error.request) {
        console.error("요청은 전송됐으나 응답을 받지 못함 (네트워크 또는 CORS 의심)");
      }
      console.groupEnd();

      throw error;
    }
  },

  // 2. 특정 파일 내용 실시간 조회(GET)
  //URL 규격: GET /api/storage/projects/{uuid}/file-content?path=src/Main.java
  getFileContent: async (projectUuid: string, path: string): Promise<string> => {
    const requestPath = `/api/storage/projects/${projectUuid}/file-content`;

    // 디버그 로그
    console.group("[storageService.getFileContent] 요청 정보");
    console.log("요청 경로:", requestPath);
    console.log("파일 경로 파라미터:", path);
    console.groupEnd();

    try {
      const response = await API.get(requestPath, {
        params: { path: path },
        responseType: 'text' // 백엔드가 JSON이 아닌 생 텍스트(String)를 주므로 text 타입으로 가로챔
      });

      //성공 로그
      console.group("[storageService.getFileContent] 응답 성공");
      console.log("Status:", response.status);
      console.log("응답 데이터 길이:", typeof response.data === 'string' ? response.data.length : "N/A");
      console.log("응답 데이터 미리보기:", typeof response.data === 'string' ? response.data.substring(0, 200) : response.data);
      console.groupEnd();

      return response.data;

    } catch (error: any) {
      //에러 로그
      console.group(`[storageService.getFileContent] 요청 실패 (Path: ${path})`);
      console.error("에러 메시지:", error.message);

      if (error.response) {
        console.error("응답 Status:", error.response.status);
        console.error("응답 Body:", error.response.data);
      }
      console.groupEnd();

      throw error;
    }
  },

  // 프로젝트 상세 명세(description) 엽데이트 (PATCH)
  //URL 규격: PATCH /api/storage/projects/{projectUuid}/update
  updateProjectDescription: async (projectUuid: string, description: string): Promise<any> => {
    const requestPath = `/api/storage/projects/${projectUuid}/update`;

    // ===== 요청 디버그 로그 =====
    console.group("[storageService.updateProjectDescription] 요청 정보");
    console.log("요청 경로:", requestPath);
    console.log("전송할 쿼리 데이터:", description);
    console.groupEnd();

    try {
      const response = await API.get(requestPath, {
        params: {
          description: description
        }
      });

      // ===== 성공 응답 디버그 =====
      console.group("[storageService.updateProjectDescription] 응답 성공");
      console.log("Status:", response.status);
      console.log("응답 Body:", response.data);
      console.groupEnd();

      return response.data;

    } catch (error: any) {
      // ===== 에러 상세 디버그 =====
      console.group(`[storageService.updateProjectDescription] 요청 실패 (UUID: ${projectUuid})`);
      console.error("에러 메시지:", error.message);

      if (error.response) {
        console.error("응답 Status:", error.response.status);
        console.error("응답 Body:", error.response.data);
      }
      console.groupEnd();

      throw error;
    }
  }



};