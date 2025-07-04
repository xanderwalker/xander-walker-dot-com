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
- June 26, 2025. Created interactive Projects page with physics simulation - removed bouncing navigation circles, added centered bold "XANDER WALKER" header, implemented 333 small physics balls (15px) with accelerometer responsiveness on mobile, ball-to-ball collision detection, and position-based color changes (coral, mint, sky blue, sage green). Desktop version uses gravity while mobile responds to device tilt.
- June 27, 2025. Restructured projects into card-based overview - created main projects page with cards for "333 Balls" and "Clock" projects. Moved physics simulation to dedicated /projects/333-balls subpage. Added smooth gradient color transitions instead of quadrant-based color changes. Created modern clock interface at /projects/clock with real-time updates.
- June 27, 2025. Implemented volume-based ball sizing for graduated cylinder clock - calculated proper ball sizes so 60 balls fill seconds/minutes cylinders (30 balls = 50% mark) and 12 balls fill hour cylinder (6 balls = 50% mark). Used 70% packing efficiency for realistic physics. Ball sizes: 20px for seconds/minutes, 58px for hours. Enhanced depth-based settling physics and corrected boundary collision detection.
- June 27, 2025. Enhanced sensor dashboard typography - converted all fonts to Georgia serif to match resume page styling. Updated header navigation, sensor titles, data values, and permission status text for consistent professional appearance.
- June 27, 2025. Created 3D gyroscope visualizer - built interactive 3D device representation that rotates in real-time based on alpha, beta, gamma values. Features visual orientation indicators, screen simulation, rotation rings, and smooth CSS transitions for intuitive device orientation display.
- June 27, 2025. Added comprehensive user information sections - implemented Location (GPS coordinates, accuracy, altitude, speed, heading), Device (platform, CPU cores, memory, screen specs, touch capabilities), and Browser (vendor details, privacy settings, feature support) sections with automatic data collection and permission management.
- June 27, 2025. Built interactive roulette wheel project - created physics-based simulation with drag-to-spin controls, realistic ball bounce mechanics, European roulette layout (37 numbers), winning number detection, and touch/mouse support. Features glassmorphism styling and Georgia serif fonts.
- June 27, 2025. Created interactive paint-swirling background using Monet water lily colors - responds to mouse movement on desktop and device accelerometer on mobile. Multiple radial gradients create realistic paint mixing effects with smooth transitions. Replaces static gradient with dynamic user-controlled color morphing.
- June 27, 2025. Deployed comprehensive updates via clean GitHub repository import - resolved git connection issues for streamlined future deployments while maintaining custom domain xanderwalker.com integration with Vercel.
- June 27, 2025. Successfully deployed complete interactive portfolio via ZIP download and force push - all physics projects (333 balls, hourglass clock with Monet paint swirling, sensor dashboard, roulette wheel, glass of water) now live at xanderwalker.com through streamlined download-and-push workflow.
- June 27, 2025. Fixed SPA routing issue - added vercel.json configuration to handle direct URL navigation. All project URLs (like /projects/333-balls) now work when shared directly, resolving 404 errors for deep links.
- June 27, 2025. Created dedicated camera system addressing iPhone hardware limitations - removed camera functionality from sensor dashboard, built single-camera switching interface at /projects/camera. System detects multiple cameras (wide, ultra-wide, telephoto, front) but properly handles one-camera-at-a-time restriction with clear hardware limitation notice and active camera indicators.
- June 27, 2025. Successfully implemented Spotify Lyrics integration with PKCE authentication - configured Spotify Developer app (Client ID: 05e9ec0109e04f81bf9f3b19d491db05), resolved environment variable loading by moving .env to client directory, implemented modern PKCE authentication flow replacing deprecated implicit flow, added real-time lyrics fetching from Lyrics.ovh API. System now displays current song information and lyrics for authenticated users.
- June 27, 2025. Major UI redesign for distance reading - removed bouncing balls navigation from home page, added Monet paint-swirling background to home page with fixed mobile accelerometer support, completely redesigned Spotify lyrics page with full-width layout featuring large 4xl-6xl fonts for distance reading, moved album art and artist info to bottom bar, implemented auto-sync lyrics timing when synchronized lyrics unavailable. Fixed mobile Monet backgrounds across both home and clock pages.
- June 27, 2025. Enhanced lyrics display with sliding window effect - implemented 10-line visible window with graduated text sizing (center line largest at 8xl, decreasing to 2xl at edges). Fixed API parameter mismatch ('track' vs 'song') and created comprehensive Spotify API test page showing real-time album art, song details, device info, playback state, context, and raw API responses for debugging and development.
- June 27, 2025. Enhanced website metadata and SEO optimization - added comprehensive Open Graph tags, Twitter Card meta data, author information, keywords, and canonical URLs. Created custom social media preview image with animated physics balls and site branding. Added light blue circle favicon matching site color palette. Site now optimized for Instagram, Facebook, LinkedIn sharing and Google search indexing.
- June 27, 2025. Implemented bubble physics for floating navigation - added realistic bubble deformation to bouncing navigation circles across all pages. Bubbles now squish 25% when hitting walls (horizontally for side walls, vertically for top/bottom walls) and gradually recover with smooth bubble-like physics. Effect appears on Home, About, Projects, Portfolio, Contact, and Camera pages with satisfying visual feedback.
- June 27, 2025. Perfected smooth paint washing effect for mobile Monet Paint page - implemented exponential smoothing with 100ms throttling to eliminate jerkiness, created layered radial gradients with varying opacity for natural color mixing, added smooth CSS transitions with cubic-bezier easing, reduced tilt sensitivity for subtler movements, and used viewport units for responsive positioning. Paint now flows gradually like wet paint washing in a tilted tray with realistic color blending.
- June 27, 2025. Optimized mobile bubble navigation performance - reduced frame rate to 30fps on mobile (vs 60fps desktop), added frame throttling for touch interactions, simplified deformation calculations, implemented faster recovery animations, added GPU acceleration hints (will-change, backface-visibility), and optimized touch event handling. Bouncing navigation bubbles now perform smoothly on mobile devices without lag.
- June 27, 2025. Successfully deployed complete mobile optimization update via force push to GitHub - all performance enhancements now live at xanderwalker.com including 30fps mobile bubble navigation, perfected paint washing effects with exponential smoothing, GPU acceleration optimizations, and removal of eye tracking experiment. Vercel automatically deploying latest changes.
- June 27, 2025. Fixed page scroll position issue - added automatic scroll-to-top functionality using wouter's useLocation hook. All project pages now consistently load at the top of the page instead of random scroll positions, improving user navigation experience across the entire portfolio.
- June 27, 2025. Created functional analog clock with accurate time display - built traditional 12-hour analog clock with hour/minute/second hands, proper coordinate system mapping (sin for x-axis, -cos for y-axis), automatic local time zone detection, glassmorphism design, and real-time updates. Fixed hand positioning calculations to correctly map 12 o'clock to top position. Established reusable clock framework for creating multiple clock designs.
- June 28, 2025. Expanded analog clock collection to seven unique designs - created diverse clock styles including: Political Time (golden golf ball with Trump/Vance/taco as hands), Radar Time (military screen with ships/aircraft), Geometric Time (yellow square with colorful shapes), Dry Fluid Time (morphing amoeba), Fluid Time (amoeba with sloshing water), New York Time (apple with landmarks), and traditional Analog Clock. All clocks use same accurate time calculation system with unique visual themes ranging from political satire to military aesthetics to organic fluid animations.
- June 28, 2025. Created dedicated Trump clock page at /projects/trump-clock - standalone minimal page displaying only the political golf ball clock on black background with no text, buttons, or headers. Trump clock now exists in both the analog clock collection and as its own featured page.
- June 28, 2025. Enhanced Trump clock with improved sizing and positioning - removed white center circle, moved Trump and Vance further from center for better spacing, increased all political figures 15% larger (Trump: 46×57.5px, Vance: 34.5×46px), then made taco an additional 15% larger (21.16×26.45px total) for maximum visibility as second hand. Applied changes to both clock locations.
- June 28, 2025. Reorganized projects page with chronological ordering - moved Trump clock card to top position, added posting timestamps to all projects (June 28: Trump/Analog clocks, June 27: Spotify/Camera/Paint/Roulette/Sensor, June 26: Physics/Clock projects), removed duplicate entries. Projects now display posting dates below tags for historical reference.
- June 28, 2025. Fine-tuned Trump clock positioning and rotation - adjusted rotation to +5 degrees for proper nose alignment, moved Trump image further toward clock edge (y: 77px) for better hour hand visibility. Clock now displays accurate time with perfect political figure positioning.
- June 28, 2025. Implemented comprehensive Google Analytics tracking - integrated GA4 with automatic page view tracking, event tracking for bouncing navigation interactions, and proper TypeScript configuration. Analytics now monitor user behavior across all portfolio pages and interactive elements.
- June 28, 2025. Enhanced bubble physics with realistic soap bubble bouncing - implemented 4-second reverberation cycles with exponential decay, natural oscillating deformation (70% squish, 130% stretch), frequency-based vibration (4 reverberations over 4 seconds), collision-triggered physics start, and maintained mobile performance optimization. Navigation bubbles now bounce like real soap bubbles with authentic physics.
- June 28, 2025. Created vintage slot machine project - built classic Las Vegas-style slot machine with 10 unique symbols (cherries to jackpot), three spinning reels with different timing, pullable side handle with animation, realistic coin payout system with falling coins physics, authentic casino sound effects using Web Audio API, comprehensive paytable with three-of-a-kind and two-of-a-kind payouts, vintage yellow and red color scheme with proper casino aesthetics. Added as top project on projects page.
- June 30, 2025. Perfected 20-photo sectional collage system - completely redesigned camera project from kaleidoscope to high-speed composite creator. System captures 20 photos at 4 per second (0.25s intervals), extracts specific grid sections from each photo based on capture order, and creates seamless composite images. Photo 1 contributes top-left section, photo 20 contributes bottom-right section in 5x4 grid. Established as template for future camera variants. Features live viewfinder, real-time grid preview, automatic gallery save, and professional camera interface.
- June 30, 2025. Created optimal camera utilization system with 16×9 rectangles - maximum efficiency camera capturing 144 photos in perfect 16:9 aspect ratio grid (16 cols × 9 rows) at 143fps. Each rectangle fills exactly 1/144th of frame with zero waste, matching natural camera aspect ratios for maximum sensor utilization. Features real-time grid fill visualization showing captured sections in green, current capture rectangle blinking yellow, and live viewfinder with progress overlay during ultra-fast capture sequence.
- June 30, 2025. Updated typography across all projects to serif fonts (Times New Roman, Georgia) matching Internet Archive styling for classic, readable appearance. Applied globally through CSS and Tailwind configuration.
- June 30, 2025. Reorganized camera systems to show most recent first - Optimal Camera Utilization now featured at top, followed by Square Grid, Hexagonal Collage, and Sectional Collage systems.
- June 30, 2025. Enhanced all camera systems with live viewfinder overlays - added real-time capture progress visualization to all cameras showing captured (color-coded), current (yellow), and upcoming (white outline) sections during photo sequences.
- June 30, 2025. Renamed camera systems for better organization - "Hybrid Tessellation Camera" (hex-square), "Ultra-Detail Micro Camera" (80-photo), "Aspect Ratio Camera" (12-photo), "Rapid Square Camera" (100 squares), "Honeycomb Pattern Camera" (hexagons), "Sectional Grid Camera" (20-photo collage).
- June 30, 2025. Complete font system overhaul - replaced all serif fonts (Times New Roman, Georgia) across entire website with modern sans-serif system fonts (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, etc.) for contemporary clean appearance. Retained XanmanWide font exclusively for bouncing navigation bubbles to preserve brand identity. Updated global CSS, Tailwind configuration, and removed explicit fontFamily declarations from all components.
- June 30, 2025. Fixed page title typography and comprehensive background updates - corrected Layout component to only use XanmanWide for "XANDER WALKER" brand title while all page titles use modern sans-serif. Updated camera gallery page from purple gradient to clean white background. Changed analog clock page from blue gradient to white background. Redesigned camera systems page with white background and glassmorphism cards matching resume page styling. Updated American Gladiators page fonts. All pages now feature consistent modern sans-serif typography with clean white backgrounds and professional glassmorphism styling.
- June 30, 2025. Created centralized font configuration system for easy future updates - fixed roulette wheel fonts, added CSS variables (--primary-font-family, --brand-font-family) in index.css, updated Tailwind configuration to use CSS variables, created font utility classes (.font-primary, .font-brand), and documented system in FONT_CONFIG.md. Now future font changes require updating only two CSS variables instead of searching/replacing across multiple files.
- June 30, 2025. Fixed Hybrid Tessellation Camera with proper octagon-square tessellation - created authentic geometric pattern where 8×8 grid of octagons with small squares fill gaps, each photo contributes only its corresponding section (not full photo), updated live viewfinder overlay to match tessellation pattern. True tessellation where shapes interlock properly.
- June 30, 2025. Fixed header typography overflow issues - reduced font sizes from extremely large (8xl-12rem) to reasonable sizes (3xl-5xl), added text wrapping with break-words, added proper padding and overflow controls, improved responsive design across all screen sizes.
- June 30, 2025. Simplified social media sharing metadata - updated all meta descriptions, Open Graph tags, and Twitter Card tags to simply display "Xander Walker" instead of lengthy website descriptions for cleaner link previews in Instagram messages and text messages.
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
Development workflow: Edit files directly in Replit web interface, then use Replit's built-in git tools to commit and push changes to GitHub for automatic deployment to Vercel.
```