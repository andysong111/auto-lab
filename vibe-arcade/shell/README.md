# Game Shell v1 — Stage 2-2

## What is reusable
`core.js` mounts a declarative slot map onto **existing static HTML**. Entry choices, common button actions, HUD fields/meters, pause/resume panels, result modal, public identity labels and save-status presentation no longer live in a game controller. No framework, production dependency or new CSS is introduced. Static HTML is deliberate: keep the entry visible while scripts load, preserve the existing design, and let each game choose its own layout.

`descent/shell.js` is the first game adapter. It maps rings/shields/energy, badge/reason copy and the existing DOM to the common interface. Game-specific artwork and rules are not absorbed into the shell. A differently shaped puzzle fixture exercises the same shell in tests; no second production game is migrated yet.

## Boundaries
- **Runtime 2-1** owns platform/config/profile/start/finish/retry/board requests and current-generation checks. Existing Community owns credentials.
- **Game** owns canonical state, timing, input rules, pause-to-practice eligibility, audio/FX and local-best storage.
- **Adapter** turns game state into presentation values and copy.
- **Shell** applies safe text/property updates and forwards semantic button actions. It has no fetch, storage, telemetry, credential, Phaser or game-rule dependency. Showing `verified` is not verification: only a current Runtime response can supply that presentation.

## Mount contract
Pass `host`, `slots`, optional `fields`/`meters`, `labels`, `classes`, and `onAction`. Configured selectors must exist; absent optional roles are not required. Required roles are `entry`, `paused`, native `result` dialog, `practice`, `ranked`, `replay`, and `dismiss`. Mount at most one shell per host; call `destroy()` before remounting. Two different hosts are isolated.

```js
const ui = LoopJoltGameShell.create({
  host: document.querySelector('.my-game'),
  slots: {entry:'.entry', paused:'.paused', result:'dialog',
    practice:'.practice', ranked:'.ranked', replay:'.replay', dismiss:'.dismiss'},
  fields: {score:'.score', moves:'.moves'},
  onAction: action => controller.handle(action)
});
ui.controls({ready:true, busy:false, eligible:true, hasPlayer:false});
ui.text({score:0, moves:4}); // textContent, not innerHTML
ui.show('playing'); // presentation only; does not start/pause game time
ui.result({parts:[{text:'1,200'}, {text:'pts',tag:'span'}],
  values:{score:1200}, replayLabel:'Play again',
  save:{state:'practice', message:'Local record only'}});
ui.destroy();
```

Optional role methods include `identity`, `meter`, `attribute` (small aria allowlist), `actionState`, `save`, `dismiss`. Details and navigation links remain static native HTML; this preserves normal link/keyboard behavior and requires no router. The shell forwards practice/ranked/pause/resume/replay/retry/sound/motion/dismiss events. It does not automatically request a score, grant ranked eligibility or retry the network.

## Dialog lifecycle
Native modal focus handling is retained. Close button, Escape/mobile close request and programmatic close reveal the entry exactly once. A replay moves presentation to `transition` **before** calling close, so the queued close event cannot reset the new run. A newer already-open result ignores an older queued close. Destroy removes listeners and closes the owned modal without dispatching game actions.

The controller's failed ranked replay now restores the entry and its retry/practice choices. This is a narrow recovery fix: ordinary entry/gameplay/result copy and layout remain the same. Pause/hidden-tab downgrade and 2-1 stale-save protection remain in the game and Runtime.

## Evidence / exclusions
Locally: 38 DOM/lifecycle fixture checks, Runtime41, Descent22, existing four-width full browser suite, replay-failure/Escape integration, all 48 rings and six guardian seals. Six desktop/mobile paired entry/play/result screenshots have zero changed pixels with identical game state, DOM fields and outbound mock request payloads. The CI parity check is limited to this extraction PR's actual base, not a frozen baseline for all future game development.

No other production game, rules/physics, renderer, art, audio, CSS, Runtime2-1, Community, DB/Edge/OAuth, pinned package, domain, social schedule or paid service change. No live account/score is fabricated. Mocked authenticated tests are not a real Google-account E2E. Future production-time savings remain unmeasured until Stage 2-4.

## Reference behavior
Native dialog close/cancel: https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement
Listener cleanup: https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener

## Next
Stop at 2-2 after CI/review and Production confirmation in PR20. Stage2-3 Feel Kit is not part of this change. Roll back via PR revert or previous Vercel deployment; no DB rollback needed.
