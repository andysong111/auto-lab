# Keywake Depth Polish — terminal handoff

**최종 상태: REJECTED.** GAME-20260923-141 / v6 / repair **5/5** / 실제 모델 호출 **6/6** / 남은 repair **0**. `production.authorized=false`. main merge 및 production publish 없음. 새 GAME ID 복제, rebuild, repair reset, 불확실한 호출 재시도 없음.

[검토용 v6 Preview](https://vibe-arcade-r5jpobhf6-a2bsangsa.vercel.app/autonomy/games/GAME-20260923-141/v6) · [후보 Draft PR #56](https://github.com/andysong111/auto-lab/pull/56) · [인프라/증거 Draft PR #58](https://github.com/andysong111/auto-lab/pull/58)

이 Preview는 **REJECTED 후보의 진단·검토용**이다. READY_TO_SHIP 또는 owner 승인 후보로 제시하지 않는다. Vercel 보호 설정은 유지됐다. 원래 v3 READY_TO_SHIP은 owner HOLD로 superseded 됐으며 부활시키지 않는다.

## 1. Owner feedback와 최종 판정

Owner의 v3 실제 플레이 피드백: **“게임이 너무 단순하고 너무 쉽다.”** 이를 `owner_difficulty_too_low` quality failure로 기록했다. v3의 3×3 방, 최단 2/4/6 이동, 동일 3개 template의 transform 중심 seed 구성을 교체했다.

v6는 실제 graph depth와 자동 QA 목표를 충족했다. 그러나 최종 화면 검토에서 **이동 가능한 통로와 인접 칸 사이의 막힌 벽이 구분되지 않는 결함**이 확인됐다. seed 1 / Room 1 / 시작 cell 5에서 위 cell 1은 막혀 있고 왼쪽 cell 4는 열려 있지만, 두 경계는 화면에서 같은 tile gap/border로 표시된다. 실제 Preview에서 native keyboard Up은 MOVES 0, Left는 MOVES 1이었다. 독립 layout 데이터와 실제 candidate source 데이터도 각각 absent [1,5], open [4,5,0]으로 일치한다.

`view/art.js`는 floor tiles와 key mask가 있는 gate 선만 그린다. mask 0 edge와 인접 floor 사이의 없는 edge를 구분해 표시하지 않는다. 이는 사전에 지정한 “distinct solid wall edges” 및 보고 경로를 계획하는 목표를 충족하지 못한다. 깊이가 커졌어도 길을 알아내기 위한 시행착오·암기에 의존하게 된다.

실패 코드 **`product_route_topology_not_visible`**를 실제 화면/소스 증거와 함께 intake했고, **변경하지 않은 Factory Quality Gate**가 repair 5/5를 확인해 `REJECT` → `REJECTED`로 전환했다. Work가 후보 source를 직접 고치거나 Gate PASS를 강제하지 않았다. 이 판정은 Work의 제품 검토이며, owner가 v6를 플레이했다는 주장이 아니다.

## 2. 버전별 경과

| 버전 / operation | 변경 | Technical | Generic Product | Quality / disposition |
|---|---|---|---|---|
| v3 / repair 2 | 기존 후보 | PASS | PASS | owner_difficulty_too_low → HOLD, 기존 READY superseded |
| v4 / repair 3 | 4×4, 18개 실제 room layout, key/gate/order, par·효율 점수, 새 화면 | PASS | FAIL: 3 viewport에서 key/gate A 글자 겹침 | REPAIR |
| v5 / repair 4 | 겹치는 key 글자를 text-free key silhouette로 수정 | PASS | PASS, 53 checks | 자동 PASS 후 화면에 NaN key counter 발견 → REPAIR |
| v6 / repair 5 | app.js에서 key 개수를 먼저 계산한 뒤 문자열 조합 | PASS | PASS, 53 checks | 자동 PASS 후 topology 시각 결함 → 최종 REJECT |

v5→v6 provider 변경은 app.js만이며 manifest는 Factory가 공급했다. core와 art는 동일하다. 마지막 repair 요청은 발견된 NaN counter를 수정하도록 보냈고, 통로/벽 문제는 이후 최종 시각 검토에서 확정됐다. 마지막 예산을 다시 열거나 다른 ID로 넘기지 않는다.

## 3. 실제 AI 호출·token·비용

모두 실제 OpenAI Responses provider **gpt-5.6-terra**, concurrency 1. 모든 operation COMPLETE, response ID와 원 요청·응답은 evidence에 보존됐다. 아래 금액은 provider usage × 기존 보수적 설정 단가의 **USD 추정치**이며 청구액 대조 결과는 아니다.

| Operation | Version | Input tokens | Output tokens | Estimated USD | Cumulative USD |
|---|---|---:|---:|---:|---:|
| build/v1 | v1 | 4,315 | 7,928 | 0.159964 | 0.159964 |
| repair/1 | v2 | 20,326 | 2,273 | 0.122218 | 0.282182 |
| repair/2 | v3 | 17,661 | 1,889 | 0.104646 | 0.386828 |
| repair/3 | v4 | 18,959 | 7,658 | 0.213680 | 0.600508 |
| repair/4 | v5 | 21,785 | 2,462 | 0.131456 | 0.731964 |
| repair/5 | v6 | 19,595 | 879 | 0.094202 | 0.826166 |
| **Lifetime total** | | **102,641** | **23,089** | **0.826166** | |

이번 Work의 추가 3회 비용은 **USD 0.439338**. 기존 lifetime max calls 6, max repairs 5, 설정 비용 한도 USD 2를 유지했다. 건당 50,000 KRW 이하 호출 일괄 승인 범위 내 기존 설정을 사용했고 별도 환율 추정은 하지 않았다.

`source-provenance.json`은 provider별 마지막 성공 응답과 실제 source 파일의 byte identity를 검증했다. candidate manual edits **0**. GameKit/manifest만 Factory 공급. operation ID, ledger, 원 started_at, 이전 token/cost/attempt는 그대로 유지했다.

원래 60분 실행 한도는 owner 검수를 기다린 시간 때문에 만료될 수 있었다. 신뢰 인프라에서 v3 READY 기록 시각부터 이번 owner-authorized 재개까지의 **종료된 검수 대기 구간만** 제외했다. 이전 active 시간 약 35분 41초는 유지했고 전체 active 한도 60분도 유지했다. 마지막 repair 재개에는 추가 pause를 적용하지 않았다. 열린/미래/중첩/미승인 pause는 fail-closed. 관련 provider·continuation·design 사전 테스트 **40개 PASS**.

## 4. Topology / generation / depth

모든 방은 4×4 bounded grid, cell=y×4+x, 시작 cell 5. 데이터 edge는 `[minCell,maxCell,requiredKeyMask]`; 없는 edge는 통과 불가. 영구 key bit A=1, B=2, C=4. gate mask를 충족해야 통과하며 모든 key를 얻어야 exit 진입이 가능하다. 출구에 들어가는 입력에서 즉시 다음 방으로 진행한다. 상태 공간은 seed당 95–107 nodes로 기존 128-node 한도 안이다. 모든 reachable oracle state에서 완료 경로가 존재한다.

- Room 1: key 1개 + conditional shortcut과 실제 우회 선택.
- Room 2: A/B 획득 순서에 따라 최적 경로 비용이 최소 4회 달라짐.
- Room 3: A/B 순서 + A+B 뒤에 접근하는 C + 여러 gate/route 조합. 잘못 선택한 key 순서는 최소 4회 추가 이동.
- 6 packs × 3 rooms의 18개 layout. 같은 stage의 6개 topology는 회전·미러를 제거한 canonical 비교에서도 서로 다르다. key/gate 위치와 최적 입력 순서도 다르다.
- 모든 uint32 seed에 bounded deterministic hash 적용: `h=Math.imul((seed>>>0)^(seed>>>16),1177)>>>0; pack=((h^(h>>>13))>>>0)%6`. 런타임 search나 seed별 예외 코드 없음. 실제 core.js의 18개 데이터 literal이 독립 reviewed design과 정확히 같음을 **실행 없이 데이터로** 대조했다.
- timer 40초 및 이동 방식 유지. HP·이동속도·점수 배율로 난이도를 대체하지 않았다.

| Seed | Pack | 최단 meaningful actions R1/R2/R3 | Consequential route decisions R1/R2/R3 | Room 2 key-order 비용 | Room 3 key-order 비용 | 실제 touch / keyboard |
|---:|---:|---|---|---|---|---|
| 1 | 1 | 7 / 12 / 15 | 3 / 4 / 7 | AB 12, BA 16 | ABC 19, BAC 15 | PASS / PASS |
| 7 | 0 | 8 / 10 / 14 | 3 / 4 / 10 | AB 14, BA 10 | ABC 14, BAC 18 | PASS / PASS |
| 23 | 2 | 8 / 10 / 14 | 3 / 4 / 6 | AB 10, BA 14 | ABC 14, BAC 18 | PASS / PASS |
| 89 | 5 | 8 / 10 / 15 | 3 / 4 / 5 | AB 14, BA 10 | ABC 19, BAC 15 | PASS / PASS |
| 2026 | 3 | 6 / 11 / 15 | 3 / 4 / 5 | AB 11, BA 15 | ABC 15, BAC 19 | PASS / PASS |
| 4294967295 | 4 | 7 / 12 / 15 | 3 / 4 / 7 | AB 16, BA 12 | ABC 19, BAC 15 | PASS / PASS |

Consequential decisions는 최단 경로 위에서 되돌아오는 즉시 역방향을 제외하고, 완료 가능한 대안의 remaining optimal cost가 달라지는 선택 상태 수다. 단순 복도 길이나 label 수가 아니다.

Generic Gate의 `complexity`는 **현재 즉시 가능한 방향 수**이므로 4방향 제어에서 5를 보고할 수 없다. entry complexity는 실제 2/3/4이고, room-wide consequential decision 3/4/5+와 명시적으로 구분했다. `meaningful_actions`는 legal move마다 1 증가, blocked는 0. `reversible_state_key`는 stage:cell:key_mask:outcome이다.

## 5. Oracle / QA의 범위

Generic Product Gate v1의 executable worker, contract validator, schema, quality policy를 그대로 사용했다. 신뢰된 product contract와 reviewed **data-only** `keywake-depth-v1.json` 및 registry approval만 추가했다. candidate-specific executable QA, 임의 Playwright solver, DOM mutation oracle 없음.

6 seed × 실제 touch/keyboard 2회에서 reviewed projection과 모든 관측 transition이 일치했다. 최단 경로 및 entry alternative-return probes를 실행했고 두 입력 방식의 deterministic trace hash가 같았다. 390×844, 768×1024, 1280×800 전체 product suite와 completion/replay/feedback/reduced-motion/practice-best가 PASS. final success→terminal latency는 모두 측정 0ms였다.

한계: key-order별 비용과 consequential decision 수는 독립 finite graph 계산이다. browser가 모든 key 순서와 모든 graph edge를 전수 실행한 것은 아니다. Generic Gate는 graph conformance, 지정 label/spacing 등을 검증하지만 **그 graph가 화면에 읽히는지까지 보증하지 않는다**. 그래서 NaN 보조 key label과 통로/벽 결함이 자동 PASS 뒤에 발견됐다. 이 공백을 숨기거나 Gate를 완화하지 않았다.

## 6. Scoring / replay / presentation

방 완료 시에만 `max(20,200-15*max(0,room_moves-par))`를 지급한다. 키·gate·blocked input·대기·왕복은 점수를 주지 않는다. 최적 완료는 600점, 전체 18 extra branch moves가 들어간 6-seed probe는 모든 seed/입력 방식에서 330점. declared reversible/no-progress probes는 score 0→0. GameKit same-seed Replay의 실제 초기화와 practice best 600 유지/reload가 검증됐다. Perfect route / Efficient route / Detour +N 결과 표시는 경로 개선 동기를 제공한다.

색상 key/gate, hatch locked/open state, 이동 trail, reduced-motion static feedback는 구현됐고 generic feedback 검증을 통과했다. 하지만 일반 통로/벽은 읽히지 않는다. v5의 key 글자 제거로 key는 색상 의존이며, 모든 요구 이벤트에 독립적인 명확한 badge가 구현됐다고 주장하지 않는다. 짧은 synthetic click/press 일부는 프레임 전에 해제되어 실제 이동 증거로 쓰지 않았다; native held keypress와 기존 Generic touch/keyboard traces를 근거로 사용했다.

## 7. Exact Preview / 최종 상태

- RC commit: `67623d8f6132e40f41208bde38776e89ce06c23d`
- Source SHA256: `b6d1cfe671f88687dc289aa0eb38dc3972d5de638b99175f78166f98403fd629`
- Vercel deployment: `dpl_5TzBx2bb4j9af5jbGfZvK5rmPNqb`, target null/Preview, exact commit 일치 및 READY 확인.
- RC CI: Factory contracts/browser/regression 포함 19 success, 1 intentionally skipped. `exact-rc-ci.json` 참조.
- 보호된 실제 Preview에서 Start, Pause/Resume, native direction input, key counter 및 화면을 확인했다. 기본 사용자 URL의 post-redirect 주소도 확인했다.
- **Release용 protected HTTP byte-identical smoke는 실행하지 않았다.** 최종 visual rejection이 먼저 확정돼 READY_TO_SHIP 진행을 중단했다. v5용 read-only verifier는 grant를 전달하지 않아 실행 결과가 release 증거가 아니며, provider 호출은 없다.
- Final Technical QA **PASS** / Generic Product QA **PASS** / aggregate QA **FAIL** / Quality Gate **REJECT** / Factory **REJECTED**. 원래 자동 PASS 보고서는 `*-before-visual-review.json`에 보존했다.
- Owner review: v3 HOLD 근거 유지. v6는 Work 검토에서 reject되어 승인 요청 대상이 아님.
- 최종 main: `feeed4ffde39872714f473803a0158ba3700fb08` — 시작 시와 동일. production.authorized=false. Production/marketing kill switches 유지. main merge, production publish, 홈페이지 등록 없음.

## 8. 증거 / 복구 지점

모든 영구 증거는 [evidence/keywake-depth-polish](evidence/keywake-depth-polish)에 있다.

- `terminal-disposition.json`, `manifest.json`, `commissioning-summary.json`, `release-review-packet.json`, `control-plane/`.
- `provider-ledger.json`, `provider-requests/`, `repair-3/4/5.json`, 각 버전 `build.json`, `source-provenance.json`, source/v4/v5/v6.
- `owner-depth/`: v3 원 manifest/spec/ledger, owner authorization·contract supersession, v5 NaN review, v6 visual review와 browser screenshots.
- `v4/`, `v5/`, `v6/`: Technical/Product/combined QA, quality 판정, artifact index, mobile/desktop screenshots와 gameplay WebM.
- [v6 mobile 화면](evidence/keywake-depth-polish/v6/product/product-390-entry.png), [Room 2](evidence/keywake-depth-polish/v6/product/product-390-midgame.png), [gameplay WebM](evidence/keywake-depth-polish/v6/product/product-390-gameplay.webm), [실제 Preview](evidence/keywake-depth-polish/owner-depth/keywake-v6-preview.jpg), [막힌 위쪽](evidence/keywake-depth-polish/owner-depth/keywake-v6-route-up-blocked.jpg), [열린 왼쪽](evidence/keywake-depth-polish/owner-depth/keywake-v6-route-left-settled.jpg).
- `depth-evidence.json`, `preview-deployment.json`, `exact-rc-ci.json`, 실행 로그 2개. 대용량 원본 checkpoint는 GitHub artifact에도 있으며 만료 30일이므로 repository 증거를 우선한다.

| Checkpoint | Run / artifact | ZIP SHA256 |
|---|---|---|
| 원 v3 | run 35809197340 / 10729540989 | 6c02775dde2bbd2e906e375f7dd6b3ca88254e0064c9703709f75b2c67288157 |
| v4·v5 후 | run 35816222816 / 10731172803 | 91bce4fb95cb3ccc49e2bd971ff70930708b2c259b53f70398f9cc5939ed7254 |
| v6 자동 QA 후 | run 35817107828 / 10731724355 | 033e9f7e4cc6d657582323875afb8606a26a71265b20b4964cce1902ab8ebdaa |

원본 artifact는 자동 RC_READY 시점이며 최종 REJECTED 상태는 이 handoff와 repository의 terminal evidence가 권위 있는 후속 기록이다. 로컬 RC transport가 exit 0으로 종료된 뒤 남은 host-scoped stale lock은 종료 증거를 보존하고 정리했다. 소스/ledger는 변경되지 않았으며 추가 provider 호출은 0이다.

## 9. 남은 약점과 재개 금지

핵심 미해결 결함은 통로/벽의 시각적 구분이다. 6개의 고정 pack은 무한 생성이 아니며 숙련 후 암기될 수 있다. 실제 재미·체감 난이도·장기 replay 동기는 owner/player 검증이 없다. 색상 의존과 별도 이벤트 feedback 완성도도 한계다.

**이 GAME ID의 남은 repair/call 예산은 0이다.** 같은 후보를 새 ID로 복제하거나 repair budget을 초기화하거나 v3 READY를 재사용해 release하면 안 된다. 요청된 실패 조건에 따라 종료했다.
