# Self-Hosted Media Streaming Platform

A private, self-hosted video-sharing platform built for sharing movies and videos with friends — Netflix-style.

## Features

### Video Streaming
- Stream videos directly from the browser with full seek support (HTTP Range requests)
- Works with local storage or MinIO object storage
- Upload videos via the [TUS protocol](https://tus.io/) for resumable, chunked uploads — safe on slow or unstable connections
- Supported formats: `.mp4`, `.mkv`, `.avi`

### Authentication & Authorization
- JWT-based authentication (token in header or `?token=` query param for HTML5 video players)
- Role-based access control: `ADMIN` and `USER` roles
- Login rate limiting (10 attempts per minute per IP)

### Media Management (Admin)
- Upload, update metadata (title, IMDB link), and delete media
- Attach screenshot captures to any media entry for a visual browsing experience

### Movie Requests
- Users can submit movie/show requests with optional comments
- Admins manage request status: `PENDING` → `IN_PROGRESS` → `COMPLETED` / `REJECTED`
- Requests can be linked to the actual media once it's been added

### User Management (Admin)
- Create, update, and delete users
- Assign and revoke roles per user

---

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | NestJS, TypeORM, MySQL |
| Frontend | React 18, Vite, Tailwind CSS |
| Auth | Passport.js + JWT |
| Uploads | TUS Server + TUS.js client |
| Storage | Local filesystem or MinIO |

---

## Storage: Local vs MinIO

The app supports two storage backends, switchable per upload via the `storageType` field.

### Local storage
Files are saved to the directory defined by `STORE_PATH`. Simple to set up, no external dependencies.

### MinIO object storage
[MinIO](https://min.io/) is a self-hosted S3-compatible object store. It's the recommended option for larger deployments since it offloads disk I/O, scales independently, and enables direct client streaming via presigned URLs.

When `storageType: "minio"` is used:
1. The file is received via TUS and temporarily saved locally
2. It's uploaded to MinIO and the local copy is deleted
3. Streams are served either by proxying through the API or via a presigned URL for direct client access

MinIO also supports multipart uploads for very large files: the client gets a presigned URL per chunk and assembles them server-side.

---

## Configuration

### Server (`server/.env`)

```env
# App
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_DATABASE=dumbassfriendflix

# Storage (local — absolute path, directory must exist)
STORE_PATH=/absolute/path/to/storage

# JWT
JWT_SECRET=change-this-to-a-long-random-secret
JWT_EXPIRES_IN=7d

# MinIO (only required when uploading with storageType=minio)
# MINIO_HOST must include the protocol (http:// or https://)
MINIO_USER=your-minio-access-key
MINIO_PASSWORD=your-minio-secret-key
MINIO_HOST=http://your-minio-host
MINIO_PORT=9000
MINIO_BUCKET=your-bucket-name
```

### Client (`client/.env`)

```env
# For development, leave as /api/v1 — Vite's proxy handles routing
VITE_API_URL=/api/v1

# Backend URL used by Vite's dev proxy
VITE_BACKEND_URL=http://localhost:3000
```

---

## IPv4 / IPv6 Proxy Support

`VITE_BACKEND_URL` and `MINIO_HOST` both accept either an IPv4 or IPv6 address, which matters in environments where only one protocol is reachable (e.g., a home server, a VPN, or a host that resolves `localhost` to `::1` instead of `127.0.0.1`).

Use IPv4 explicitly:
```env
VITE_BACKEND_URL=http://127.0.0.1:3000
MINIO_HOST=http://127.0.0.1
```

Or IPv6:
```env
VITE_BACKEND_URL=http://[::1]:3000
MINIO_HOST=http://[::1]
```

This is particularly useful when the backend or MinIO instance is only reachable on one stack, or when running behind a proxy that listens on a specific address family.

---

## Running the project

### Backend

```bash
cd server
npm install
npm run start:dev
```

### Frontend

```bash
cd client
npm install
npm run dev
```

### Verify MinIO connectivity

```bash
node server/check-minio.js
```

---

## API

Base URL: `/api/v1`

| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/auth/login` | Login | — |
| GET | `/auth/me` | Current user | User |
| GET | `/media/list` | Browse media | User |
| GET | `/media/:id/stream` | Stream video | User |
| GET | `/media/:id/presign-stream` | Get presigned stream URL | User |
| GET | `/media/:id/captures` | Get screenshot captures | User |
| POST | `/media/tus/*` | Upload via TUS | Admin |
| PATCH | `/media/:id` | Update metadata | Admin |
| DELETE | `/media/:id` | Delete media | Admin |
| GET | `/requests` | List requests | User |
| POST | `/requests` | Submit a request | User |
| PATCH | `/requests/:id` | Update request status | Admin |
| GET | `/users` | List users | Admin |
| POST | `/users` | Create user | Admin |
| PATCH | `/users/:id` | Update user | Admin |
| DELETE | `/users/:id` | Delete user | Admin |
