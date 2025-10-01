-- Sample Data Insert Script for Sportify Database
-- This script inserts sample data into all tables (7 users total including 2 CAPTAIN users)

-- Insert Users (7 users total - 5 original + 2 CAPTAIN users)




-- Insert Roles (assuming role table exists, extending MasterEntity)
INSERT INTO role (id, name, is_active, created_on, updated_on) VALUES
(1, 'ADMIN', true, NOW(), NOW()),
(2, 'PLAYER', true, NOW(), NOW()),
(3, 'PLAYER', true, NOW(), NOW()),
(4, 'PLAYER', true, NOW(), NOW()),
(5, 'PLAYER', true, NOW(), NOW()),
(6, 'CAPTAIN', true, NOW(), NOW());

-- Insert Sports (with captain assignments only, champion/runner-up will be updated after teams are inserted)
INSERT INTO sports (sport_id, name, is_team_game, rules, captain_id) VALUES
(1, 'Football', true, 'Standard FIFA football rules with 11 players per team, 90-minute match duration.', 6),
(2, 'Basketball', true, 'Standard basketball rules with 5 players per team, 4 quarters of 12 minutes each.', 7),
(3, 'Cricket', true, 'T20 format cricket rules with 11 players per team, 20 overs per innings.', 7),
(4, 'Tennis', false, 'Standard tennis rules, singles match, best of 3 sets.', 6),
(5, 'Badminton', false, 'Standard badminton rules, singles match, best of 3 games to 21 points.', NULL);

-- Insert Teams
INSERT INTO teams (team_id, team_name, sport_id, created_by, logo) VALUES
(1, 'Thunder Strikers', 1, 2, 'thunder_strikers_logo.png'),
(2, 'Lightning Bolts', 1, 3, 'lightning_bolts_logo.png'),
(3, 'Sky Warriors', 2, 4, 'sky_warriors_logo.png'),
(4, 'Fire Eagles', 2, 5, 'fire_eagles_logo.png'),
(5, 'Storm Riders', 3, 2, 'storm_riders_logo.png'),
(6, 'Golden Gladiators', 1, 6, 'golden_gladiators_logo.png'),
(7, 'Silver Sharks', 3, 7, 'silver_sharks_logo.png');

-- Insert Team Members
INSERT INTO team_members (team_id, user_id, role_in_team) VALUES
(1, 2, 'Captain'),
(1, 3, 'Forward'),
(1, 4, 'Midfielder'),
(2, 5, 'Captain'),
(2, 4, 'Defender'),
(3, 3, 'Point Guard'),
(3, 5, 'Shooting Guard'),
(4, 2, 'Captain'),
(4, 4, 'Power Forward'),
(5, 5, 'Captain'),
(6, 6, 'Captain'),
(6, 3, 'Striker'),
(7, 7, 'Captain'),
(7, 4, 'Wicket Keeper'),
(7, 2, 'All Rounder');

-- Update Sports table with recent champion and runner-up information (after teams are inserted)
-- Based on the most recent tournament results for each sport
UPDATE sports SET recent_champion_id = 6, recent_runner_up_id = 1 WHERE sport_id = 1; -- Football: Golden Gladiators (champion), Thunder Strikers (runner-up)
UPDATE sports SET recent_champion_id = 3, recent_runner_up_id = 4 WHERE sport_id = 2; -- Basketball: Sky Warriors (champion), Fire Eagles (runner-up)
UPDATE sports SET recent_champion_id = 7, recent_runner_up_id = 5 WHERE sport_id = 3; -- Cricket: Silver Sharks (champion), Storm Riders (runner-up)
-- Tennis and Badminton remain NULL as no tournaments have been completed yet

-- Insert Tournaments (with champions and runners-up for completed tournaments)
INSERT INTO tournaments (tournament_id, name, sport_id, type, start_date, end_date, created_by, champion_id, runner_up_id) VALUES
(1, 'Spring Football Championship', 1, 'KNOCKOUT', '2024-03-01', '2024-03-31', 1, 1, 2),
(2, 'Inter-College Basketball League', 2, 'ROUND_ROBIN', '2024-04-01', '2024-04-30', 1, 3, 4),
(3, 'Summer Cricket Tournament', 3, 'KNOCKOUT', '2024-05-01', '2024-05-31', 1, NULL, NULL),
(4, 'Tennis Masters Cup', 4, 'KNOCKOUT', '2024-06-01', '2024-06-15', 1, NULL, NULL),
(5, 'Badminton Open Championship', 5, 'ROUND_ROBIN', '2024-07-01', '2024-07-31', 1, NULL, NULL),
(6, 'Captain''s Football League', 1, 'ROUND_ROBIN', '2024-08-01', '2024-08-31', 6, 6, 1),
(7, 'Elite Cricket Championship', 3, 'KNOCKOUT', '2024-09-01', '2024-09-30', 7, 7, 5);

-- Insert Matches
INSERT INTO matches (match_id, tournament_id, sport_id, team1_id, team2_id, scheduled_time, venue, status, winner_team_id , round) VALUES
(1, 1, 1, 1, 2, '2024-03-15 15:00:00', 'Main Football Ground', 'COMPLETED', 1, 'Round of 16'),
(2, 2, 2, 3, 4, '2024-04-10 18:00:00', 'Basketball Court A', 'COMPLETED', 3 , 'Round of 32'),
(3, 3, 3, 5, 1, '2024-05-20 14:00:00', 'Cricket Stadium', 'ONGOING', NULL , 'Quarter-Final'),
(4, 1, 1, 1, 5, '2024-03-20 16:00:00', 'Secondary Ground', 'SCHEDULED', NULL, 'Final'),
(5, 2, 2, 3, 5, '2024-04-25 19:00:00', 'Basketball Court B', 'COMPLETED', 5, 'Semi-Final'),
(6, 6, 1, 6, 1, '2024-08-15 16:00:00', 'Captain''s Ground', 'COMPLETED', 6, 'Round of 16'),
(7, 7, 3, 7, 5, '2024-09-10 14:30:00', 'Elite Cricket Ground', 'COMPLETED', 7 , 'Quarter-Final');

-- Insert Scores
INSERT INTO scores (score_id, match_id, team_id, points, updated_by) VALUES
(1, 1, 1, 3, 1),
(2, 1, 2, 1, 1),
(3, 2, 3, 85, 1),
(4, 2, 4, 78, 1),
(5, 5, 3, 92, 1),
(6, 6, 6, 2, 6),
(7, 6, 1, 1, 6),
(8, 7, 7, 185, 7),
(9, 7, 5, 167, 7);

-- Insert Hall of Fame entries
INSERT INTO hall_of_fame (hof_id, user_id, sport_id, title, stats, photo, match_id, tournament_id) VALUES
(1, 2, 1, 'Best Goal Scorer of the Season', 'Goals: 15, Assists: 8, Matches: 12', 'shahi_hof.jpg', 1, 1),
(2, 3, 2, 'MVP Basketball Player', 'Points: 28.5 avg, Rebounds: 12.3 avg, Assists: 7.8 avg', 'alif_hof.jpg', 2, 2),
(3, 4, 1, 'Best Defender', 'Clean sheets: 8, Tackles: 145, Interceptions: 67', 'ratul_hof.jpg', NULL, 1),
(4, 5, 3, 'Cricket All-Rounder Champion', 'Runs: 456, Wickets: 23, Catches: 15', 'sadiq_hof.jpg', NULL, 3),
(5, 2, 2, 'Three-Point Specialist', '3-Point %: 45.6, Total 3-Pointers: 89', 'shahi_basketball_hof.jpg', NULL, 2),
(6, 6, 1, 'Outstanding Team Captain', 'Wins: 18, Leadership Score: 9.5/10, Team Morale: Excellent', 'fahim_hof.jpg', 6, 6),
(7, 7, 3, 'Strategic Cricket Captain', 'Wins: 22, Runs: 1245, Wickets: 34, Captaincy Rating: 9.8/10', 'raihan_hof.jpg', 7, 7);

-- Insert Announcements
INSERT INTO announcements (announcement_id, title, content, posted_by, posted_at, related_sport_id, related_tournament_id) VALUES
(1, 'Football Championship Registration Open', 'Registration for the Spring Football Championship is now open. All teams must register before February 28th, 2024.', 1, '2024-02-15 10:00:00', 1, 1),
(2, 'Basketball League Schedule Released', 'The complete schedule for the Inter-College Basketball League has been published. Check the tournament section for match timings.', 1, '2024-03-25 14:30:00', 2, 2),
(3, 'New Tennis Courts Available', 'Two new tennis courts have been added to the facility. Players can now book courts online through the sports management system.', 1, '2024-05-10 09:00:00', 4, NULL),
(4, 'Cricket Equipment Check', 'All cricket teams must bring their equipment for inspection on May 1st before the tournament begins.', 1, '2024-04-28 16:00:00', 3, 3),
(5, 'Sports Awards Ceremony', 'Annual sports awards ceremony will be held on August 15th. All participants and winners are invited to attend.', 1, '2024-07-30 11:00:00', NULL, NULL),
(6, 'Captain''s Football League Launch', 'Announcing the new Captain''s Football League starting August 1st. This league focuses on developing team leadership skills.', 6, '2024-07-25 15:00:00', 1, 6),
(7, 'Elite Cricket Championship Guidelines', 'Special guidelines for the Elite Cricket Championship have been published. All participating teams must review before September 1st.', 7, '2024-08-20 12:00:00', 3, 7);

-- Insert Notifications
INSERT INTO notifications (notification_id, recipient_id, message, sent_at, is_read) VALUES
(1, 2, 'Congratulations! You have been selected for the Hall of Fame as Best Goal Scorer of the Season.', '2024-03-16 10:00:00', true),
(2, 3, 'Your team Thunder Strikers has won the match against Lightning Bolts. Great performance!', '2024-03-15 17:30:00', true),
(3, 4, 'You have a scheduled match tomorrow at 16:00. Please be at the venue 30 minutes early.', '2024-03-19 20:00:00', false),
(4, 5, 'New tournament registration is now open for Summer Cricket Tournament. Register your team now!', '2024-04-20 12:00:00', false),
(5, 2, 'Your profile has been updated successfully with your latest achievements.', '2024-04-01 14:15:00', true),
(6, 6, 'Congratulations! Your team Golden Gladiators won the Captain''s Football League match. Excellent leadership!', '2024-08-15 18:30:00', true),
(7, 7, 'Your Elite Cricket Championship tournament has been successfully created and scheduled for September.', '2024-08-20 14:00:00', true);

-- Insert Refresh Tokens (extending MasterEntity)


-- Update sequences to continue from the next available ID
SELECT setval('sports_sport_id_seq', 5, true);
SELECT setval('teams_team_id_seq', 7, true);
SELECT setval('tournaments_tournament_id_seq', 7, true);
SELECT setval('matches_match_id_seq', 7, true);
SELECT setval('scores_score_id_seq', 9, true);
SELECT setval('hall_of_fame_hof_id_seq', 7, true);
SELECT setval('announcements_announcement_id_seq', 7, true);
SELECT setval('notifications_notification_id_seq', 7, true);

-- Note: Sequences for MasterEntity extending tables (role and refresh_token) use the generic 'id' field
-- These may need adjustment based on your PostgreSQL sequence naming convention

COMMIT;