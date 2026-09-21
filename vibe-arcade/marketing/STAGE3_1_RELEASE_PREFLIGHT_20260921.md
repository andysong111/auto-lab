# LoopJolt 마케팅 3-1 — 발행 전 준비 체크포인트

기준일: 2026-09-21. **3-1 기술 준비 완료. 실제 SNS 프로필 링크 확인과 첫 공개 승인 대기.** 3구간 전체의 공개/플랫폼 검수까지 완료된 상태가 아니다.

이번 작업에서 SNS 공개·예약·Metricool 초안 생성·기존 초안 수정·유료 광고/생성은 하지 않았다. Option A 로그인·비밀번호·국가 정책·게임 규칙·서버 점수 검증·DB는 변경하지 않았다.

## 1. 실제 계정 및 기존 대기분

Metricool 브랜드 7005118 / Asia/Seoul을 읽었다. Instagram과 Threads는 `playloopjolt`, TikTok은 `loopjolt2`, YouTube는 `UCKl5Kh2Nju1C67mBBcVb7Mw` / `LoopJolt`다. 내부 브랜드 이름은 `steb_by_foot`이다. Facebook 반환 이름 `andy80101.1`이 의도한 게임 브랜드 페이지인지는 미확인이라 신규 후보에서 제외했다. 계정 재연결/이름 변경은 하지 않았다.

9월 20일~10월 21일 조회(extendedRange=true)에서 대기 15건은 모두 `draft=true`, `autoPublish=false`였다. 그대로 두었다. 과거 PUBLISHED 항목은 신규 예약이나 현재 영상 재생 품질의 증거로 세지 않았다. 특히 과거 Deep Descent 게시물은 이번 Publish_v1 파일이 아니다.

주의: `autoPublish=false`만으로는 보류가 아니며 수동 게시 알림 방식이다. 초안 보류에는 `draft=true`가 필요하다. 이번 12개 후보는 API로 보내지 않은 로컬 설정안이다.

## 2. 승인 검토본 보존 및 게시용 파생본

세 Review_v1의 SHA-256이 2구간 manifest와 일치하는 것을 확인했고, 원본은 변경하지 않았다. 기존 MP4 edit list를 제거하는 별도 Publish_v1을 만들었다. 장면·자막·플레이 속도는 유지했다. 정지된 원본을 재인코딩으로 고쳤다는 주장이 아니다.

| 게임 | 게시용 파일 | bytes | 전체 프레임 SSIM |
|---|---|---:|---:|
| Deep Descent | LoopJolt_DeepDescent_Publish_v1.mp4 | 10880135 | 0.997378 |
| Core Pins | LoopJolt_CorePins_Publish_v1.mp4 | 1821883 | 0.999666 |
| Nova Merge | LoopJolt_NovaMerge_Publish_v1.mp4 | 1391338 | 0.999548 |

공통: H.264 progressive/yuv420p, 1080×1920, 30fps, 영상 18.000초/540프레임. Closed GOP, B-frame 0, moov가 mdat보다 앞, edit list 없음. AAC 48kHz stereo/인코더 목표 128kbps이며 평균 비트레이트는 무음에 따라 달라진다. 오디오 패딩으로 컨테이너 길이는 18.005333초다. 초기 1024샘플 인코더 지연을 보정했다.

각 파일 전체 디코딩 오류 0. 실제 1배속 자동 재생은 세 파일 모두 종료 도달, 각 540프레임/누락 0/대기 및 정지 이벤트 0이었다. 처음 일괄 프로세스는 첫 파일 이후 실행 제한에 걸렸고, 나머지 두 파일을 개별 프로세스로 다시 검사해 통과했다. 물체 영역의 0.60초 정지 검사 및 Core Pins/Nova Merge 픽셀 상태 검사도 통과했다. 이전 2구간의 결함 주입 6건을 이번 파생본에서 새로 실행했다고 주장하지 않는다.

0/25/50/75/100% 프레임, 세 표지의 1:1·3:4·4:5 중앙 크롭을 시각 점검했다. 이는 파일 기반 모의 크롭이며 실제 SNS/Metricool 앱 미리보기의 검증은 아니다. 자동 1배속 재생도 사람의 재미 승인과 다르다.

## 3. 채널별 문구 및 설정안

세 게임 × Instagram/YouTube/TikTok/Threads = 12개 후보를 준비했다. 예약 시각, 미디어 호스팅 URL, 외부 게시물 ID는 없다. Facebook은 포함하지 않았다. 모든 후보는 자동화 연습 영상이지 실제 국가 기록이 아님을 명시하고, 무계정 무료 체험과 16+ 랭크 참여를 구분한다.

YouTube Shorts 설명/댓글의 외부 URL은 클릭되지 않아 채널 프로필 링크를 주 안내로 사용한다. TikTok 문구에 Instagram의 `@playloopjolt`를 잘못 붙이지 않는다. Instagram/TikTok의 프로필 링크 유무를 확인한 뒤 링크 안내를 사용한다. Threads는 본문에 게임별 추적 URL을 넣는다.

Instagram 표지는 준비된 JPEG를 연결하는 계획이다. YouTube/TikTok 사용자 지정 표지는 채널의 허용 기능과 연결 유형이 미확인이므로 관련 API 필드를 넣지 않았다. Threads에도 지원되지 않는 사용자 지정 표지 필드를 넣지 않았다.

## 4. 실제 수정 및 운영 확인

발견한 두 측정 오류만 PR #26에서 수정했다.

- 홈의 Deep Descent 클릭이 `orbit-sprint`로 기록되던 것을 `gyro-drop`으로 보정했다.
- 게임에서 이미 보내는 `score_verified`, `ranked_downgrade`를 이벤트 수집기가 거절하던 문제를 수정했다.

기존 이벤트 허용, 모르는 이벤트 거부, 네 게임 카드 식별, 페이지 이동 시 채널 정보 유지, 새 캠페인 진입 시 이전 content 제거, capture 환경 제외 등 **14개 계약 시험**이 로컬/CI에서 통과했다. 여섯 PR 워크플로도 통과한 뒤 `ccc8de4bb27aa01a3cfe266e37bf6b529e02638c`로 main에 병합했다.

Vercel 배포 `AuuCKuYA4mCT8QZJmace62qsiVZH` SUCCESS. 운영 읽기 전용 검수 run `35548516806`, artifact `10617791067` SUCCESS. 2026-09-21T00:42:16.712Z 기준 결과:

- `/ig`, `/yt`, `/tt`, `/th`, `/fb` 다섯 경로가 올바른 채널/medium=profile/campaign=alwayson을 유지하며 홈 HTTP 200에 도달.
- Deep Descent/Core Pins/Nova Merge 세 직접 링크도 콘텐츠 추적값을 유지하며 HTTP 200에 도달.
- 운영 home.js/telemetry.js/community/client.js의 SHA-256 세 개가 검토 소스와 일치.
- public config의 playIdReady/loginReady 모두 true.

검수 중 새 계정·랭킹 점수·분석 이벤트를 제출하지 않았다. 이벤트 API는 계약 시험 및 배포 성공으로 확인했으며 가짜 score_verified를 프로덕션에 POST하지 않았다. 클라이언트 이벤트는 관측 로그일 뿐 서버가 검증한 국가 점수의 대체물이 아니다. 저장 경로는 기존 Vercel 로그이며 장기 분석 DB/가입 전환 대시보드를 새로 만들지 않았다.

프로필용 공통 링크는 채널 유입만 식별한다. 개별 영상 전환으로 환산하지 않는다. Threads 직접 링크의 campaign은 `flag_challenge_pilot_20260920`, medium은 `organic_social`, content는 dd_fc01/cp_fc01/nm_fc01이다.

## 5. 남은 실제 확인과 승인 범위

연결 계정 이름, 사이트의 리다이렉트 성공, SNS 화면의 실제 website/link 필드는 서로 다른 증거다. Metricool 도구에서 실제 링크 필드는 제공되지 않았다. 공개 프로필 HTTP 200이나 YouTube HTML의 기본 도메인 발견도 추적된 프로필 링크가 실제로 설정됐다는 증거가 아니다. 따라서 네 채널의 native profile website 확인은 모두 false다.

**첫 공개 후보는 Instagram @playloopjolt의 Deep Descent 한 편이다.** 승준에게는 이 계정 프로필에 `https://vibe-arcade-dun.vercel.app/ig`가 실제 걸려 있는지와, 이 한 편을 공개해도 되는지 확인받는다. 필요하면 프로필 링크가 보이는 화면으로 확인한다.

그다음 미디어 호스팅/초안 연결 → 호스팅된 파일 재검수 → 승인된 한 편 공개 → 실제 플랫폼 변환본 재생 확인 순서다. 호스팅 복사본·플랫폼 미리보기·공개 변환본은 아직 검증하지 않았다. 나머지 11개 후보 자동 공개나 기존 15개 초안 재개는 포함되지 않는다. 새 비용·계정 권한 변경이 필요할 때만 추가로 묻는다.

## 자료 및 공식 참고

동봉 패키지: 세 Publish_v1/세 JPEG, 12개 정확한 후보 문구와 설정, 파일 QA, 실제 리다이렉트 보고서, 검증 코드. 동영상/폰트 바이너리는 이 저장소에 추가하지 않았다. 폰트 파일은 사용자 패키지에도 없다.

- YouTube 링크: https://support.google.com/youtube/answer/13748639?hl=en
- Metricool Reels 규격: https://help.metricool.com/schedule-and-post-on-instagram-6b6q5
- 표지 조건: https://help.metricool.com/how-to-add-a-cover-thumbnail-to-your-posts-jabtw

외부 공개·예약 권한은 계속 false다. 로컬 검증 통과는 외부 앱의 권한 시스템이나 공개 승인 대체물이 아니다.
