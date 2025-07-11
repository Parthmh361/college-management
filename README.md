# College Management System

A comprehensive, production-ready college management system built with Next.js 15, TypeScript, MongoDB, and modern UI components. Features real QR code attendance scanning, role-based dashboards, real-time chat, and comprehensive analytics.

## ✨ Features

### Core Functionality
- **🔐 Authentication & Authorization**: JWT-based authentication with role-based access control
- **👥 User Management**: Support for Admin, Teacher, Student, Parent, and Alumni roles
- **📱 QR-based Attendance**: Real camera-based and file upload QR code scanning for attendance
- **💬 Real-time Chat**: Socket.IO powered messaging system
- **🔔 Notifications**: Email notifications and in-app notifications system
- **📊 Analytics**: Comprehensive attendance trends, performance analytics, and reporting
- **🎨 Modern UI**: Built with Tailwind CSS and ShadCN UI components

### QR Attendance System
- **Teacher Features**: Generate time-limited QR codes with location constraints
- **Student Features**: Scan QR codes using camera or uploaded images
- **Security**: Location validation, time limits, and duplicate scan prevention
- **Real-time Updates**: Instant attendance marking and notifications

### Role-specific Dashboards
- **Admin**: Full system oversight, user management, system analytics
- **Teacher**: QR code generation, attendance management, class analytics
- **Student**: QR scanning, personal attendance tracking, notifications
- **Parent**: Child attendance monitoring, academic progress tracking
- **Alumni**: Network features and updates

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB (Mongoose)
- **Authentication**: JWT, bcryptjs
- **Real-time**: Socket.IO
- **Email**: Nodemailer
- **QR Codes**: qrcode, html5-qrcode, qr-scanner
- **UI Components**: ShadCN UI, Radix UI
- **Charts**: Recharts

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB (local installation or MongoDB Atlas)
- Modern web browser with camera access for QR scanning
- SMTP server for email notifications (optional)

## 🚀 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd college-management-system
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env.local` file with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/college_management
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   ```
   ```

4. **Start MongoDB**:
   Make sure MongoDB is running on your system or use MongoDB Atlas.

5. **Seed the database** (optional):
   ```bash
   npm run seed
   ```

6. **Run the development server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing the QR Attendance System

### For Teachers:
1. Login with teacher credentials
2. Navigate to "QR Codes" section
3. Generate a QR code for a subject with:
   - Subject selection
   - Class start/end times
   - Location (auto-detected or manual)
   - Expiry duration
4. Share the generated QR code with students

### For Students:
1. Login with student credentials
2. Navigate to "Scan QR" section
3. Test both scanning methods:
   - **Camera Scan**: Point camera at QR code
   - **Upload Image**: Upload a screenshot of the QR code
4. Verify attendance is marked and notifications appear

### Location Testing:
- QR codes can include location constraints
- Students must be within the specified radius to mark attendance
- Use browser location services for testing

## 🚀 Production Deployment

### Using Vercel (Recommended)

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**:
   ```bash
   npm install -g vercel
   vercel --prod
   ```

3. **Environment Variables**:
   Add these in Vercel dashboard:
   ```
   MONGODB_URI=your-mongodb-atlas-connection-string
   JWT_SECRET=your-production-jwt-secret
   SMTP_USER=your-production-email
   SMTP_PASS=your-production-email-password
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   ```

### Using Docker

1. **Create Dockerfile**:
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Build and run**:
   ```bash
   docker build -t college-management .
   docker run -p 3000:3000 college-management
   ```

## 👥 Demo Credentials

After seeding the database, you can use these credentials:

- **Admin**: `admin@college.edu` / `admin123`
- **Teacher**: `teacher@college.edu` / `teacher123`
- **Student**: `student@college.edu` / `student123`
- **Parent**: `parent@college.edu` / `parent123`
- **Alumni**: `alumni@college.edu` / `alumni123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Verify JWT token

### User Management
- `GET /api/users` - List users (Admin/Teacher only)
- `PUT /api/users` - Update user profile

### QR Code & Attendance
- `POST /api/qr/generate` - Generate QR code (Teacher/Admin only)
- `POST /api/qr/scan` - Scan QR code for attendance
- `GET /api/attendance` - Get attendance records

### Chat System
- `GET /api/chat/messages` - Get chat messages
- `POST /api/chat/messages` - Send message
- `GET /api/chat/contacts` - Get chat contacts

### Notifications
- `GET /api/notifications` - Get notifications
- `POST /api/notifications` - Send notification (Admin/Teacher only)
- `PATCH /api/notifications` - Mark as read/unread

### Analytics
- `GET /api/analytics` - Get various analytics data

## Real-time Features

The application includes real-time features powered by Socket.IO:

- **Live Chat**: Real-time messaging between users
- **Attendance Updates**: Live attendance notifications
- **System Notifications**: Real-time system-wide announcements

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── login/            # Login page
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── ui/               # ShadCN UI components
│   └── DashboardLayout.tsx
├── lib/                   # Utility libraries
│   ├── auth.ts           # JWT utilities
│   ├── email.ts          # Email service
│   ├── middleware.ts     # Auth middleware
│   ├── mongodb.ts        # MongoDB connection
│   ├── seed.ts           # Database seeding
│   └── socket.ts         # Socket.IO setup
├── models/               # Mongoose schemas
│   ├── User.ts
│   ├── Subject.ts
│   ├── Attendance.ts
│   ├── QRCode.ts
│   ├── Chat.ts
│   └── Notification.ts
└── types/                # TypeScript type definitions
    └── index.ts
```

## Features in Detail

### User Roles & Permissions

- **Admin**: Full system access, user management, analytics
- **Teacher**: Subject management, QR generation, student analytics
- **Student**: Attendance scanning, view progress, chat
- **Parent**: View child's attendance and progress
- **Alumni**: Basic profile and networking features

### Attendance System

- Teachers can generate time-limited QR codes for classes
- Students scan QR codes to mark attendance
- Real-time attendance tracking and notifications
- Automatic email alerts for low attendance

### Chat System

- Real-time messaging between users
- Role-based chat permissions
- Message history and status tracking
- Typing indicators and online status

### Analytics Dashboard

- Attendance trends and patterns
- Student performance analytics
- QR code usage statistics
- Custom date range filtering

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
