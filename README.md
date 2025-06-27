# dZENcode Comments - SPA Application

## Project Description

SPA application for managing comments with cascading display, file uploads, and real-time updates.

## Main Features

### User Features
- ✅ Add comments with validation
- ✅ Cascading display of comments (replies to comments)
- ✅ Upload images (JPG, GIF, PNG) with automatic resizing to 320x240
- ✅ Upload text files (TXT) up to 100KB
- ✅ Message preview without page reload
- ✅ HTML tag panel for text formatting
- ✅ CAPTCHA protection

### Technical Features
- ✅ Sort comments by User Name, Email, date
- ✅ Pagination (25 comments per page)
- ✅ Protection against XSS attacks and SQL injections
- ✅ Real-time updates via WebSocket
- ✅ JWT authentication
- ✅ Caching and queues
- ✅ Docker containerization

## Architecture

### Backend (Django)
- **Django 4.2** - main framework
- **Django REST Framework** - API
- **PostgreSQL** - database
- **Channels** - WebSocket support
- **JWT** - authentication

### Frontend (React)
- **React 18** - UI library
- **Axios** - HTTP client
- **Socket.io** - WebSocket client

### DevOps
- **Docker** - containerization
- **Uvicorn** - ASGI server

## Quick Start

### Requirements
- Docker
- Git

### Installation and Launch

1. Clone the repository:
```bash
git clone git@github.com:DenisIschenko/dzencode_comments.git
cd dzencode_comments
```

2. Create file with envariament files:
```bash
cp backend/.env_example backend/.env
```
and describe in ```backend/.env``` value for variables
or alternativly describe variables in the system using ```export```

3. Build and start the application:
```bash
docker build --tag 'comments' .
docker run -p 8000:8000 comments
```

4. Create a superuser(optional):
```entrypoint.sh``` has functional to create superuser using global envs, but also it can be done from docker container

5. Open the application ```http://localhost:8000```

## Project Structure

```
dzencode_comments/
├── backend/                # Django application
│   ├── comments/           # Main app
│   ├── frontend/           # folder for store builded frontend
│   ├── core/               # Project settings
│   └── requirements.txt    # Python dependencies
├── frontend/               # React application
│   ├── src/
│   ├── public/
│   └── package.json
├── Dockerfile              # Docker configuration
```

## API Endpoints

### Comments
- `GET /api/comments/` - list of comments
- `POST /api/comments/` - create a comment
- `GET /api/comments/{id}/` - comment details

### CAPTCHA
- `POST /api/captcha/` - get captcha information

### Files
- `POST /api/attachments/` - upload a file
- `GET /api/attachments/{id}/` - delete a file

### Authentication
- `POST /api/token/` - login
- `POST /api/token/refresh/` - refresh access token
- `POST /api/me/` - load information about user
