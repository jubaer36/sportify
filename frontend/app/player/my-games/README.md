# My Games/Tournaments Feature

## Overview
This feature allows players to view all tournaments they are participating in. The page displays tournaments in a beautiful card layout with comprehensive information about each tournament.

## API Endpoints Used

### 1. Get User Profile
- **Endpoint**: `GET /api/users/profile`
- **Authentication**: Bearer token required
- **Purpose**: Fetches the current user's profile to get their userId

### 2. Get User's Tournaments  
- **Endpoint**: `GET /api/tournaments/user/{userId}`
- **Authentication**: Bearer token required
- **Purpose**: Fetches all tournaments where the user is a team member

## Features

### Tournament Cards Display
- **Card Layout**: Each tournament is displayed in an attractive card with gradient borders
- **Status Indicators**: Visual status badges (Upcoming/Ongoing/Completed) with color coding
- **Tournament Information**:
  - Tournament name and sport
  - Format (Round Robin or Knockout)
  - Start and end dates
  - Organizer information
  - Results (Champion and Runner-up) if available

### Status Categories
- **🔵 Upcoming**: Tournaments that haven't started yet
- **🟢 Ongoing**: Currently active tournaments  
- **🟠 Completed**: Finished tournaments with results

### Responsive Design
- **Mobile-first**: Optimized for all screen sizes
- **Grid Layout**: Responsive grid that adapts to screen width
- **Touch-friendly**: Mobile-optimized interactions

### Loading States
- **Loading Spinner**: Elegant loading animation
- **Error Handling**: User-friendly error messages with retry functionality
- **Empty State**: Informative message when no tournaments are found

## File Structure

```
frontend/app/player/my-games/
├── page.tsx           # Main React component
├── my-games.css       # Styling
└── README.md          # This documentation

frontend/types/
├── api.ts             # TypeScript interfaces
└── css.d.ts           # CSS module declarations
```

## Usage

1. **Authentication**: User must be logged in with a valid token stored in localStorage
2. **Navigation**: Access via player sidebar "My Games" link or direct URL `/player/my-games`
3. **Permissions**: Available to users with ADMIN, CAPTAIN, or PLAYER roles

## Technical Implementation

### State Management
- Uses React hooks (useState, useEffect) for state management
- Manages loading, error, and data states separately

### API Integration
- Utilizes the centralized `makeAuthenticatedRequest` utility
- Handles authentication errors and redirects appropriately
- Implements proper error handling and user feedback

### Styling Approach
- **CSS Custom Properties**: Uses CSS variables for consistent theming
- **Gradient Backgrounds**: Beautiful gradient overlays for visual appeal
- **Box Shadows**: Subtle shadows for depth and modern appearance
- **Transitions**: Smooth animations for interactive elements

## Future Enhancements

1. **Tournament Details Modal**: Click "View Details" to see comprehensive tournament information
2. **Team Information**: Display user's team details for each tournament
3. **Match Schedule**: Show upcoming matches for the user
4. **Performance Stats**: Display user's statistics in each tournament
5. **Notifications**: Real-time updates for tournament changes
6. **Filtering/Sorting**: Filter by sport, status, or date range