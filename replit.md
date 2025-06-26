# Personal Portfolio Application

## Overview

This is a modern personal portfolio application built with React, featuring a creative dark theme design with animated elements. The application showcases a developer's work, skills, and contact information through an interactive and visually appealing interface.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Development**: tsx for TypeScript execution in development
- **Production**: esbuild for bundling the server code

### Data Storage Solutions
- **Database**: PostgreSQL (configured via Drizzle)
- **ORM**: Drizzle ORM with Zod schema validation
- **Connection**: Neon Database serverless connection
- **Development Storage**: In-memory storage implementation for rapid prototyping

## Key Components

### Frontend Components
1. **Layout System**: Centralized layout component with responsive design
2. **Navigation**: Floating navigation bubbles with emoji-based icons
3. **Animations**: Custom bouncing circles animation and CSS transitions
4. **Pages**: Home, About, Portfolio, and Contact pages with consistent styling
5. **UI Library**: Comprehensive set of reusable components (buttons, cards, forms, etc.)

### Backend Components
1. **Server Setup**: Express server with middleware for JSON parsing and logging
2. **Storage Interface**: Abstracted storage layer with in-memory implementation
3. **Route Registration**: Modular route system with API prefix structure
4. **Error Handling**: Centralized error handling middleware

### Design System
- **Typography**: Custom fonts (Xanman, XanmanWide) with fallbacks
- **Color Palette**: Dark theme with electric accent colors (orange, cyan, red, green)
- **Components**: Glassmorphism effects and modern card-based layouts
- **Responsive**: Mobile-first design with breakpoint-based styling

## Data Flow

1. **Client Requests**: Browser requests routed through Wouter
2. **Server Communication**: API calls via TanStack Query with fetch wrapper
3. **Data Management**: Drizzle ORM handles database operations
4. **State Updates**: React Query manages cache invalidation and updates
5. **UI Rendering**: React components render based on state changes

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for serverless environments
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management
- **wouter**: Lightweight routing library
- **date-fns**: Date manipulation utilities

### UI Dependencies
- **@radix-ui/***: Unstyled, accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe variant management
- **lucide-react**: Icon library

### Development Dependencies
- **vite**: Build tool and development server
- **tsx**: TypeScript execution for Node.js
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with Replit environment
- **Database**: PostgreSQL 16 module in Replit
- **Hot Reload**: Vite HMR for frontend, tsx for backend
- **Port Configuration**: Local port 5000, external port 80

### Production Build
1. **Frontend**: Vite builds optimized static assets to `dist/public`
2. **Backend**: esbuild bundles server code to `dist/index.js`
3. **Database**: Drizzle migrations applied via `drizzle-kit push`
4. **Deployment**: Autoscale deployment target on Replit

### Environment Configuration
- **DATABASE_URL**: Required environment variable for database connection
- **NODE_ENV**: Environment detection for development/production modes
- **Build Commands**: `npm run build` for production, `npm run dev` for development

## Changelog

```
Changelog:
- June 25, 2025. Initial setup
- June 25, 2025. Fixed bouncing circle navigation - replaced div elements with button elements to resolve click detection issues. Implemented DVD screensaver-style animation with proper collision detection. All navigation links now working (Bio, LinkedIn, Store, Contact).
- June 26, 2025. Enhanced navigation functionality - made bouncing circles semi-transparent (70% opacity), doubled mobile font size to 100px for better readability, removed title animation for static display, and fixed z-index layering to ensure both XANDER WALKER title link and bouncing circle navigation work simultaneously on all pages.
- June 26, 2025. Successfully deployed to production - connected GitHub repository (xander-walker-dot-com), deployed to Vercel with custom domain xanderwalker.com. Updated DNS settings in GoDaddy to point to Vercel servers (A record: 216.198.79.193, CNAME: cname.vercel-dns.com). Portfolio now live at xanderwalker.com with SSL certificate.
- June 26, 2025. Added mobile touch support - implemented onTouchStart, touchmove, and touchend event handlers for bouncing navigation circles. Mobile users can now drag and throw the navigation circles with proper touch detection and velocity calculations.
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
Development workflow: Edit files directly in Replit web interface, then push changes to GitHub for automatic deployment to Vercel.
```