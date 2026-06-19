# Agent Index - Cyber Defenders

File routing và guardrail cho `pvz-web` — browser-based tower defense game (Vanilla JS + HTML5 Canvas).

## Workspace

| Khu vực | Trách nhiệm |
| --- | --- |
| `index.html` | Entry point, 5 screens + game UI |
| `css/styles.css` | Dark terminal theme, responsive layout |
| `js/` | Toàn bộ game logic: config, state, entities, combat, waves, UI, screens, shop, almanac, main loop |
| `docs/` | Tài liệu thiết kế game (Game Design.md) |
| `plans/` | Lộ trình tính năng và implementation handoff |
| `loops/` | Queue, run records, execution evidence |
| `netlify.toml` | Deploy config Netlify |

Tech stack: Vanilla JS ES6+, HTML5 Canvas, Web Audio API, no build step, no framework.

## Always-On Guardrails

- Không commit secret: Netlify token, API key, personal data.
- Không tự commit, push, reset, đổi branch hoặc revert thay đổi của user nếu chưa được yêu cầu.
- Không xóa save data của người chơi trong `localStorage` nếu không có migration plan.
- Không thay đổi load order script trong `index.html` nếu chưa đọc `wiki/architecture.md` dependency order.
- Không thêm dependency npm/build tool nếu owner chưa đồng ý; project hiện no-build-step.
- Game balance (tower cost, HP, damage, coin economy) thay đổi cần ghi rõ trong plan/queue hoặc ADR.
- Không copy code có license không tương thích.

## Read Router

Luôn bắt đầu bằng `wiki/index.md`, sau đó chỉ đọc nhánh liên quan:

| Loại task | Đọc tiếp |
| --- | --- |
| Coding thông thường | `wiki/architecture.md`, `wiki/code-map.md`, `wiki/patterns.md` |
| Cross-cutting (game loop, render, save) | `wiki/architecture.md`, `wiki/conventions.md` |
| Tìm vị trí code | `wiki/code-map.md` |
| Balance / level / tower / threat | `docs/Game Design.md`, `wiki/conventions.md` |
| Tạo/cập nhật plan | `C:\Users\ADMIN\Documents\GitHub\loop-engineering\docs\skills\update-plan.md` |
| Tạo implementation handoff | `C:\Users\ADMIN\Documents\GitHub\loop-engineering\docs\skills\plan-feature-detail.md` |
| Thực thi plan/sub-agent | `C:\Users\ADMIN\Documents\GitHub\loop-engineering\loops\README.md`, execution brief, `loops/queue.json` |

Không đọc toàn bộ source tree hoặc toàn bộ plans theo mặc định.

## Completion Gate

- Chạy targeted checks (play test, screenshot test, lint nếu có) trước.
- Chạy `node C:\Users\ADMIN\Documents\GitHub\loop-engineering\scripts\verify-workspace.mjs` khi thay đổi tài liệu orchestration, queue, skill, wiki hoặc cấu trúc template.
- Cập nhật `wiki/code-map.md`, `wiki/coverage.md`, `wiki/log.md` khi trạng thái hệ thống thay đổi.
- Tạo ADR ở `wiki/decisions/` khi thay đổi game architecture, save format, hoặc module boundary.
