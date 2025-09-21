# PROJECT RULES - Lines Liaison Development Standards

## Database
- **PRIMARY**: Supabase exclusively for production
- **NO ALTERNATIVES**: Do not use any other database solutions

## Technology Stack
- React 18+ with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Framer Motion for animations
- Lucide React for icons
- React Router DOM for navigation

## Design Standards
### Colors
- Primary: Blue (#3B82F6, #1D4ED8)
- Secondary: Purple (#8B5CF6, #7C3AED)
- Accent: Emerald (#10B981, #059669)
- Background: Dark theme with glassmorphism

### Effects
- Glassmorphism: backdrop-blur with transparency
- Smooth animations with Framer Motion
- Responsive design (mobile-first)

## File Organization
- Components: `/src/components/common/` and `/src/components/dashboard/`
- Pages: `/src/pages/` and `/src/pages/dashboard/`
- Types: `/src/types/index.ts`
- Contexts: `/src/contexts/`

## Naming Conventions
- PascalCase for components
- camelCase for functions and variables
- kebab-case for file names (except components)

## Code Quality
- TypeScript strict mode
- ESLint compliance
- Proper error handling
- Clean, readable code