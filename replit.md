# KiwiQ - Grocery Shopping Application

## Overview

KiwiQ is a modern grocery shopping web application built with a full-stack architecture using React, Express, PostgreSQL, and Firebase Authentication. The application provides a clean, mobile-first interface for browsing grocery categories, viewing products, and managing a shopping cart with real-time updates and secure user authentication.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: 
  - Zustand for client-side state (search, category selection)
  - TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Animations**: Framer Motion for smooth transitions and interactions
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **Development**: Hot reloading with Vite middleware integration

### Project Structure
- **Monorepo Layout**: Client and server code in same repository
- **Shared Types**: Common schema definitions in `/shared` directory
- **Component Organization**: Feature-based component structure
- **UI Components**: Reusable component library in `/client/src/components/ui`

## Key Components

### Database Schema
- **Categories**: Product categories with icons and selection state
- **Products**: Items with pricing, images, and category relationships
- **Cart Items**: Shopping cart with quantity tracking and timestamps

### Core Features
- **Category Navigation**: Horizontal scrolling category selector
- **Product Grid**: Responsive product display with search and filtering
- **Shopping Cart**: Slide-out cart with add/remove functionality
- **Mobile-First Design**: Optimized for mobile with sidebar navigation

### API Structure
- **RESTful Endpoints**: Standard CRUD operations for categories, products, and cart
- **Data Validation**: Zod schema validation for request/response data
- **Error Handling**: Centralized error handling with proper HTTP status codes

## Data Flow

1. **Category Selection**: User selects category → Updates local state → Triggers product fetch
2. **Product Browsing**: Products fetched based on selected category → Displayed in responsive grid
3. **Cart Management**: Add to cart → Optimistic updates → Server synchronization → Cache invalidation
4. **Real-time Updates**: React Query handles background refetching and cache management

## External Dependencies

### Frontend Dependencies
- **UI Framework**: React ecosystem with modern hooks
- **Styling**: Tailwind CSS with Radix UI components
- **Data Fetching**: TanStack React Query for server state
- **Animations**: Framer Motion for enhanced UX
- **Forms**: React Hook Form with Zod validation

### Backend Dependencies
- **Database**: Neon PostgreSQL serverless database
- **ORM**: Drizzle ORM with automatic migrations
- **Session Management**: Connect-pg-simple for PostgreSQL sessions
- **Development**: TSX for TypeScript execution

### Development Tools
- **Build System**: Vite with React plugin
- **Type Safety**: TypeScript with strict configuration
- **Code Quality**: ESLint and Prettier (implicitly configured)
- **Database Migrations**: Drizzle Kit for schema management

## Deployment Strategy

### Production Build
- **Frontend**: Vite builds optimized static assets to `/dist/public`
- **Backend**: ESBuild bundles server code to `/dist/index.js`
- **Database**: Migrations applied via `drizzle-kit push`

### Hosting Configuration
- **Platform**: Replit with autoscale deployment
- **Port Configuration**: Internal port 5000, external port 80
- **Environment**: Production mode with NODE_ENV=production
- **Static Files**: Express serves built frontend assets

### Development Workflow
- **Hot Reloading**: Vite dev server with Express API proxy
- **Database**: Local PostgreSQL with environment-based connection
- **Module System**: ES modules throughout the application

## Recent Changes

```
June 25, 2025:
✓ Rebranded application from QiwiQ to KiwiQ
✓ Updated professional logo design with modern gradient and stylized "Q"
✓ Added authentic kiwi fruit logo with realistic cross-section design
✓ Implemented Arabic language support with Cairo font
✓ Added Arabic text support while maintaining LTR UI layout
✓ Added language selector in settings with English/Arabic options
✓ Implemented category name translations (فواكه for Fruits, خضروات for Vegetables)
✓ Added product name translations (تفاح عضوي for Organic Apples, سبانخ طازجة for Fresh Spinach)
✓ Added search placeholder translation and full UI text localization

June 24, 2025:
✓ Enhanced mobile responsiveness with cross-device compatibility
✓ Added rounded bottom edges to header for modern design
✓ Optimized category icons with larger rounded-rectangle backgrounds
✓ Implemented touch-friendly interactions for Android/iOS
✓ Added safe area support and proper viewport handling
✓ Cross-browser compatibility improvements
✓ Integrated Firebase Authentication with professional login page
✓ Added user authentication flow with email/password
✓ Updated app branding to KiwiQ with modern design
✓ Integrated custom kiwi fruit logo design throughout the app
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```