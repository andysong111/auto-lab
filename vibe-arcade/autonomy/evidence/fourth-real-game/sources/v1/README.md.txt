# Keywake

Keywake is an original deterministic three-room navigation puzzle. The coral explorer walks one stationary tile at a time: collect each room's brass keys, then enter its gold hatch. The third room rewards choosing the short key order.

## Controls

- Arrow keys: one tile per press.
- Touch: tap one of the four labeled canvas pad columns (LEFT, UP, RIGHT, DOWN).
- Start, Pause, Resume, and Replay use the supplied GameKit lifecycle controls.

Every seed transforms each 3×3 room through rotations and a mirror while preserving its puzzle structure. Legal walking moves are counted for room-clear efficiency; only clearing a room awards score. Replay resets the same deterministic seed through GameKit. Device best is displayed from GameKit's device-local practice state.

The game has no account, network service, external assets, or sound. Reduced-motion preference is observed live: travel interpolation becomes a clear static destination outline.
