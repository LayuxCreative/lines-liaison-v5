# Lines Liaison V5

A modern project management and collaboration platform built with React, TypeScript, and Supabase.

## Features

- **Project Management**: Create, manage, and track projects with comprehensive dashboards
- **File Management**: Upload, organize, and collaborate on files with version control
- **Real-time Collaboration**: Live updates and notifications for team members
- **User Authentication**: Secure authentication with role-based access control
- **Database Integration**: Powered by Supabase for real-time data synchronization
- **Modern UI**: Beautiful, responsive interface with dark theme and glassmorphism effects

## Technology Stack

- **Frontend**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Database**: Supabase (PostgreSQL)
- **Testing**: Vitest with Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd lines-liaison-V5
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your Supabase credentials in `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

5. Start the development server:
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage

## Project Structure

```
src/
├── components/
│   ├── common/          # Reusable components
│   └── dashboard/       # Dashboard-specific components
├── pages/
│   └── dashboard/       # Page components
├── contexts/            # React contexts
├── types/              # TypeScript type definitions
├── test/               # Test setup and utilities
└── __tests__/          # Test files
```

## Testing

The project uses Vitest for testing with comprehensive test coverage:

- Unit tests for components
- Integration tests for user flows
- Mocked external dependencies
- Coverage reporting

Run tests:
```bash
npm test
```

## Design System

### Colors
- **Primary**: Blue (#3B82F6, #1D4ED8)
- **Secondary**: Purple (#8B5CF6, #7C3AED)
- **Accent**: Emerald (#10B981, #059669)
- **Background**: Dark theme with glassmorphism

### Effects
- Glassmorphism with backdrop-blur
- Smooth animations with Framer Motion
- Responsive design (mobile-first)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.