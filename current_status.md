# Sportify Project - Current Status

## Project Overview

**Sportify** is a comprehensive full-stack web application designed for managing sports tournaments and events. The project facilitates game registration, fixture generation, live score updates, announcements, and maintains a hall of fame for outstanding players and teams.

### Repository Information
- **Repository**: jubaer36/sportify
- **Current Branch**: main
- **Last Updated**: October 1, 2025

---

## Tech Stack

### Backend
- **Framework**: Spring Boot 3.5.4
- **Language**: Java 21
- **Database**: PostgreSQL
- **ORM**: Spring Data JPA with Hibernate
- **Security**: Spring Security with JWT Authentication
- **Migration**: Flyway (currently disabled)
- **API Documentation**: OpenAPI 3 (Swagger UI)
- **Build Tool**: Maven

### Frontend
- **Framework**: Next.js 15.5.4
- **Language**: TypeScript
- **UI Library**: React 19.1.0
- **Styling**: TailwindCSS v4
- **Build Tool**: Turbopack (Next.js)

### Infrastructure
- **Database**: PostgreSQL 15 (Docker containerized)
- **Port Configuration**: Backend (8090), Database (5432)

---

## Database Schema

### Core Entities

#### 1. Users (`users`)
- **Primary Key**: `user_id` (Long)
- **Fields**: name, email, username, password, phone, role, profile_photo
- **User Roles**: PLAYER, ADMIN, CAPTAIN, SCOREKEEPER
- **Security**: Implements Spring Security UserDetails interface
- **Authentication**: JWT-based with refresh tokens

#### 2. Sports (`sports`)
- **Primary Key**: `sport_id` (Long)
- **Fields**: name, is_team_game, rules, captain_id, recent_champion_id, recent_runner_up_id
- **Relations**: 
  - ManyToOne with User (captain)
  - ManyToOne with Team (recent_champion, recent_runner_up)

#### 3. Teams (`teams`)
- **Primary Key**: `team_id` (Long)
- **Fields**: team_name, sport_id, created_by, logo
- **Relations**:
  - ManyToOne with Sport
  - ManyToOne with User (created_by)

#### 4. Team Members (`team_members`)
- **Composite Key**: team_id + user_id
- **Fields**: role_in_team
- **Relations**: Many-to-Many between Team and User

#### 5. Tournaments (`tournaments`)
- **Primary Key**: `tournament_id` (Long)
- **Fields**: name, sport_id, type, start_date, end_date, created_by, champion_id, runner_up_id
- **Tournament Types**: ROUND_ROBIN, KNOCKOUT
- **Relations**: 
  - ManyToOne with Sport, User (created_by), Team (champion/runner_up)

#### 6. Matches (`matches`)
- **Primary Key**: `match_id` (Long)
- **Fields**: tournament_id, sport_id, team1_id, team2_id, scheduled_time, venue, status, winner_team_id, round
- **Match Status**: SCHEDULED, ONGOING, COMPLETED, CANCELLED
- **Relations**: ManyToOne with Tournament, Sport, Teams

#### 7. Scores (`scores`)
- **Primary Key**: `score_id` (Long)
- **Fields**: match_id, team_id, points, updated_by
- **Relations**: ManyToOne with Match, Team, User (updated_by)

#### 8. Announcements (`announcements`)
- **Primary Key**: `announcement_id` (Long)
- **Fields**: title, content, posted_by, posted_at, related_sport_id, related_tournament_id
- **Relations**: ManyToOne with User (posted_by), Sport, Tournament

#### 9. Hall of Fame (`hall_of_fame`)
- **Primary Key**: `hof_id` (Long)
- **Fields**: user_id, sport_id, title, stats, photo, match_id, tournament_id
- **Relations**: ManyToOne with User, Sport, Match, Tournament

#### 10. Notifications (`notifications`)
- **Primary Key**: `notification_id` (Long)
- **Fields**: recipient_id, message, sent_at, is_read
- **Relations**: ManyToOne with User (recipient)

#### 11. Roles (`role`)
- **Primary Key**: `id` (inherits from MasterEntity)
- **Fields**: name, is_active, created_on, updated_on

---

## API Architecture

### Controller Layer
The application implements a comprehensive REST API with the following controllers:

1. **AuthController** - Authentication and authorization endpoints
2. **UserController** - User management operations
3. **SportController** - Sports CRUD operations
4. **TeamController** - Team management
5. **TournamentController** - Tournament lifecycle management
6. **MatchController** - Match scheduling and management
7. **ScoreController** - Live score updates
8. **AnnouncementController** - News and announcements
9. **HallOfFameController** - Achievement tracking
10. **NotificationController** - User notifications

### Service Layer
Each controller is backed by corresponding service classes that implement business logic:
- SportService, TournamentService, UserService, etc.

### Repository Layer
Spring Data JPA repositories provide data access:
- Custom query methods for complex searches
- Standard CRUD operations
- Specialized queries for sports statistics

---

## Frontend Architecture

### Page Structure
```
app/
├── page.tsx (Landing page with logo and navigation)
├── login/ (Authentication)
├── register/ (User registration)
├── admin/
│   ├── dashboard/
│   └── all-games/
├── captain/
│   └── dashboard/
└── player/
    └── dashboard/
```

### Components
- **Sidebar Components**: Role-based navigation (Admin, Captain, Player)
- **Topbar**: Common header component
- **Authentication**: JWT token-based authentication with role-based routing

### Styling
- **TailwindCSS**: Modern utility-first CSS framework
- **Custom CSS**: Role-specific styling files
- **Images**: Sports logos and branding assets

---

## Current Implementation Status

### ✅ Completed Features

#### Backend
- **Database Schema**: Complete entity model with relationships
- **Authentication System**: JWT-based security with refresh tokens
- **REST API Controllers**: All major endpoints implemented
- **Sample Data**: Comprehensive test data with 7 users, multiple sports, teams, tournaments
- **Spring Security Configuration**: Role-based access control
- **OpenAPI Documentation**: Swagger UI integration

#### Frontend
- **Authentication Flow**: Login/Register pages with role-based redirects
- **Dashboard Pages**: Separate dashboards for Admin, Captain, and Player roles
- **Navigation Components**: Role-specific sidebars and navigation
- **Responsive Design**: Mobile-friendly interface
- **API Integration**: HTTP client setup for backend communication

### 🔄 In Progress / Partially Implemented
- **Live Score Updates**: Backend API exists, frontend integration pending
- **Tournament Management**: CRUD operations implemented, UI refinement needed
- **Hall of Fame**: Entity model complete, frontend display pending
- **Notifications System**: Basic structure in place, real-time features needed

### ❌ Pending Implementation
- **WebSocket Integration**: For real-time score updates
- **File Upload**: Profile photos and team logos
- **Advanced Analytics**: Player statistics and tournament analytics
- **Fixture Generation**: Automated bracket/round-robin generation
- **Email Notifications**: Integration with email service
- **Mobile Application**: Native mobile app development

---

## Development Environment

### Backend Configuration
```yaml
# application.yml
Database: PostgreSQL (localhost:5432/sportify)
Server Port: 8090
JWT Secret: Configurable via environment variables
Swagger UI: /swagger-ui.html
```

### Frontend Configuration
```json
# package.json
Development Server: next dev --turbopack
Build: next build --turbopack
TypeScript: Fully configured
ESLint: Code quality enforcement
```

### Docker Setup
- PostgreSQL 15 containerized with Docker Compose
- Persistent data volumes configured
- Development database credentials: root/secret

---

## Sample Data

The project includes comprehensive sample data:
- **7 Users** across different roles (Admin, Player, Captain, Scorekeeper)
- **5 Sports** (Football, Basketball, Cricket, Tennis, Badminton)
- **7 Teams** with team member associations
- **7 Tournaments** with various completion statuses
- **7 Matches** in different states (Scheduled, Ongoing, Completed)
- **Hall of Fame entries** for outstanding achievements
- **Sample scores** and team statistics

---

## Security Features

### Authentication
- JWT token-based authentication
- Refresh token mechanism (7-day expiry)
- Password encryption with Spring Security
- Role-based authorization (ADMIN, CAPTAIN, PLAYER, SCOREKEEPER)

### API Security
- CORS configuration for frontend integration
- Protected endpoints with role-based access
- Input validation and sanitization
- SQL injection prevention through JPA

---

## Deployment Considerations

### Production Readiness
- **Environment Variables**: Database credentials, JWT secrets externalized
- **Docker Support**: Database containerization ready
- **Build Optimization**: Turbopack for faster builds
- **Code Quality**: ESLint configuration for maintaining standards

### Scalability Features
- **Lazy Loading**: Hibernate lazy loading for performance
- **Connection Pooling**: Spring Boot default configurations
- **Caching**: Ready for Redis integration
- **API Versioning**: Structured for future API versions

---

