# PAKETY - Grocery Shopping Application

## Overview
PAKETY is a modern grocery shopping web application designed for a mobile-first experience. It enables users to browse categories, view products, manage a shopping cart with real-time updates, and utilize secure user authentication. The project aims to provide a clean, efficient, and user-friendly platform for online grocery shopping, with a focus on seamless integration between web and native mobile experiences, particularly for driver notifications and payment processing.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **UI**: Shadcn/ui components, Radix UI primitives, Tailwind CSS (custom design tokens)
- **State Management**: Zustand (client-side), TanStack React Query (server-state)
- **Routing**: Wouter
- **Animations**: Framer Motion
- **Build Tool**: Vite
- **Design**: Mobile-first, professional UI with modern aesthetics (rounded elements, blurred overlays), RTL Arabic layout support, consistent typography (Cairo font).

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ES modules)
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (Neon serverless compatible)
- **Authentication**: Custom system with JWT tokens and PostgreSQL session storage.
- **API**: RESTful endpoints with Zod validation for data, centralized error handling.
- **Real-time**: WebSocket support for instant notifications and synchronization.

### Project Structure
- **Monorepo**: Client and server code co-located.
- **Shared Types**: Common schema definitions in `/shared`.
- **Component Organization**: Feature-based.

### Core Features
- **Product Management**: Categories, products with pricing and images, shopping cart with real-time updates.
- **User Management**: Authentication (login, signup), user profiles, address management.
- **Order Management**: Order creation, status updates, invoice generation (PDF).
- **Payment System**: Wallet top-up via external payment gateways (Zaincash integration).
- **Notifications**: Real-time push notifications for drivers (Expo), WhatsApp notifications for users (OTP, invoices, order updates) and admin.
- **Admin Panel**: Comprehensive dashboard for order management, user management, product/category management, real-time synchronization.

### System Design Choices
- **Data Flow**: Optimistic UI updates for cart/interactions, server synchronization via React Query, background refetching.
- **Security**: Robust session management, JWT authentication, secure token storage (Expo SecureStore), fraud prevention for payments, cache invalidation for sensitive data.
- **Error Handling**: Comprehensive error handling at API and UI levels, graceful degradation, fallback mechanisms for critical services (e.g., OTP delivery).
- **Internationalization**: Full Arabic language support, RTL layout, professional Arabic messaging.
- **Performance**: Lazy loading for images, optimized animations, fast API responses, silent background processes for non-critical tasks (e.g., PDF generation).

## External Dependencies

### Frontend
- **UI Framework**: React
- **Styling**: Tailwind CSS, Radix UI
- **Data Fetching**: TanStack React Query
- **Animations**: Framer Motion
- **Forms**: React Hook Form, Zod

### Backend
- **Database**: Neon PostgreSQL
- **ORM**: Drizzle ORM, Drizzle Kit (migrations)
- **Session Management**: Connect-pg-simple
- **Payment Gateway**: Zaincash
- **WhatsApp API**: WasenderAPI (primary), whatsapp-web.js (legacy/fallback for specific features)
- **OTP Service**: VerifyWay
- **Push Notifications**: Expo Push Notifications
- **PDF Generation**: Playwright (for server-side PDF rendering)
- **WhatsApp Utility**: Baileys (for specific features, being phased out)
- **Image Upload**: Express.js (configured for increased limits)

### Development Tools
- **Build System**: Vite, ESBuild
- **Type Safety**: TypeScript
- **Code Quality**: ESLint, Prettier
- **Testing**: Playwright (for PDF generation context)