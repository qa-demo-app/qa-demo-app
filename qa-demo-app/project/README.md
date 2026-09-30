# Nivi's QA Automation Playground

React + TypeScript front end, Express REST API with Swagger, WebSocket echo server, Playwright tests, Docker and GitHub Actions.

## Action Items
1. Login – valid/invalid login, validation, remember me (`#/login`)
2. Register – positive/negative validations (`#/register`)
3. Products – search, filter, sort, pagination, details modal (`#/products`)
4. Cart & Checkout – add/remove/update qty, address, payment, confirmation (`#/cart`)
5. Forms Playground – textbox, dropdown, checkbox, radio, date, slider, textarea (`#/forms`)
6. Tables – search, sort, filter, pagination, edit/delete (`#/tables`)
7. Alerts – alert, confirm, prompt (`#/alerts`)
8. Frames – iframe and nested iframe (`#/frames`)
9. Windows/Tabs – popup and new tabs (`#/windows`)
10. File Upload – single/multiple (`#/upload`)
11. Drag & Drop – sortable list (`#/drag`)
12. Mouse & Keyboard – hover, right-click, double-click, key events (`#/mouse`)
13. API Playground – GET/POST/PUT/PATCH/DELETE (`#/api`)
14. Network Testing – 200/400/401/403/404/500, slow, mocking (`#/network`)
15. Authentication – login, logout, token handling (`#/auth`)
16. WebSocket – send/receive (`#/websocket`)
17. Error Pages – 404, 500, loading, empty (`#/errors`)

## Setup
```bash
npm install
npx playwright install chromium
npm run dev          # UI http://localhost:5173, API http://localhost:3001
npm test             # builds, starts server on :3001, runs 30 scenarios
docker compose up --build   # everything on http://localhost:3001
```
Swagger UI: http://localhost:3001/api-docs

## Test credentials
| Role | Email | Password |
|---|---|---|
| User | qa.tester@nivi.dev | Test@1234 |
| Admin | admin@nivi.dev | Admin@1234 |

Test card: `4111111111111111`. Valid ZIP: 5 digits (e.g. `600001`).

## Playwright scenarios (tests/playground.spec.ts)
S01 valid login · S02 invalid login · S03 empty validation · S04 register mismatch · S05 search+sort · S06 pagination · S07 cart→checkout · S08 table delete · S09 alert/confirm/prompt · S10 nested iframe · S11 new tab · S12 multi upload · S13 drag & drop · S14 hover/right/double click · S15 keyboard · S16 API POST via UI · S17 `page.route` mocking · S18 500/404 · S19 401/403 API · S20 CRUD API · S21 WebSocket · S22 404 page · S23 loading/500 states · S24 forms · S25 remember me · S26 expired token · S27 slow response · S28 empty search · S29 details modal · S30 duplicate register (409)

## Selenium
Same `data-testid` selectors work: `driver.findElement(By.css('[data-testid="login-submit"]'))`. Use `http://localhost:3001` as base URL.

## Notes
API data is in-memory; `POST /api/reset` resets items. Sessions are in-memory tokens (reset on server restart).
