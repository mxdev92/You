# PAKETY - Grocery Shopping Application

## Overview

PAKETY is a modern grocery shopping web application built with a full-stack architecture using React, Express, PostgreSQL, and custom authentication system. The application provides a clean, mobile-first interface for browsing grocery categories, viewing products, and managing a shopping cart with real-time updates and secure user authentication.

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
July 4, 2025:
✓ Replaced all native browser alert() dialogs with professional custom modal notifications
✓ Added blur overlay (backdrop-blur-sm) with rounded-2xl edges for modern appearance  
✓ Implemented notification system in both auth page and cart checkout functionality
✓ Added proper Arabic text support with Cairo font for notification messages
✓ Created reusable notification state with automatic 3-second timeout
✓ Enhanced z-index layering (z-[200]) to ensure notifications appear above all content
✓ Added success/error visual indicators with appropriate colors and emojis
✓ Streamlined signup process from 6 steps to 3 professional steps
✓ Step 1: Email, password, and confirm password (account credentials)
✓ Step 2: Full name and phone number (personal information)  
✓ Step 3: Governorate, district, and landmark (delivery address)
✓ Enhanced form validation with proper email format checking
✓ Improved user experience with smoother flow and reduced complexity
✓ Fixed invoice customer information formatting with proper aligned lines
✓ Updated "معلومات العميل" section to show الاسم، رقم الموبايل، العنوان format
✓ Removed email from invoice display (email is for authentication only)
✓ Added aligned customer information in both PDF and admin panel invoice displays
✓ Enhanced address display format: (المحافظة - المنطقة - اقرب نقطة دالة)
✓ Added visual checkmark indicator (✓) when "تحديد الكل" is selected in admin panel
✓ Enhanced select all feedback with green color and "تم تحديد الكل" message
✓ Improved admin panel UX with clear visual indicators for selection states
✓ Fixed critical address persistence issue after page refresh
✓ Added auto-loading of saved addresses when user is authenticated
✓ Integrated PostgreSQL addresses into cart checkout flow
✓ Cart now displays saved delivery address in checkout screen
✓ Order placement uses authentic customer data from saved addresses
✓ Session management fully operational with express-session middleware
✓ Complete PostgreSQL authentication system working end-to-end
✓ Completely rebuilt PDF invoice generator with professional black/gray design
✓ Removed PAKETY branding and borders from customer info section per user request
✓ Implemented compact design with smaller elements for maximum space efficiency
✓ Added table support for up to 25 items as requested
✓ Added ملاحظات (Notes) and وقت التوصيل (Delivery Time) sections
✓ Integrated custom logo as header positioned above customer info and QR sections
✓ Professional layout: logo header, customer info left, QR/order details right
✓ Added delivery fee structure: مجموع الطلبات الكلي، اجور خدمة التوصيل، المبلغ الاجمالي
✓ Fixed Playwright browser configuration to use system chromium on Replit
✓ PDF generation working perfectly with 164KB professional invoices

July 3, 2025:
✓ Built comprehensive Store API for Expo React Native integration
✓ Added real-time WebSocket support for instant order notifications
✓ Created 10 specialized endpoints for store management operations
✓ Implemented printer integration support with formatted print data
✓ Added order status management with bulk operations
✓ Built comprehensive statistics dashboard for store insights
✓ Created automatic print triggering when new orders arrive
✓ Added today's orders summary and filtering by status
✓ Implemented mark-as-printed functionality for tracking
✓ Fixed authentication flow to use unified 2-step signup modal
✓ Removed old login/signup system and consolidated into modern modal
✓ Updated sidebar to require authentication for all features professionally

July 2, 2025:
✓ Fixed critical categories stability issue - categories now maintain stable order
✓ Added displayOrder column to categories table for consistent positioning
✓ Set stable category order: خضروات (1), فواكه (2), مخبوزات (3), Dairy (4), Seafood (5), Meat (6)
✓ Implemented numbered position system (1-10) in admin panel with real-time updates
✓ Fixed category selection to work with only one selected at a time
✓ Updated DatabaseStorage to sort categories by displayOrder for consistency
✓ Implemented Playwright server-side PDF generation with Arabic RTL support
✓ Created professional invoice layout with proper Arabic text rendering
✓ Added compact PDF design to support 20+ items per page
✓ Positioned company name "ORDERY" at top center with QR code placeholder
✓ Fixed Arabic totals alignment (labels right, prices left)
✓ Optimized space usage with smaller fonts and reduced margins
✓ Added real selectable Arabic text (not screenshots)

July 1, 2025:
✓ Rebranded application from KiwiQ to "Yalla JEETEK" (يلا جيتك)
✓ Updated login page to be completely in Arabic using Cairo font
✓ Replaced kiwi logo with bold Arabic text "يلا جيتك" in login page
✓ Updated app name throughout translations (English: "Yalla JEETEK", Arabic: "يلا جيتك")
✓ Applied bold Cairo font to Arabic branding elements
✓ Created fast-loading admin panel with instant load times
✓ Simplified admin header with minimal design (only list icon)
✓ Removed Firebase loading delays from admin panel for better UX

June 29, 2025:
✓ Built professional admin panel with Firebase integration
✓ Implemented comprehensive orders management system
✓ Added Firebase Firestore database for real-time order tracking
✓ Created order status management (pending, confirmed, preparing, out-for-delivery, delivered, cancelled)
✓ Integrated order placement from checkout to Firebase database
✓ Added detailed order view with customer information and items breakdown
✓ Implemented order statistics dashboard with revenue tracking
✓ Added admin navigation button in header for easy access
✓ Created order filtering by status functionality
✓ Built responsive admin interface with professional styling

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