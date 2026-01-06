# Nutrigenics React Frontend

Modern React SPA frontend for Nutrigenics Care, built with TypeScript, Tailwind CSS, and shadcn/ui.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Django backend running on http://localhost:8000

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at **http://localhost:5173/**

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Sidebar, Header components
│   ├── recipe/          # RecipeCard component
│   ├── analytics/       # Analytics components
│   └── chat/            # Chat components
├── pages/
│   ├── patient/         # Patient portal (11 pages)
│   ├── dietitian/       # Dietitian portal (7 pages)
│   ├── hospital/        # Hospital portal (4 pages)
│   └── auth/            # Auth pages (Login, Signup, Onboarding)
├── layouts/             # MainLayout wrapper
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions (cn helper)
├── services/            # API services
│   ├── api.client.ts    # Axios instance with CSRF
│   ├── auth.service.ts  # Authentication APIs
│   ├── recipe.service.ts# Recipe APIs
│   ├── plan.service.ts  # Meal plan APIs
│   └── analytics.service.ts # Analytics APIs
├── types/               # TypeScript type definitions
├── context/             # React context providers
│   └── AuthContext.tsx  # Global auth state
├── App.tsx              # Main app with routing
└── index.css            # Global styles + Tailwind
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file (see `.env.example`):

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
VITE_GOOGLE_OAUTH_CLIENT_ID=your_client_id_here
```

### Tailwind CSS

This project uses **Tailwind CSS v4** with custom theme:
- Primary color: `#64f50a` (logo color)
- Custom fonts: DM Sans, Onest
- Custom utilities: `hide-scrollbar`, `line-clamp-*`

## 🛣️ Routing

The app uses React Router with role-based protected routes:

### Patient Routes (`/`)
- `/` - Dashboard
- `/recipes` - Recipe listing
- `/recipes/:id` - Recipe detail
- `/search` - Search recipes
- `/plan` - Meal plan
- `/analytics` - Analytics charts
- `/chat` - AI chat
- `/bookmarks` - Bookmarked recipes
- `/profile` - User profile
- `/my-dietitian` - Dietitian connection
- `/my-dietitian/chat` - Chat with dietitian

### Dietitian Routes (`/dietitian/...`)
- `/dietitian/dashboard` - Dietitian dashboard
- `/dietitian/patients` - Patient list
- `/dietitian/chats` - Chat list
- `/dietitian/chat/:patientId` - Patient chat
- `/dietitian/patient/:patientId/analytics` - Patient analytics
- `/dietitian/profile` - Dietitian profile

### Hospital Routes (`/hospital/...`)
- `/hospital/dashboard` - Hospital dashboard
- `/hospital/requests` - Dietitian approval requests
- `/hospital/profile` - Hospital profile

### Public Routes
- `/login` - Login page
- `/signup` - Signup page
- `/onboarding` - User onboarding
- `/about` - About page
- `/privacy` - Privacy policy
- `/contact` - Contact page

## 🔐 Authentication

The app uses cookie-based authentication with Django backend:
- Auth state managed via `AuthContext`
- CSRF tokens automatically handled in API calls
- Protected routes redirect to `/login` if unauthenticated
- Role-based routing (patient/dietitian/hospital)

### Auth Flow
1. User logs in via `/login`
2. Django sets session cookie
3. `AuthContext` fetches user profile
4. Protected routes accessible based on user role

## 📡 API Integration

### Services

All API calls use the centralized `apiClient` (axios instance):

```typescript
import apiClient from '@/services/api.client';

// Example: Get all recipes
const recipes = await apiClient.get('/api/v1/recipes/');
```

**Features**:
- Automatic CSRF token injection
- Error handling with user-friendly messages
- 401 redirect to login
- Request/response logging (dev mode)

### Available Services
- `authService` - Login, signup, profile, OAuth
- `recipeService` - Recipes CRUD, search, bookmark, like
- `planService` - Meal plan management
- `analyticsService` - Charts and nutrient data

## 🎨 Styling

### Tailwind CSS v4
- Utility-first CSS framework
- JIT compilation
- Custom theme in `tailwind.config.js`

### shadcn/ui Components
Installed components:
- button, input, card, alert, badge
- label, textarea, select

Add more components:
```bash
npx shadcn@latest add [component-name]
```

### Custom Utilities

```css
.hide-scrollbar          /* Hide scrollbars */
.line-clamp-2           /* Truncate to 2 lines */
.line-clamp-4           /* Truncate to 4 lines */
.line-clamp-card-title  /* Truncate recipe titles (responsive) */
```

## 🏗️ Building for Production

```bash
# Build optimized bundle
npm run build

# Preview production build
npm run preview
```

Build output goes to `dist/` directory.

### Deployment Options

**Option 1: Separate Frontend Deployment**
- Deploy to Vercel/Netlify
- Point API to production Django backend
- Configure CORS on Django

**Option 2: Integrated with Django**
```bash
npm run build
cp -r dist/* ../path/to/django/static/
```
Serve via Django static files.

## 🧪 Development

### Hot Module Reloading
Vite provides instant HMR. Changes appear immediately.

### TypeScript
Strict mode enabled. All types in `src/types/index.ts`.

### Linting
```bash
npm run lint
```

## 📚 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - Component library
- **Axios** - HTTP client
- **TanStack Query** (React Query) - Data fetching
- **Recharts** - Charts for analytics
- **Socket.io Client** - WebSocket for chat
- **Lucide React** - Icons
- **date-fns** - Date utilities

## 📋 Current Status

### ✅ Completed
- Project setup and configuration
- Complete API service layer
- Authentication system
- Protected routing
- Layout components (Sidebar, Header)
- RecipeCard component
- LoginPage
- All page placeholders (32 pages)

### 🚧 In Progress
- Full page implementations (Patient portal priority)

### ⏳ Todo
- Complete all patient portal pages
- Dietitian portal implementation
- Hospital portal implementation
- WebSocket chat integration
- Testing and validation

## 🤝 Contributing

When adding new pages:
1. Create page in appropriate directory (`pages/patient`, `pages/dietitian`, etc.)
2. Use `MainLayout` wrapper for consistency
3. Import and use existing components from `components/`
4. Add route to `App.tsx`
5. Use TypeScript types from `types/index.ts`

## 📞 Support

For issues or questions, refer to:
- Implementation plan: `../brain/implementation_plan.md`
- Task breakdown: `../brain/task.md`
- Progress walkthrough: `../brain/walkthrough.md`

## 🎯 Next Steps

1. Build DashboardPage (convert Django `index.html`)
2. Implement remaining patient portal pages sequentially
3. Integrate with Django backend endpoints
4. Progress to dietitian/hospital portals
5. Testing and validation

---

**Version**: 1.0.0  
**Last Updated**: December 2024
