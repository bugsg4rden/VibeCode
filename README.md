# RefSearch - Art Reference Image Search

A Pinterest-inspired web application for artists to search, save, and organize reference images for drawing and painting.

![RefSearch](https://via.placeholder.com/800x400/1a1a2e/8b5cf6?text=RefSearch)

## Features

- 🔍 **Multi-Source Search** - Search across Unsplash, Pexels, and user submissions
- 📁 **Personal Boards** - Create and organize boards for your reference collections
- 🎨 **Advanced Viewer** - Flip, grayscale, grid overlay, and zoom tools
- 🏷️ **Smart Filtering** - Filter by lighting, pose type, body type, camera angle
- 👤 **User Accounts** - Save favorites and manage submissions
- 📤 **Community Submissions** - Submit and share reference images
- 🌙 **Dark Mode** - Easy on the eyes for long drawing sessions

## Tech Stack

### Frontend
- HTML5, CSS3, Vanilla JavaScript
- CSS Variables for theming
- Responsive design (Desktop + Tablet)

### Backend
- Node.js + Express
- Supabase (PostgreSQL + Auth)
- External APIs: Unsplash, Pexels

## Quick Start

### Prerequisites
- Node.js 18+
- A Supabase account (free tier works)
- Unsplash Developer account (optional)
- Pexels API key (optional)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/refsearch.git
cd refsearch
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the contents of `database/schema.sql`
3. Copy your API keys from Project Settings > API

### 3. Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your credentials:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
UNSPLASH_ACCESS_KEY=your-unsplash-key
PEXELS_API_KEY=your-pexels-key
```

### 4. Install & Run Backend
```bash
npm install
npm run dev
```

The API server will start at `http://localhost:3000`

### 5. Configure Frontend

Edit `frontend/config.js`:
```javascript
const CONFIG = {
  API_URL: 'http://localhost:3000/api',
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key'
};
```

### 6. Run Frontend

Open `index.html` in your browser, or use a local server:
```bash
# Using Python
python -m http.server 5500

# Using VS Code Live Server extension
# Right-click index.html > "Open with Live Server"
```

## Project Structure

```
refsearch/
├── index.html          # Home page
├── search.html         # Search results
├── viewer.html         # Image viewer
├── login.html          # Login page
├── register.html       # Registration page
├── dashboard.html      # User dashboard
├── board.html          # Board view
├── submit.html         # Submit new reference
├── admin.html          # Admin panel
├── SPEC_SHEET.md       # Project specification
│
├── frontend/
│   ├── config.js       # Frontend configuration
│   ├── assets/
│   │   ├── icons/
│   │   └── images/
│   ├── css/
│   │   ├── variables.css
│   │   ├── global.css
│   │   ├── pages/
│   │   └── components/
│   └── js/
│       ├── api.js
│       ├── auth.js
│       ├── pages/
│       └── components/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   └── utils/
│
└── database/
    └── schema.sql
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Search
- `GET /api/search` - Search images
  - Query params: `q`, `source`, `lighting`, `gender`, etc.

### Boards
- `GET /api/boards` - List user's boards
- `POST /api/boards` - Create new board
- `GET /api/boards/:id` - Get board details
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board
- `POST /api/boards/:id/images` - Add image to board
- `DELETE /api/boards/:id/images/:imageId` - Remove image

### Submissions
- `GET /api/submissions/my` - User's submissions
- `POST /api/submissions` - Submit new image
- `DELETE /api/submissions/:id` - Delete submission

### Admin
- `GET /api/admin/submissions` - Pending submissions
- `PUT /api/admin/submissions/:id` - Approve/reject
- `GET /api/admin/reports` - View reports
- `GET /api/admin/analytics` - Site analytics

## Deployment

### Frontend (GitHub Pages)
1. Push to GitHub
2. Enable GitHub Pages in repository settings
3. Update `config.js` with production API URL

### Backend (Render)
1. Create new Web Service on [render.com](https://render.com)
2. Connect GitHub repository
3. Set root directory to `backend`
4. Add environment variables
5. Deploy

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - See [LICENSE](LICENSE) for details.

## Credits

- Images from [Unsplash](https://unsplash.com) and [Pexels](https://pexels.com)
- Icons from [Lucide](https://lucide.dev)
