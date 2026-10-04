# PromisePocket — MongoDB Atlas Configuration Guide

PromisePocket uses **MongoDB Atlas** for its multi-tenant, cloud-persistent document memory.

---

## 1. Creating a MongoDB Atlas Cluster
1. Sign in to [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a free shared cluster (M0) in your preferred region.
3. Under **Security > Database Access**:
   - Create a database user (e.g. `promisepocket_app`).
   - Grant `Read and write to any database` or restrict to `promisepocket`.
   - Store the password securely.
4. Under **Security > Network Access**:
   - Add IP Access List entry `0.0.0.0/0` (for Render or cloud deployments) or add your current local IP.

---

## 2. Retrieving Connection String
1. In your Atlas dashboard, click **Connect**.
2. Select **Drivers** (Python 3.11+).
3. Copy the standard connection string format:
   ```
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```

---

## 3. Configuring the Application
In `backend/.env`:
```ini
MONGODB_URI=mongodb+srv://promisepocket_app:YOUR_PASSWORD@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE=promisepocket
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000
```

---

## 4. Automatic Indexing
When the FastAPI application boots up with a valid `MONGODB_URI`, `app/core/database.py` automatically initializes compound indexes:
- `db.commitments.create_index([("user_id", 1), ("status", 1)])`
- `db.commitments.create_index([("user_id", 1), ("due_at", 1)])`
- `db.commitments.create_index([("user_id", 1), ("person_id", 1)])`
- `db.commitments.create_index([("title", "text"), ("description", "text")])`
- `db.people.create_index([("user_id", 1), ("name", 1)])`
- `db.users.create_index([("email", 1)], unique=True)`
- `db.reminders.create_index([("scheduled_at", 1), ("status", 1)])`
- `db.notifications.create_index([("user_id", 1), ("read_at", 1)])`

---

## 5. Development Fallback
If `MONGODB_URI` is left blank, the application automatically runs in in-memory repository mode with zero errors, making offline development and testing completely seamless.
