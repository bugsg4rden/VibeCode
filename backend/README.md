# RefSearch Backend

## Setup

1. Copy `.env.example` to `.env` and fill in your values
2. Run `npm install`
3. Run `npm run dev` for development

## Environment Variables

```
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
UNSPLASH_ACCESS_KEY=your-unsplash-key
PEXELS_API_KEY=your-pexels-key
FRONTEND_URL=http://localhost:5500
```

## API Endpoints

### Auth
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get current user

### Search
- GET `/api/search` - Search all sources
- GET `/api/search/submissions` - Search user submissions only

### Submissions
- GET `/api/submissions` - Get approved submissions
- GET `/api/submissions/my` - Get user's submissions (auth)
- GET `/api/submissions/:id` - Get single submission
- POST `/api/submissions` - Create submission (auth)
- DELETE `/api/submissions/:id` - Delete own submission (auth)

### Boards
- GET `/api/boards` - Get user's boards (auth)
- GET `/api/boards/public` - Get public boards
- GET `/api/boards/:id` - Get board details
- POST `/api/boards` - Create board (auth)
- POST `/api/boards/:id` - Update board (auth)
- POST `/api/boards/:id/delete` - Delete board (auth)
- POST `/api/boards/:id/images` - Add image to board (auth)
- DELETE `/api/boards/:id/images/:imageId` - Remove image (auth)

### Reports
- POST `/api/reports` - Submit report (auth)
- GET `/api/reports/my` - Get user's reports (auth)

### Admin
- GET `/api/admin/stats` - Get statistics
- GET `/api/admin/submissions/pending` - Get pending submissions
- POST `/api/admin/submissions/:id/approve` - Approve
- POST `/api/admin/submissions/:id/reject` - Reject
- POST `/api/admin/submissions/:id/delete` - Delete
- POST `/api/admin/submissions/:id/tags` - Update tags
- GET `/api/admin/users` - Get all users
- POST `/api/admin/users/:id/ban` - Ban user
- POST `/api/admin/users/:id/unban` - Unban user
- GET `/api/admin/reports` - Get pending reports
- POST `/api/admin/reports/:id/resolve` - Resolve report
- POST `/api/admin/reports/:id/dismiss` - Dismiss report

### Utilities
- POST `/api/extract-image` - Extract image from URL
