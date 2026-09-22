# Prism Relay

An original spatial optical-routing practice game. Route the amber emitter across four prism columns, through the visible amber gate rings, into the highlighted receiver.

## Controls

- Arrow keys or WASD select a prism; Space rotates it.
- Tap/click a prism to select and rotate it once.
- Sound On/Off controls restrained local procedural feedback.

## Deterministic rules

A session is 2700 fixed ticks (45 seconds). Each receiver needs a continuous 45-tick connection. The three boards use distinct receiver rows and visible gates; their required shortest rotation costs are 2, 4, and 6. Three charged receivers complete the relay (with a 15-second minimum session finish); otherwise the clock produces an incomplete result. Restart reproduces the supplied seed. No account, network service, analytics, or game-managed persistence is used.
