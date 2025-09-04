# Juba Platform

An "Uber for odd jobs" platform connecting clients with local freelancers for services like painting, plumbing, electrical work, etc.

## Tech Stack

- Backend: Node.js with Express.js
- Frontend: React
- Database: Supabase PostgreSQL
- Authentication: Google Sign-In
- Payment: South African-compatible payment API
- Deployment: Mobile web app

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account
- Google OAuth credentials
- South African payment gateway account

### Installation

1. Clone the repository
2. Run `npm run install-all` to install both server and client dependencies
3. Set up your environment variables in `.env` file
4. Run database migrations in Supabase SQL editor
5. Start the development server with `npm run dev`

### Environment Variables

See `.env` file for all required environment variables.

## Features

- User authentication with Google Sign-In
- Job posting and application system
- Real-time chat between clients and freelancers
- Payment processing with escrow system
- Admin dashboard for platform management
- Mobile-optimized responsive design

## API Documentation

The API endpoints are organized as follows:

- `/api/users` - User authentication and management
- `/api/jobs` - Job posting and management
- WebSocket connections for real-time chat

## Deployment

The application is designed to be deployed as a mobile web app. The React frontend can be built with `npm run build` and served as static files.

## License

This project is proprietary software.
