# Cricket-Score-App

A comprehensive, real-time cricket scoring application built with Next.js, Firebase, and TypeScript. This app allows users to score live cricket matches, view detailed statistics, and track match progress in real-time.

## 🛠️ Features

### 🏏 Live Match Scoring
- **Real-time Updates**: All scoring actions are instantly reflected for all users.
- **Ball-by-Ball Commentary**: Detailed recording of every ball including runs, extras, wickets, and bowler details.
- **Multiple Extras**: Supports Wides, No Balls, Byes, and Leg Byes.
- **Wicket Management**: Comprehensive wicket tracking including LBW, Bowled, Caught, Run Out, Stumped, Hit Wicket, and Obstructing the Field.
- **Innings Management**: Complete control over innings with transitions and score updates.
- **Match State Management**: Complete scoring logic including run calculations, legal ball tracking, and score accumulation.
- **Undo Actions**: Built-in rollback functionality for the last scoring action.
- **Over System**: Automatic over calculation and bowler rotation.
- **Player Statistics**: Real-time updates for individual player runs, balls, strike rate, economy, and wickets.
- **Match History**: A complete history of all matches played.

### 👥 User & Authentication
- **Anonymous Sign-In**: Users can sign in anonymously to access the scoring features.
- **Email/Password Authentication**: Standard email and password sign-in options.
- **Google Sign-In**: Social login integration with Google.
- **Session Management**: Persistent user sessions using Firebase Authentication.

### 📊 Scorecard Views
- **Live Scorecard**: Displays the current state of the match including runs, wickets, overs, and partnerships.
- **Detailed Scorecard**: Comprehensive breakdown of each batsman's performance and bowling figures.
- **Innings Summary**: Complete statistics for each completed inning.
- **Match Summary**: Final results including Man of the Match and Win/Loss status.
- **Historical Scorecards**: Access to all past match scorecards.

### 🎨 UI & Design
- **Responsive Design**: Built with Tailwind CSS for optimal viewing on all devices.
- **Modern Components**: Utilizesshadcn/ui components for a polished look.
- **Custom Fonts**: Features "Outfit" and "Radio Canada Big" fonts for a premium feel.
- **Custom Cursor**: Integrated custom cursor for a unique user experience.

## 🚀 Getting Started

### Prerequisites
- **Node.js**: Version 18 or higher.
- **npm**: Version 9 or higher.
- **Firebase Project**: A Firebase project with Firestore and Authentication enabled.

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Cricket-Score-App
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration
1. Create a `.env.local` file in the root directory:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Firebase configuration to `.env.local`:
   ```env
   # Firebase Configuration
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your_auth_domain
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   FIREBASE_APP_ID=your_app_id
   ```

### Running the App
Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

## 🏗️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (React Framework)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) + [immer](https://immer.js.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Firebase**: Authentication, Firestore Database
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Runtime**: [Node.js](https://nodejs.org/)

## 📂 Project Structure

```
Cricket-Score-App/
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── matches/        # Match-related pages (scoring, list, scorecard)
│   │   ├── auth/           # Authentication pages
│   │   ├── page.tsx        # Home page
│   │   └── ...
│   ├── components/         # Reusable UI components
│   ├── firebase/           # Firebase initialization and utilities
│   │   ├── client-provider.tsx # Firebase client provider
│   │   ├── error-emitter.ts  # Error handling
│   │   ├── errors.ts       # Error definitions
│   │   ├── non-blocking-updates.ts # Firestore update helpers
│   │   └── provider.tsx      # Firebase server provider
│   ├── lib/                # Core logic
│   │   ├── match-store.ts  # Match state management
│   │   └── scoring-engine.ts # Match scoring logic
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   └── ...
├── .env.local              # Environment variables
└── package.json            # Project dependencies
```

## 🧪 Testing

Run tests:
```bash
npm test
```

## 📝 License

This project is proprietary and built for educational and demonstration purposes. All rights reserved.
