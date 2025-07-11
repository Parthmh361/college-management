<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# College Management System - Copilot Instructions

This is a Next.js 14 full-stack college management system with the following tech stack:

## Tech Stack
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS, ShadCN UI
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt password hashing
- **Real-time**: Socket.IO for chat and live updates
- **QR Codes**: QRCode generation and scanning for attendance
- **Email**: Nodemailer for notifications

## Key Features
1. **Authentication System**: JWT-based auth with role-based access (Admin, Teacher, Student, Parent, Alumni)
2. **Attendance Management**: QR code-based attendance with location verification
3. **Real-time Chat**: Socket.IO powered messaging system with typing indicators
4. **Notification System**: In-app and email notifications
5. **Analytics Dashboard**: Attendance trends and performance metrics
6. **User Management**: Role-based user profiles and permissions

## Code Style Guidelines
- Use TypeScript for type safety
- Follow Next.js App Router patterns
- Use ShadCN UI components for consistent design
- Implement proper error handling and validation
- Use Mongoose schemas with proper validation
- Follow RESTful API design principles
- Implement proper authentication middleware
- Use proper TypeScript interfaces and types

## Project Structure
- `/src/app/api/` - API routes
- `/src/components/` - Reusable UI components
- `/src/lib/` - Utility functions and configurations
- `/src/models/` - Mongoose database models
- `/src/types/` - TypeScript type definitions
- `/src/hooks/` - Custom React hooks
- `/src/app/(auth)/` - Authentication pages
- `/src/app/(dashboard)/` - Dashboard pages

## Database Models
- User (with roles: Admin, Teacher, Student, Parent, Alumni)
- Subject (course management)
- Attendance (with QR code tracking)
- QRCode (attendance QR codes with expiry)
- Chat (messaging system)
- Notification (system notifications)

## Authentication Flow
- JWT tokens stored in HTTP-only cookies
- Role-based route protection
- Password hashing with bcrypt
- User verification system

When generating code:
1. Always use TypeScript
2. Follow Next.js 14 App Router conventions
3. Use ShadCN UI components when possible
4. Implement proper error handling
5. Add appropriate TypeScript types
6. Follow the established project structure
7. Use Mongoose for database operations
8. Implement proper validation and sanitization
