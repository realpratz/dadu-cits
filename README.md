### 1. Prerequisites
Install node.js and docker

### 2. Environment Variables
Create a `.env` file in the root directory and add the following secrets:
```text
DATABASE_URL=postgresql://postgres:daduadmin@localhost:5432/postgres
PORT=3000
ACCESS_TOKEN_SECRET=some secret token here
REFRESH_TOKEN_SECRET=yet another secret token here
