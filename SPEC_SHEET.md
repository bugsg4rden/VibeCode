# Art Reference Website - Technical Specification Sheet

## Project Overview

**Project Name:** RefSearch  
**Purpose:** A web application for artists to search, save, and organize art reference images (poses and facial expressions)  
**Target Users:** Artists looking for drawing/painting references  
**Platforms:** Desktop and Tablet (responsive design)  

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML5, CSS3, JavaScript (Vanilla or with a light framework) |
| **Frontend Hosting** | GitHub Pages |
| **Backend** | Node.js with Express.js |
| **Backend Hosting** | Render (free tier) |
| **Database** | Supabase (PostgreSQL + Auth + Storage) |
| **Image APIs** | Unsplash API, Pexels API |
| **Image Extraction** | Link preview/metadata extraction for DeviantArt, ArtStation, Pinterest |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (GitHub Pages)                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  HTML/CSS/JS Static Files                                 │  │
│  │  - Search Interface                                       │  │
│  │  - Image Gallery Grid                                     │  │
│  │  - Image Viewer with Tools                                │  │
│  │  - User Dashboard                                         │  │
│  │  - Admin Panel                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                      │ API Calls (REST)
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Render)                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Node.js + Express Server                                 │  │
│  │  - Authentication middleware                              │  │
│  │  - Image search endpoints                                 │  │
│  │  - URL extraction service                                 │  │
│  │  - Submission management                                  │  │
│  │  - Admin endpoints                                        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│  Supabase        │    │  External APIs   │
│  - PostgreSQL DB │    │  - Unsplash      │
│  - Auth          │    │  - Pexels        │
│  - Row Security  │    │  - URL Metadata  │
└──────────────────┘    └──────────────────┘
```

---

## Database Schema (Supabase/PostgreSQL)

### Tables

#### 1. `users`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique user ID (from Supabase Auth) |
| email | VARCHAR(255) | User email |
| username | VARCHAR(50) | Display name |
| role | ENUM('user', 'admin') | User role |
| is_banned | BOOLEAN | Ban status |
| created_at | TIMESTAMP | Account creation date |
| updated_at | TIMESTAMP | Last update |

#### 2. `submissions`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique submission ID |
| user_id | UUID (FK) | Submitter's user ID |
| image_url | TEXT | Direct image URL |
| source_url | TEXT | Original page URL (DeviantArt, etc.) |
| source_platform | VARCHAR(50) | Platform name |
| title | VARCHAR(255) | Image title |
| credits | TEXT | Artist/source credits |
| status | ENUM('pending', 'approved', 'rejected') | Approval status |
| rejection_reason | TEXT | Reason if rejected |
| created_at | TIMESTAMP | Submission date |
| reviewed_at | TIMESTAMP | Review date |
| reviewed_by | UUID (FK) | Admin who reviewed |

#### 3. `tags`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique tag ID |
| name | VARCHAR(50) | Tag name |
| category | VARCHAR(50) | Tag category (see below) |

**Tag Categories:**
- `lighting` (e.g., natural, studio, dramatic, backlit)
- `gender` (e.g., male, female, neutral)
- `body_type` (e.g., slim, average, muscular, plus-size)
- `action` (e.g., standing, sitting, running, jumping, stationary)
- `camera_angle` (e.g., front, side, back, high-angle, low-angle, 3/4)
- `reference_type` (e.g., full-body, portrait, expression, hands)

#### 4. `submission_tags`
| Column | Type | Description |
|--------|------|-------------|
| submission_id | UUID (FK) | Reference to submission |
| tag_id | UUID (FK) | Reference to tag |

#### 5. `boards`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique board ID |
| user_id | UUID (FK) | Owner's user ID |
| name | VARCHAR(100) | Board name |
| description | TEXT | Board description |
| is_public | BOOLEAN | Public visibility |
| cover_image_url | TEXT | Board cover image |
| created_at | TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | Last update |

#### 6. `board_images`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique entry ID |
| board_id | UUID (FK) | Reference to board |
| submission_id | UUID (FK, nullable) | Reference to user submission |
| external_image_url | TEXT | URL if from external API |
| external_source | VARCHAR(50) | API source (unsplash, pexels) |
| added_at | TIMESTAMP | When added to board |

#### 7. `analytics`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique entry ID |
| event_type | VARCHAR(50) | Event type (search, view, save, etc.) |
| user_id | UUID (FK, nullable) | User if logged in |
| submission_id | UUID (FK, nullable) | Related submission |
| search_query | TEXT | Search terms if applicable |
| created_at | TIMESTAMP | Event timestamp |

#### 8. `reports`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID (PK) | Unique report ID |
| submission_id | UUID (FK) | Reported submission |
| user_id | UUID (FK) | User who reported |
| reason | ENUM('inappropriate', 'copyright', 'broken_link', 'wrong_tags', 'other') | Report reason |
| description | TEXT | Additional details |
| status | ENUM('pending', 'reviewed', 'resolved', 'dismissed') | Report status |
| created_at | TIMESTAMP | Report date |
| reviewed_by | UUID (FK, nullable) | Admin who reviewed |
| reviewed_at | TIMESTAMP | Review date |

---

## Image Display Specifications

| Setting | Value |
|---------|-------|
| **Maximum Width** | 650px |
| **Minimum Width** | 500px |
| **Thumbnail Size** | 250px (grid cards) |
| **Aspect Ratio** | Maintain original |
| **Loading** | Lazy load with placeholder |

---

## API Endpoints

### Authentication (via Supabase)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| POST | `/auth/logout` | Logout user |
| GET | `/auth/me` | Get current user info |

### Search
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search` | Search all sources |
| GET | `/api/search/submissions` | Search user submissions only |
| GET | `/api/search/unsplash` | Search Unsplash API |
| GET | `/api/search/pexels` | Search Pexels API |

**Query Parameters:**
- `q` - Search query (required)
- `source` - Filter by source (all, submissions, unsplash, pexels)
- `lighting` - Lighting filter
- `gender` - Gender filter
- `body_type` - Body type filter
- `action` - Action/stationary filter
- `camera_angle` - Camera angle filter
- `reference_type` - pose or expression
- `page` - Pagination
- `limit` - Results per page (default: 20)

### Submissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/submissions` | Get approved submissions |
| GET | `/api/submissions/:id` | Get single submission |
| POST | `/api/submissions` | Create new submission (auth required) |
| DELETE | `/api/submissions/:id` | Delete own submission (auth required) |

**POST Body:**
```json
{
  "source_url": "https://deviantart.com/...",
  "title": "Dynamic Running Pose",
  "credits": "Artist Name",
  "tags": ["running", "male", "full-body", "natural-lighting"]
}
```

### Boards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards` | Get user's boards (auth required) |
| GET | `/api/boards/public` | Get public boards |
| GET | `/api/boards/:id` | Get board details |
| POST | `/api/boards` | Create new board (auth required) |
| PUT | `/api/boards/:id` | Update board (auth required) |
| DELETE | `/api/boards/:id` | Delete board (auth required) |
| POST | `/api/boards/:id/images` | Add image to board (auth required) |
| DELETE | `/api/boards/:id/images/:imageId` | Remove image from board (auth required) |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/submissions/pending` | Get pending submissions |
| PUT | `/api/admin/submissions/:id/approve` | Approve submission |
| PUT | `/api/admin/submissions/:id/reject` | Reject submission |
| DELETE | `/api/admin/submissions/:id` | Delete any submission |
| PUT | `/api/admin/submissions/:id/tags` | Edit submission tags |
| GET | `/api/admin/users` | List all users |
| PUT | `/api/admin/users/:id/ban` | Ban user |
| PUT | `/api/admin/users/:id/unban` | Unban user |
| GET | `/api/admin/stats` | Get analytics/statistics |
| GET | `/api/admin/reports` | Get all reports |
| PUT | `/api/admin/reports/:id/resolve` | Resolve a report |
| PUT | `/api/admin/reports/:id/dismiss` | Dismiss a report |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reports` | Submit a report (auth required) |
| GET | `/api/reports/my` | Get user's submitted reports (auth required) |

**POST Body:**
```json
{
  "submission_id": "uuid",
  "reason": "inappropriate",
  "description": "Optional additional details"
}
```

### URL Extraction
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/extract-image` | Extract image from URL |

**Supported Platforms:**
- DeviantArt
- ArtStation
- Pinterest
- Direct image URLs

---

## Frontend Pages & Components

### Pages

#### 1. Home / Search Page (`index.html`)
- Hero section with search bar
- Category quick-links (Poses, Expressions)
- Recent/trending images grid
- Filter sidebar (collapsible on tablet)

#### 2. Search Results (`search.html`)
- Search bar (persistent)
- Filter panel (left sidebar)
  - Source toggle (All, User Submissions, Unsplash, Pexels)
  - Lighting dropdown
  - Gender dropdown
  - Body Type dropdown
  - Action/Stationary toggle
  - Camera Angle dropdown
- Masonry grid of results (Pinterest-style)
- Infinite scroll or pagination
- "Save to Board" quick action on hover

#### 3. Image Viewer (`viewer.html` or modal)
- Large image display
- **Artist Tools Panel:**
  - Flip Horizontal button
  - Flip Vertical button
  - Grid overlay toggle (with grid size options: 2x2, 3x3, 4x4)
  - Grayscale toggle
  - Zoom slider + Pan (click and drag)
- Image info sidebar:
  - Title, credits, source
  - Tags
  - "Save to Board" button
  - "Report Image" button (flag inappropriate content)
- Navigation arrows (prev/next in search results)

#### 4. User Dashboard (`dashboard.html`)
- User profile section
- My Boards grid
- My Submissions list
- Submission status indicators (pending, approved, rejected)

#### 5. Board View (`board.html`)
- Board header (name, description, owner)
- Public/Private toggle (if owner)
- Image grid
- Remove from board option (if owner)

#### 6. Submit Reference (`submit.html`)
- URL input field
- Preview of extracted image
- Title input
- Credits input
- Tag selection (multi-select for each category)
- Submit button
- Submission guidelines

#### 7. Admin Panel (`admin.html`)
- **Dashboard Tab:**
  - Total users count
  - Total submissions count
  - Pending submissions count
  - Recent activity chart
- **Pending Submissions Tab:**
  - Queue of submissions to review
  - Approve/Reject buttons
  - Tag editor
- **Reports Tab:**
  - Queue of reported images
  - View report reason/description
  - Resolve/Dismiss buttons
  - Quick link to image
- **All Submissions Tab:**
  - Searchable/filterable list
  - Edit/Delete actions
- **Users Tab:**
  - User list
  - Ban/Unban actions
  - Role management

#### 8. Login/Register (`login.html`, `register.html`)
- Email/password forms
- Form validation
- Error messaging

### Reusable Components

1. **Navbar**
   - Logo
   - Search bar
   - Navigation links (Home, Browse, Submit)
   - User menu (Login/Register or Profile/Logout)
   - Admin link (if admin)

2. **Image Card**
   - Thumbnail image
   - Hover overlay with:
     - Save to Board button
     - Quick view button
   - Source badge (User/Unsplash/Pexels)

3. **Filter Panel**
   - Collapsible sections
   - Checkbox/dropdown filters
   - Clear all button
   - Apply button (or auto-apply)

4. **Board Card**
   - Cover image (4-image grid or single)
   - Board name
   - Image count
   - Public/Private badge

5. **Modal System**
   - Image viewer modal
   - Board selector modal
   - Confirmation dialogs

6. **Toast Notifications**
   - Success/error/info messages
   - Auto-dismiss

---

## UI/UX Specifications

### Design System

#### Color Palette (Dark Mode)
| Element | Color |
|---------|-------|
| Background Primary | `#121212` |
| Background Secondary | `#1E1E1E` |
| Background Tertiary | `#2D2D2D` |
| Surface | `#333333` |
| Primary Accent | `#E60023` (Pinterest red) or `#6366F1` (Indigo) |
| Primary Hover | Lighten 10% |
| Text Primary | `#FFFFFF` |
| Text Secondary | `#A0A0A0` |
| Text Muted | `#666666` |
| Border | `#404040` |
| Success | `#22C55E` |
| Warning | `#F59E0B` |
| Error | `#EF4444` |

#### Typography
| Element | Font | Size | Weight |
|---------|------|------|--------|
| Headings | Inter or Poppins | 24-48px | 600-700 |
| Body | Inter | 14-16px | 400 |
| Small/Caption | Inter | 12px | 400 |
| Buttons | Inter | 14px | 500 |

#### Spacing
- Base unit: 4px
- Common spacing: 8px, 12px, 16px, 24px, 32px, 48px

#### Border Radius
- Small (buttons, inputs): 8px
- Medium (cards): 12px
- Large (modals): 16px
- Round (avatars): 50%

#### Shadows
```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
```

### Responsive Breakpoints
| Breakpoint | Width | Target |
|------------|-------|--------|
| Desktop | ≥1024px | Full layout, sidebar visible |
| Tablet | 768px - 1023px | Collapsible sidebar, adjusted grid |

### Grid Layout
- **Desktop:** 5-6 columns
- **Tablet:** 3-4 columns
- Gap: 16px
- Masonry layout (varying heights)

---

## Image Viewer Tools - Technical Specs

### Flip Image
```javascript
// Horizontal flip
transform: scaleX(-1);

// Vertical flip
transform: scaleY(-1);
```

### Grid Overlay
- Canvas overlay on top of image
- Grid options: 2x2, 3x3, 4x4, Rule of Thirds
- Grid color: Semi-transparent white (`rgba(255,255,255,0.5)`)
- Toggle on/off

### Grayscale
```javascript
filter: grayscale(100%);
```

### Zoom & Pan
- Zoom: 50% - 400% (slider or scroll wheel)
- Pan: Click and drag when zoomed in
- Reset button to return to default
- Use CSS transforms for performance:
```javascript
transform: scale(2) translate(10px, 20px);
```

---

## URL Extraction Service

### Supported Platforms & Methods

#### DeviantArt
- Use oEmbed API: `https://backend.deviantart.com/oembed?url={url}`
- Extract `url` field from response for full image

#### ArtStation
- Parse HTML meta tags: `og:image`
- Or use their unofficial API

#### Pinterest
- Parse `og:image` meta tag
- Note: May have restrictions

#### Direct Image URLs
- Validate URL ends with image extension (.jpg, .png, .gif, .webp)
- Or check `Content-Type` header

### Dead Link Detection
- **Scheduled Job:** Run daily/weekly
- Check HTTP status of all `image_url` entries
- If 404/unreachable for 3+ consecutive checks:
  - Mark submission as `inactive`
  - Notify user (optional)
  - Remove from search results

---

## Authentication Flow

### Registration
1. User enters email + password
2. Frontend calls Supabase Auth `signUp()`
3. Supabase sends confirmation email
4. User clicks confirmation link
5. Account activated
6. Backend creates user record in `users` table

### Login
1. User enters email + password
2. Frontend calls Supabase Auth `signInWithPassword()`
3. Supabase returns JWT token
4. Token stored in localStorage
5. Token sent with all API requests via `Authorization` header

### Protected Routes
- Frontend checks for valid token before showing protected pages
- Backend validates token on all protected endpoints
- Invalid/expired token returns 401

---

## Admin Statistics Dashboard

### Metrics to Track
1. **Total Users** - Count of registered users
2. **New Users (This Week/Month)** - Growth tracking
3. **Total Submissions** - Approved submissions count
4. **Pending Submissions** - Queue length
5. **Submissions This Week** - Activity tracking
6. **Most Used Tags** - Popular categories
7. **Top Contributors** - Users with most approved submissions
8. **Search Queries** - Popular search terms
9. **Active Users** - Users who logged in recently

### Visualization
- Line chart: Submissions over time
- Bar chart: Submissions by category
- Pie chart: Sources breakdown (User vs API)
- Table: Recent activity log

---

## File Structure

```
artref/
├── frontend/                    # GitHub Pages deployment
│   ├── index.html
│   ├── search.html
│   ├── login.html
│   ├── register.html
│   ├── dashboard.html
│   ├── board.html
│   ├── submit.html
│   ├── admin.html
│   ├── css/
│   │   ├── reset.css
│   │   ├── variables.css
│   │   ├── global.css
│   │   ├── components/
│   │   │   ├── navbar.css
│   │   │   ├── cards.css
│   │   │   ├── buttons.css
│   │   │   ├── forms.css
│   │   │   ├── modal.css
│   │   │   └── viewer.css
│   │   └── pages/
│   │       ├── home.css
│   │       ├── search.css
│   │       ├── dashboard.css
│   │       └── admin.css
│   ├── js/
│   │   ├── config.js           # API URLs, constants
│   │   ├── auth.js             # Supabase auth helpers
│   │   ├── api.js              # API call functions
│   │   ├── utils.js            # Helper functions
│   │   ├── components/
│   │   │   ├── navbar.js
│   │   │   ├── imageCard.js
│   │   │   ├── imageViewer.js
│   │   │   ├── filterPanel.js
│   │   │   ├── boardSelector.js
│   │   │   └── toast.js
│   │   └── pages/
│   │       ├── home.js
│   │       ├── search.js
│   │       ├── dashboard.js
│   │       ├── board.js
│   │       ├── submit.js
│   │       └── admin.js
│   └── assets/
│       ├── icons/
│       └── images/
│
├── backend/                     # Render deployment
│   ├── package.json
│   ├── server.js               # Express entry point
│   ├── config/
│   │   ├── supabase.js         # Supabase client
│   │   └── constants.js
│   ├── middleware/
│   │   ├── auth.js             # JWT verification
│   │   ├── admin.js            # Admin role check
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── search.js
│   │   ├── submissions.js
│   │   ├── boards.js
│   │   ├── admin.js
│   │   └── extract.js
│   ├── services/
│   │   ├── unsplash.js
│   │   ├── pexels.js
│   │   ├── urlExtractor.js
│   │   └── deadLinkChecker.js
│   └── utils/
│       └── helpers.js
│
├── database/
│   └── schema.sql              # Supabase schema
│
└── README.md
```

---

## Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up GitHub repository
- [ ] Set up Supabase project
- [ ] Create database schema
- [ ] Set up backend on Render
- [ ] Basic Express server with health check
- [ ] Supabase authentication integration
- [ ] Basic frontend HTML structure
- [ ] CSS design system (variables, reset, global styles)

### Phase 2: Core Features (Week 3-4)
- [ ] User registration/login pages
- [ ] Search page with basic grid
- [ ] Unsplash API integration
- [ ] Pexels API integration
- [ ] Filter panel (frontend only)
- [ ] Image viewer modal with tools

### Phase 3: User Features (Week 5-6)
- [ ] User dashboard
- [ ] Boards CRUD
- [ ] Save images to boards
- [ ] Submit reference form
- [ ] URL extraction service
- [ ] User submissions display

### Phase 4: Admin Features (Week 7-8)
- [ ] Admin panel layout
- [ ] Submission approval queue
- [ ] User management
- [ ] Tag/category management
- [ ] Basic analytics dashboard

### Phase 5: Polish & Launch (Week 9-10)
- [ ] Dead link checker job
- [ ] Performance optimization
- [ ] Error handling improvements
- [ ] Tablet responsive testing
- [ ] Security audit
- [ ] Documentation
- [ ] Deployment & launch

---

## Environment Variables

### Backend (.env)
```
PORT=3000
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# External APIs
UNSPLASH_ACCESS_KEY=your-unsplash-key
PEXELS_API_KEY=your-pexels-key

# Frontend URL (for CORS)
FRONTEND_URL=https://yourusername.github.io/artref
```

### Frontend (config.js)
```javascript
const CONFIG = {
  API_URL: 'https://your-backend.onrender.com/api',
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: 'your-anon-key'
};
```

---

## Security Considerations

1. **Authentication**
   - JWT tokens with expiration
   - Secure password requirements
   - Rate limiting on auth endpoints

2. **Authorization**
   - Row Level Security (RLS) in Supabase
   - Backend middleware for role checks
   - Users can only modify their own resources

3. **Input Validation**
   - Sanitize all user inputs
   - Validate URLs before extraction
   - Limit file/URL types

4. **CORS**
   - Restrict to frontend domain only

5. **Rate Limiting**
   - Limit API calls per user
   - Protect against abuse

---

## External API Rate Limits

| API | Free Tier Limit |
|-----|-----------------|
| Unsplash | 50 requests/hour |
| Pexels | 200 requests/hour |

**Strategy:** Cache search results in Supabase for 24 hours to reduce API calls.

---

## Success Metrics

1. **User Engagement**
   - Daily active users
   - Average session duration
   - Searches per session

2. **Content Growth**
   - New submissions per week
   - Approval rate
   - Active contributors

3. **Feature Usage**
   - Boards created
   - Images saved
   - Tool usage (flip, grid, grayscale)

---

## Future Enhancements (Post-Launch)

1. **Timer Feature** - Timed drawing sessions
2. **Random Pose Generator** - Shuffle through references
3. **Social Features** - Follow artists, like images
4. **Mobile App** - React Native or PWA
5. **Premium Tier** - Higher quality images, no ads
6. **AI Tagging** - Auto-suggest tags using ML
7. **Light Mode Toggle** - Theme switcher
8. **Keyboard Shortcuts** - Power user features

---

## Stakeholder Answers

1. **Project Name:** RefSearch
2. **Logo/Brand Guidelines:** None (to be created)
3. **Report Feature:** Yes - users can report inappropriate content
4. **Maximum Image Dimensions:** 500px - 650px
5. **Featured/Staff Picks:** No

---

*Spec Version: 1.1*  
*Last Updated: November 27, 2025*
