# Campus Reserve Frontend

React + TypeScript frontend for the College Resource Booking System.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Ensure backend is running on `http://localhost:5000`

3. Start development server:
```bash
npm run dev
```

4. Open browser to `http://localhost:5173`

## Environment Variables

The `.env` file contains:
```
VITE_API_URL=http://localhost:5000/api
```

## Demo Accounts

Use these credentials to test different roles:

- **Admin**: admin@college.edu / password123
- **Faculty**: sarah@college.edu / password123
- **Student**: alex@student.edu / password123
- **Department**: cs@college.edu / password123
- **Club**: techclub@college.edu / password123

## Features

- ✅ JWT Authentication
- ✅ Role-based dashboards
- ✅ Resource management (Admin/Department)
- ✅ Booking creation and tracking
- ✅ Booking approval workflow (Department/Admin)
- ✅ Real-time updates with React Query
- ✅ Modern UI with Tailwind CSS
- ✅ Responsive design

## Tech Stack

- React 18
- TypeScript
- Vite
- React Router
- React Query (TanStack Query)
- Axios
- Tailwind CSS
- shadcn/ui components

## Project Structure

```
src/
├── components/       # Reusable UI components
├── contexts/         # React contexts (Auth, Booking)
├── pages/           # Page components
├── services/        # API service layer
│   ├── api.ts           # Axios instance
│   ├── authService.ts   # Authentication APIs
│   ├── resourceService.ts
│   ├── bookingService.ts
│   └── userService.ts
├── types/           # TypeScript type definitions
├── hooks/           # Custom React hooks
└── lib/             # Utility functions
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Notes

- The frontend requires the backend to be running
- All API calls go through the axios instance in `services/api.ts`
- Authentication tokens are stored in localStorage
- React Query handles caching and optimistic updates
