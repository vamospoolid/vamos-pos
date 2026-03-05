# Vamos POS Backend API Documentation

## Authentication Routes

`POST /api/auth/login`
- **Body**: `{ email, password }`
- **Response**: `{ user, token }`

## Session Engine

`POST /api/sessions/start`
- **Headers**: Authorization
- **Body**: `{ tableId, packageId (optional) }`
- **Response**: Session Object
- **Role**: KASIR, ADMIN

`POST /api/sessions/end/:id`
- **Headers**: Authorization
- **Response**: `{ sessionId, tableAmount, totalAmount }`
- **Role**: KASIR, ADMIN

`POST /api/sessions/pending`
- **Headers**: Authorization
- **Body**: `{ id: "session_uuid" }`
- **Response**: `{ success: true }`
- **Role**: KASIR, ADMIN

`POST /api/sessions/:id/pay`
- **Headers**: Authorization
- **Body**: `{ method: "CASH" | "QRIS" }`
- **Response**: Payment Object
- **Role**: KASIR, ADMIN

`GET /api/sessions/active`
- **Headers**: Authorization
- **Response**: Array of Active Sessions
- **Role**: KASIR, ADMIN, OWNER

`GET /api/sessions/pending`
- **Headers**: Authorization
- **Response**: Array of Pending Sessions
- **Role**: KASIR, ADMIN, OWNER

## F&B Orders System

`POST /api/orders/sessions/:id`
- **Headers**: Authorization
- **Body**: `{ productId, quantity }`
- **Response**: Order Object
- **Role**: KASIR, ADMIN

`DELETE /api/orders/:id`
- **Headers**: Authorization
- **Response**: `{ success: true }`
- **Role**: KASIR, ADMIN

## Match & Leaderboard

`POST /api/matches`
- **Headers**: Authorization
- **Body**: `{ sessionId, memberIds: [uuid], winnerId: uuid | null }`
- **Response**: Match Object
- **Role**: KASIR, ADMIN

`GET /api/matches/leaderboard`
- **Headers**: Authorization
- **Response**: Array of Members sorted by win_rate
- **Role**: KASIR, ADMIN, OWNER

## Relay Control

`POST /api/relay/on`
- **Headers**: Authorization
- **Body**: `{ channel: number }`
- **Response**: `{ success: boolean, channel: number }`
- **Role**: KASIR, ADMIN

`POST /api/relay/off`
- **Headers**: Authorization
- **Body**: `{ channel: number }`
- **Response**: `{ success: boolean, channel: number }`
- **Role**: KASIR, ADMIN

## Reports

`GET /api/reports/daily-revenue?date=YYYY-MM-DD`
- **Headers**: Authorization
- **Response**: `{ date, revenue }`
- **Role**: ADMIN, OWNER

`GET /api/reports/table-utilization`
- **Headers**: Authorization
- **Response**: Array of Table Status
- **Role**: ADMIN, OWNER

`GET /api/reports/top-players`
- **Headers**: Authorization
- **Response**: Array of top members
- **Role**: ADMIN, OWNER
