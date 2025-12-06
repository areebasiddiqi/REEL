# ReelTalk - Live Streaming & Content Platform

A comprehensive platform for livestreaming, video uploads, challenges, and creator subscriptions built with Next.js, Firebase, and Stripe.

## Features

- 🔐 **Authentication**: Email/password, Google OAuth, and Apple Sign-In
- 📡 **Live Streaming**: WebRTC-based livestreaming with real-time chat
- 🎥 **Video Upload**: Upload and share videos with privacy controls
- 🏆 **Challenges**: Create and participate in community challenges
- 💳 **Subscriptions**: Three-tier platform subscriptions ($10, $100, $200)
- 👥 **Creator Memberships**: Support creators with custom membership tiers
- 💬 **Real-time Chat**: Live comments on streams and videos

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Payments**: Stripe
- **Real-time**: Firebase Realtime Database & Firestore
- **Video Streaming**: WebRTC with simple-peer

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase project created
- Stripe account (for payments)
- (Optional) Apple Developer account for Apple Sign-In

### Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment variables**:

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Stripe Price IDs (create in Stripe Dashboard)
STRIPE_PRICE_BASIC=price_basic_id
STRIPE_PRICE_PRO=price_pro_id
STRIPE_PRICE_PREMIUM=price_premium_id

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication:
   - Email/Password
   - Google
   - Apple (requires Apple Developer account)
4. Create Firestore Database (start in production mode)
5. Create Storage bucket
6. Copy configuration to `.env.local`

### Stripe Setup

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create three subscription products:
   - Basic: $10/month
   - Pro: $100/month
   - Premium: $200/month
3. Copy price IDs to `.env.local`
4. Set up webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
5. Copy webhook secret to `.env.local`

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── checkout/      # Stripe checkout
│   │   └── webhooks/      # Stripe webhooks
│   ├── dashboard/         # User dashboard
│   ├── login/             # Login page
│   ├── signup/            # Signup page
│   └── page.tsx           # Landing page
├── components/            # React components (to be created)
│   ├── layout/           # Header, Sidebar, Footer
│   ├── livestream/       # Livestream components
│   ├── video/            # Video components
│   ├── challenges/       # Challenge components
│   └── subscription/     # Subscription components
├── contexts/             # React contexts
│   └── AuthContext.tsx   # Authentication context
├── hooks/                # Custom React hooks
│   └── useAuth.ts        # Auth hook
├── lib/                  # Library configurations
│   └── firebase.config.ts # Firebase setup
├── services/             # Business logic
│   ├── auth-service.ts   # Authentication
│   ├── livestream-service.ts # Livestreaming
│   ├── video-service.ts  # Video management
│   ├── challenge-service.ts # Challenges
│   └── comment-service.ts # Comments
├── types/                # TypeScript types
│   └── index.ts          # All type definitions
└── utils/                # Utility functions
    ├── formatters.ts     # Format helpers
    ├── validators.ts     # Validation helpers
    └── premium-content.ts # Access control
```

## Key Features Implementation

### Authentication
- Email/password signup and login
- Google OAuth integration
- Apple Sign-In support
- Protected routes with authentication context

### Livestreaming
- Create livestreams with metadata
- Real-time viewer count
- Live chat with Firestore
- Join/leave stream functionality

### Video Upload
- Firebase Storage integration
- Upload progress tracking
- Video metadata management
- Privacy controls (public/subscribers/members)

### Challenges
- Create challenges with requirements
- Join and submit completions
- Track participants and completions
- Premium challenge support

### Subscriptions
- Three platform tiers ($10, $100, $200)
- Stripe checkout integration
- Webhook handling for subscription events
- Premium content access control

## Development

### Build for Production

```bash
npm run build
```

### Run Production Build

```bash
npm start
```

### Linting

```bash
npm run lint
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Google Cloud Run
- Self-hosted with Docker

## Environment Variables

Make sure to set all environment variables in your deployment platform.

## Firestore Security Rules

Add these security rules to your Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Livestreams
    match /livestreams/{streamId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.creatorId == request.auth.uid;
    }
    
    // Videos
    match /videos/{videoId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.creatorId == request.auth.uid;
    }
    
    // Challenges
    match /challenges/{challengeId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.creatorId == request.auth.uid;
    }
  }
}
```

## Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /videos/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Contributing

This is a private project. For questions or issues, contact the development team.

## License

Proprietary - All rights reserved
