# Google Apps Script 배포 가이드

## 1. GAS 프로젝트 생성

1. Google Drive '비욘드 AI' 폴더에서 새 Google Apps Script 생성
2. `Code.gs` 내용을 붙여넣기
3. 프로젝트 이름: `Beyond AI API`

## 2. 스크립트 속성 설정

1. GAS 에디터 > 프로젝트 설정 > 스크립트 속성
2. 추가:
   - `SPREADSHEET_ID`: 비욘드 AI 스프레드시트 ID
   - `API_KEY`: 생성한 API 키 (아무 랜덤 문자열)

## 3. 시트 초기화

1. GAS 에디터에서 `initAllSheets` 함수 실행
2. 7개 워크시트 + 초기 관리자 2명 자동 생성

## 4. 웹 앱 배포

1. 배포 > 새 배포 > 웹 앱 선택
2. 설정:
   - 실행 주체: 나 (스크립트 소유자)
   - 액세스: 모든 사용자
3. 배포 > URL 복사 > `.env`의 `BEYOND_GAS_WEB_URL`에 설정

## 5. 테스트

```bash
curl -X POST "YOUR_GAS_URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"read_all","sheet":"auth_admins","apiKey":"YOUR_API_KEY"}'
```
