# InClass - Modern Attendance Tracking System

![InClass Banner](./src/assets/hero-classroom.jpg)

InClass is a comprehensive Progressive Web App (PWA) designed to revolutionize university attendance tracking through secure QR code technology.

## Project info

**URL**: https://inclass-rtl.lovable.app

## 🎯 Features

### Core Functionality

- ✅ **Role-Based Authentication**: Separate interfaces for lecturers and students
- ✅ **QR Code Generation**: Time-limited, secure QR codes for each class session
- ✅ **Real-time Scanning**: Instant QR code scanning with immediate confirmation
- ✅ **Session Management**: Start/stop attendance sessions with customizable durations

### History & Reports

- ✅ **Attendance History**: Complete attendance records with statistics
- ✅ **Report Generation**: Export data as PDF and CSV
- ✅ **Student Analytics**: Visual charts showing attendance patterns
- ✅ **Session History**: Detailed view of past sessions with attendee counts

### Security & Notifications

- ✅ **Fraud Prevention**: Screenshot detection and duplicate scan prevention
- ✅ **Device Fingerprinting**: Track and limit scanning devices
- ✅ **Location Verification**: Optional GPS-based attendance validation
- ✅ **Browser Notifications**: Real-time alerts for active sessions
- ✅ **Security Monitoring**: Anti-fraud measures and session security

### Analytics & Polish

- ✅ **Advanced Analytics**: Detailed insights into attendance trends
- ✅ **Peak Hours Analysis**: Identify optimal class times
- ✅ **Student Participation**: Track engagement across sessions
- ✅ **Beautiful UI**: Modern, polished interface with smooth animations
- ✅ **Responsive Design**: Optimized for mobile, tablet, and desktop

## 🛠️ Tech Stack

- **Frontend**: React 18+ with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Build Tool**: Vite & capacitor
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase real-time subscriptions
- **Charts**: Recharts
- **QR Codes**: qrcode.js & html5-qrcode
- **Reports**: jsPDF & jspdf-autotable

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Supabase account (via Lovable Cloud)

### Installation

```sh
# Step 1: Clone the repository
git clone [https://github.com/mickey-unhinged/inclass-your-buddy.git]

# Step 2: Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Step 3: Install dependencies
npm install
# or
bun install

# Step 4: Start the development server
npm run dev
# or
bun dev
```

Open your browser to `http://localhost:5173`

## 📱 User Roles

### Lecturer Dashboard

- Create and manage classes
- Generate QR codes for attendance sessions
- View real-time attendance feed
- Export reports (PDF/CSV)
- Access advanced analytics
- View session history

### Student Dashboard

- Scan QR codes to mark attendance
- View personal attendance history
- See attendance statistics and charts
- Manage notification preferences
- Configure location services

## 🔐 Security Features

- **Time-Limited QR Codes**: Automatically expire after session duration
- **Screenshot Prevention**: Detects and alerts on screenshot attempts
- **Duplicate Prevention**: Blocks multiple scans per student per session
- **Device Fingerprinting**: Limits scanning to registered devices
- **Location Verification**: Optional GPS validation (100m radius)
- **RLS Policies**: Row-level security on all database tables

## 📊 Analytics Dashboard

The advanced analytics page provides:

- Total session count
- Average attendance per session
- Unique student participation
- Attendance trends over time
- Peak attendance hours
- Student participation distribution

## 🎨 Design System

InClass uses a comprehensive design system with:

- HSL-based color tokens
- Semantic color naming
- Dark mode support
- Custom gradients and shadows
- Smooth animations
- Responsive grid layouts

## 📄 Database Schema

### Key Tables

- `profiles`: User information
- `user_roles`: Role assignments (lecturer/student/admin)
- `classes`: Course information
- `attendance_sessions`: Session metadata
- `attendance_records`: Individual attendance entries

## 🔧 Configuration

### Notification Settings

Enable browser notifications for:

- Active session alerts
- Attendance reminders
- Low attendance warnings
- Assignment reminders

### Location Services

Configure GPS verification:

- Classroom location setup
- Verification radius (default: 100m)
- Override permissions for special cases

## 🎓 Perfect For

- Universities and colleges
- Educational institutions
- Training centers
- Workshops and seminars
- Corporate training programs

## 📝 License

MIT License - See LICENSE file for details

---

**InClass** - Transforming attendance tracking for modern education 🎓
