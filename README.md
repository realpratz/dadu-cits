### 1. Prerequisites
Install node.js and docker

### 2. Environment Variables
Create a `.env` file in the root directory and add the following secrets:
```text
DATABASE_URL=postgresql://postgres:daduadmin@localhost:5432/postgres
PORT=3000
ACCESS_TOKEN_SECRET=some secret token here
REFRESH_TOKEN_SECRET=yet another secret token here
REFRESH_TOKEN_SECRET=yet another secret token here
```

### 3. Steps
```text
docker run --name cits-db -e POSTGRES_PASSWORD=daduadmin -p 5432:5432 -d postgres
```
```text
docker exec -i cits-db psql -U postgres -d postgres < schema.sql
```
```text
npm install express pg bcrypt jsonwebtoken cookie-parser dotenv
```
```text
node server.js
```

### 4. API
# Register a new Student
```text
curl -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-d '{"email": "student@college.edu", "password": "mypassword", "role": "STUDENT"}'
```
# Register a new Admin
```text
curl -X POST http://localhost:3000/api/auth/register \
-H "Content-Type: application/json" \
-d '{"email": "admin@college.edu", "password": "supersecret", "role": "ADMIN"}'
```
# Login
```text
curl -i -X POST http://localhost:3000/api/auth/login \
-H "Content-Type: application/json" \
-d '{"email": "student@college.edu", "password": "mypassword"}'
```
# Refresh Token
```text
curl -X POST http://localhost:3000/api/auth/refresh
```
# Logout
```text
curl -X POST http://localhost:3000/api/auth/logout
```
# 2. STUDENT ROUTES 

# Create a new ticket (Replace <YOUR_TOKEN> with the actual accessToken)
```text
curl -X POST http://localhost:3000/api/tickets \
-H "Content-Type: application/json" \
-H "Authorization: Bearer <YOUR_TOKEN>" \
-d '{"title": "Broken AC", "description": "The AC in room 104 is leaking water."}'
```

# View my tickets
```text
curl -X GET http://localhost:3000/api/tickets \
-H "Authorization: Bearer <YOUR_TOKEN>"
```

# 3. ADMIN ROUTES 

# View EVERY ticket in the system
```text
curl -X GET http://localhost:3000/api/admin/tickets \
-H "Authorization: Bearer <ADMIN_TOKEN>"
```

# Update a ticket's status (Replace <TICKET_ID> with the actual UUID)
# Allowed statuses: OPEN, IN_PROGRESS, RESOLVED
```text
curl -X PATCH http://localhost:3000/api/admin/tickets/<TICKET_ID>/status \
-H "Content-Type: application/json" \
-H "Authorization: Bearer <ADMIN_TOKEN>" \
-d '{"status": "IN_PROGRESS"}'
```
