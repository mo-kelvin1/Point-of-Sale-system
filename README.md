# POS System

Two completely independent apps - run each in its own terminal.

```
pos-system/
  backend/        - Node.js + Express + Prisma + PostgreSQL
  pos-frontend/   - React + Vite
```

---

## Terminal 1 - Backend

```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```

Runs on: http://localhost:3000

---

## Terminal 2 - Frontend

```bash
cd pos-frontend
npm install
npm run dev
```

Runs on: http://localhost:5173

The frontend reads the backend URL from `pos-frontend/.env`:
```
VITE_API_URL=http://localhost:3000/api
```
Change that value if your backend runs on a different host or port.

---

## Default Login Credentials

| Role    | Username | Password   |
|---------|----------|------------|
| Admin   | admin    | admin123   |
| Manager | manager  | manager123 |
| Cashier | cashier  | cashier123 |

## Role Access

- Admin / Manager - Dashboard (products, inventory, customers, sales, reports, users)
- Cashier - Register + Sales History (all sales and their own sales)
