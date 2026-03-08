---
title: "Mistakes & Lessons Log"
module: "general"
date: "2026-03-06"
status: "in-progress"
related_features: []
---

# Mistakes & Lessons Log

> This file is maintained by Claude. Re-read before every task to avoid repeating errors.

<!-- Log entries go below in reverse chronological order -->

### 2026-03-08 — PrimeNG ToggleSwitch module name casing
- **What happened:** PrimeNG MCP tool returned `ToggleswitchModule` but Angular build failed with "Did you mean 'ToggleSwitchModule'?"
- **Root cause:** The MCP tool documentation had incorrect casing. The actual export is `ToggleSwitchModule` (PascalCase).
- **Fix:** Changed import to `ToggleSwitchModule` from `primeng/toggleswitch`.
- **Prevention:** Always verify PrimeNG module export names against actual build output. MCP tool may have casing differences.
