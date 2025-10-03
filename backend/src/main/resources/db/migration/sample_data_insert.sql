-- Sample Data Insert Script for Sportify Database
-- This script inserts sample data into all tables (7 users total including 2 CAPTAIN users)

-- Drop tables in reverse order of dependencies (child tables first)
-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS announcements CASCADE;
-- DROP TABLE IF EXISTS hall_of_fame CASCADE;
-- DROP TABLE IF EXISTS scores CASCADE;
-- DROP TABLE IF EXISTS matches CASCADE;
-- DROP TABLE IF EXISTS team_members CASCADE;
-- DROP TABLE IF EXISTS teams CASCADE;
-- DROP TABLE IF EXISTS tournaments CASCADE;
-- DROP TABLE IF EXISTS sports CASCADE;
-- DROP TABLE IF EXISTS role CASCADE;

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
INSERT INTO sports (sport_id, name, is_team_game, rules, captain_id, player_count) VALUES
(1, 'Football', true, 'Standard FIFA football rules with 11 players per team, 90-minute match duration.', 6, 11),
(2, 'Basketball', true, 'Standard basketball rules with 5 players per team, 4 quarters of 12 minutes each.', 7, 5),
(3, 'Cricket', true, 'T20 format cricket rules with 11 players per team, 20 overs per innings.', 7, 11),
(4, 'Tennis', false, 'Standard tennis rules, singles match, best of 3 sets.', 6, 1),
(5, 'Badminton', false, 'Standard badminton rules, singles match, best of 3 games to 21 points.', NULL, 1);

-- Insert Tournaments (with champions and runners-up for completed tournaments)
INSERT INTO tournaments (tournament_id, name, sport_id, start_date, end_date, created_by, champion_id, runner_up_id) VALUES
(1, 'Spring Football Championship', 1,  '2024-03-01', '2024-03-31', 1, NULL, NULL),
(2, 'Inter-College Basketball League', 2, '2024-04-01', '2024-04-30', 1, NULL, NULL),
(3, 'Summer Cricket Tournament', 3, '2024-05-01', '2024-05-31', 1, NULL, NULL),
(4, 'Tennis Masters Cup', 4, '2024-06-01', '2024-06-15', 1, NULL, NULL),
(5, 'Badminton Open Championship', 5,  '2024-07-01', '2024-07-31', 1, NULL, NULL),
(6, 'Captain''s Football League', 1,  '2024-08-01', '2024-08-31', 6, NULL, NULL),
(7, 'Elite Cricket Championship', 3, '2024-09-01', '2024-09-30', 7, NULL, NULL),
(8, 'Winter Football Championship 2024', 1, '2024-12-01', '2024-12-31', 1, NULL, NULL);

-- Insert Teams
INSERT INTO teams (team_id, team_name, sport_id, created_by, logo,tournament_id) VALUES
(1, 'Thunder Strikers', 1, 2, 'thunder_strikers_logo.png',8),
(2, 'Lightning Bolts', 1, 3, 'lightning_bolts_logo.png',8),
(3, 'Sky Warriors', 2, 4, 'sky_warriors_logo.png,',2),
(4, 'Fire Eagles', 2, 5, 'fire_eagles_logo.png',2),
(5, 'Storm Riders', 3, 2, 'storm_riders_logo.png',7),
(6, 'Golden Gladiators', 1, 6, 'golden_gladiators_logo.png',8),
(7, 'Silver Sharks', 3, 7, 'silver_sharks_logo.png',7);

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


-- Insert Sample Rounds for Tournaments
INSERT INTO rounds (round_id, round_value, round_name, tournament_id, type) VALUES
-- Spring Football Championship (KNOCKOUT) - Tournament ID 1
(1, 5, 'Round of 32', 1 , 'KNOCKOUT'),
(2, 4, 'Round of 16', 1, 'KNOCKOUT'),
(3, 3, 'Quarter-final', 1, 'KNOCKOUT'),
(4, 2, 'Semi-final', 1, 'KNOCKOUT'),
(5, 1, 'Final', 1, 'KNOCKOUT'),

-- Summer Cricket Tournament (KNOCKOUT) - Tournament ID 3
(6, 4, 'Round of 16', 3, 'KNOCKOUT'),
(7, 3, 'Quarter-final', 3, 'KNOCKOUT'),
(8, 2, 'Semi-final', 3, 'KNOCKOUT'),
(9, 1, 'Final', 3, 'KNOCKOUT'),

-- Tennis Masters Cup (KNOCKOUT) - Tournament ID 4
(10, 3, 'Quarter-final', 4,'ROUND_ROBIN'),
(11, 2, 'Semi-final', 4,'ROUND_ROBIN'),
(12, 1, 'Final', 4,'ROUND_ROBIN'),

-- Elite Cricket Championship (KNOCKOUT) - Tournament ID 7
(13, 3, 'Quarter-final', 7, 'KNOCKOUT'),
(14, 2, 'Semi-final', 7, 'KNOCKOUT'),
(15, 1, 'Final', 7,'ROUND_ROBIN'),

-- Winter Football Championship 2024 (KNOCKOUT) - Tournament ID 8
(16, 5, 'Round of 32', 8,'KNOCKOUT'),
(17, 4, 'Round of 16', 8,'KNOCKOUT'),
(18, 3, 'Quarter-final', 8,'KNOCKOUT'),
(19, 2, 'Semi-final', 8,'KNOCKOUT'),
(20, 1, 'Final', 8,'KNOCKOUT');



-- Insert Matches (using round_id to reference rounds table)
INSERT INTO matches (match_id, tournament_id, sport_id, team1_id, team2_id, scheduled_time, venue, status, winner_team_id, round_id) VALUES
-- Spring Football Championship matches (Tournament ID 1)
(1, 1, 1, 1, 2, '2024-03-15 15:00:00', 'Main Football Ground', 'COMPLETED', 1, 2), -- Round of 16 (round_id = 2)
(4, 1, 1, 1, 5, '2024-03-20 16:00:00', 'Secondary Ground', 'SCHEDULED', NULL, 5), -- Final (round_id = 5)

-- Inter-College Basketball League matches (Tournament ID 2 - ROUND_ROBIN, no rounds needed)
(2, 2, 2, 3, 4, '2024-04-10 18:00:00', 'Basketball Court A', 'COMPLETED', 3, NULL),
(5, 2, 2, 3, 5, '2024-04-25 19:00:00', 'Basketball Court B', 'COMPLETED', 5, NULL),

-- Summer Cricket Tournament matches (Tournament ID 3)
(3, 3, 3, 5, 1, '2024-05-20 14:00:00', 'Cricket Stadium', 'ONGOING', NULL, 7), -- Quarter-final (round_id = 7)

-- Captain's Football League matches (Tournament ID 6 - ROUND_ROBIN, no rounds needed)
(6, 6, 1, 6, 1, '2024-08-15 16:00:00', 'Captain''s Ground', 'COMPLETED', 6, NULL),

-- Elite Cricket Championship matches (Tournament ID 7)
(7, 7, 3, 7, 5, '2024-09-10 14:30:00', 'Elite Cricket Ground', 'COMPLETED', 7, 13); -- Quarter-final (round_id = 13)

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
INSERT INTO announcements (announcement_id, title, content, posted_by, posted_at, related_sport_id, related_tournament_id, start_date, end_date) VALUES
                                                                                                                                                     (1, 'Football Championship Registration Open', 'Registration for the Spring Football Championship is now open. All teams must register before February 28th, 2024.', 1, '2024-02-15 10:00:00', 1, 1, '2024-02-15 00:00:00', '2024-02-28 23:59:59'),
                                                                                                                                                     (2, 'Basketball League Schedule Released', 'The complete schedule for the Inter-College Basketball League has been published. Check the tournament section for match timings.', 1, '2024-03-25 14:30:00', 2, 2, '2024-04-01 00:00:00', '2024-04-30 23:59:59'),
                                                                                                                                                     (3, 'New Tennis Courts Available', 'Two new tennis courts have been added to the facility. Players can now book courts online through the sports management system.', 1, '2024-05-10 09:00:00', 4, NULL, '2024-05-10 00:00:00', NULL),
                                                                                                                                                     (4, 'Cricket Equipment Check', 'All cricket teams must bring their equipment for inspection on May 1st before the tournament begins.', 1, '2024-04-28 16:00:00', 3, 3, '2024-05-01 09:00:00', '2024-05-01 17:00:00'),
                                                                                                                                                     (5, 'Sports Awards Ceremony', 'Annual sports awards ceremony will be held on August 15th. All participants and winners are invited to attend.', 1, '2024-07-30 11:00:00', NULL, NULL, '2024-08-15 18:00:00', '2024-08-15 21:00:00'),
                                                                                                                                                     (6, 'Captain''s Football League Launch', 'Announcing the new Captain''s Football League starting August 1st. This league focuses on developing team leadership skills.', 6, '2024-07-25 15:00:00', 1, 6, '2024-08-01 00:00:00', '2024-09-30 23:59:59'),
                                                                                                                                                     (7, 'Elite Cricket Championship Guidelines', 'Special guidelines for the Elite Cricket Championship have been published. All participating teams must review before September 1st.', 7, '2024-08-20 12:00:00', 3, 7, NULL, NULL),
                                                                                                                                                     (8, 'Winter Football Championship 2024 Registration Open!', 'The Winter Football Championship 2024 is now accepting team registrations! This knockout tournament will feature 32 teams competing for the winter crown. Register your teams before November 15th, 2024.', 1, '2024-11-01 09:00:00', 1, 8, '2024-11-01 00:00:00', '2024-11-15 23:59:59'),
                                                                                                                                                     (9, 'Winter Football Championship Rules & Guidelines', 'Special winter playing conditions and rules have been published for the Winter Football Championship 2024. All 32 participating teams must review the updated guidelines including cold weather protocols.', 1, '2024-11-05 14:00:00', 1, 8, NULL, NULL),
                                                                                                                                                     (10, 'Winter Football Championship Draw Ceremony', 'The official draw ceremony for the Winter Football Championship 2024 will be held on November 20th. The knockout bracket will be announced with first round matches starting December 1st.', 1, '2024-11-10 11:30:00', 1, 8, '2024-11-20 18:00:00', '2024-11-20 20:00:00');
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


INSERT INTO teams (team_id, team_name, sport_id, created_by, logo , tournament_id) VALUES
(8, 'Winter Wolves FC', 1, 6, 'winter_wolves_logo.png' , 8),
(9, 'Frost Giants United', 1, 7, 'frost_giants_logo.png', 8),
(10, 'Arctic Avalanche', 1, 2, 'arctic_avalanche_logo.png', 8),
(11, 'Blizzard Bombers', 1, 3, 'blizzard_bombers_logo.png',8),
(12, 'Ice Storm FC', 1, 4, 'ice_storm_logo.png',8),
(13, 'Polar Panthers', 1, 5, 'polar_panthers_logo.png',8),
(14, 'Snowfall Strikers', 1, 6, 'snowfall_strikers_logo.png',8),
(15, 'Glacier Gladiators', 1, 7, 'glacier_gladiators_logo.png',8),
(16, 'Frozen Thunder FC', 1, 2, 'frozen_thunder_logo.png',8),
(17, 'Ice Hawks United', 1, 3, 'ice_hawks_logo.png',8),
(18, 'Winter Warriors FC', 1, 4, 'winter_warriors_logo.png',8),
(19, 'Frost Fire FC', 1, 5, 'frost_fire_logo.png',8),
(20, 'Arctic Lions', 1, 6, 'arctic_lions_logo.png',8),
(21, 'Snow Leopards FC', 1, 7, 'snow_leopards_logo.png',8),
(22, 'Blizzard Eagles', 1, 2, 'blizzard_eagles_logo.png',8),
(23, 'Polar Storm FC', 1, 3, 'polar_storm_logo.png',8),
(24, 'Frost Titans', 1, 4, 'frost_titans_logo.png',8),
(25, 'Winter Phoenix FC', 1, 5, 'winter_phoenix_logo.png',8),
(26, 'Ice Demons United', 1, 6, 'ice_demons_logo.png',8),
(27, 'Arctic Sharks FC', 1, 7, 'arctic_sharks_logo.png',8),
(28, 'Frozen Falcons', 1, 2, 'frozen_falcons_logo.png',8),
(29, 'Snow Dragons FC', 1, 3, 'snow_dragons_logo.png',8),
(30, 'Glacier Bulls', 1, 4, 'glacier_bulls_logo.png',8),
(31, 'Winter Stallions', 1, 5, 'winter_stallions_logo.png',8),
(32, 'Frost Vipers FC', 1, 6, 'frost_vipers_logo.png',8);

-- Insert team members for the new teams (captain and key players for each team)
INSERT INTO team_members (team_id, user_id, role_in_team) VALUES
-- Winter Wolves FC
(8, 6, 'Captain'),
(8, 2, 'Striker'),
(8, 3, 'Midfielder'),

-- Frost Giants United
(9, 7, 'Captain'),
(9, 4, 'Defender'),
(9, 5, 'Goalkeeper'),

-- Arctic Avalanche
(10, 2, 'Captain'),
(10, 6, 'Forward'),
(10, 7, 'Midfielder'),

-- Blizzard Bombers
(11, 3, 'Captain'),
(11, 4, 'Striker'),
(11, 5, 'Defender'),

-- Ice Storm FC
(12, 4, 'Captain'),
(12, 2, 'Midfielder'),
(12, 3, 'Wing'),

-- Polar Panthers
(13, 5, 'Captain'),
(13, 6, 'Forward'),
(13, 7, 'Defender'),

-- Snowfall Strikers
(14, 6, 'Captain'),
(14, 2, 'Striker'),
(14, 4, 'Midfielder'),

-- Glacier Gladiators
(15, 7, 'Captain'),
(15, 3, 'Forward'),
(15, 5, 'Defender'),

-- Frozen Thunder FC
(16, 2, 'Captain'),
(16, 3, 'Midfielder'),
(16, 4, 'Defender'),

-- Ice Hawks United
(17, 3, 'Captain'),
(17, 5, 'Striker'),
(17, 6, 'Goalkeeper'),

-- Winter Warriors FC
(18, 4, 'Captain'),
(18, 7, 'Forward'),
(18, 2, 'Midfielder'),

-- Frost Fire FC
(19, 5, 'Captain'),
(19, 6, 'Defender'),
(19, 7, 'Wing'),

-- Arctic Lions
(20, 6, 'Captain'),
(20, 2, 'Striker'),
(20, 3, 'Midfielder'),

-- Snow Leopards FC
(21, 7, 'Captain'),
(21, 4, 'Forward'),
(21, 5, 'Defender'),

-- Blizzard Eagles
(22, 2, 'Captain'),
(22, 3, 'Midfielder'),
(22, 6, 'Striker'),

-- Polar Storm FC
(23, 3, 'Captain'),
(23, 4, 'Defender'),
(23, 7, 'Goalkeeper'),

-- Frost Titans
(24, 4, 'Captain'),
(24, 5, 'Forward'),
(24, 2, 'Midfielder'),

-- Winter Phoenix FC
(25, 5, 'Captain'),
(25, 6, 'Striker'),
(25, 7, 'Wing'),

-- Ice Demons United
(26, 6, 'Captain'),
(26, 2, 'Midfielder'),
(26, 3, 'Defender'),

-- Arctic Sharks FC
(27, 7, 'Captain'),
(27, 4, 'Forward'),
(27, 5, 'Goalkeeper'),

-- Frozen Falcons
(28, 2, 'Captain'),
(28, 3, 'Striker'),
(28, 6, 'Midfielder'),

-- Snow Dragons FC
(29, 3, 'Captain'),
(29, 4, 'Defender'),
(29, 7, 'Wing'),

-- Glacier Bulls
(30, 4, 'Captain'),
(30, 5, 'Forward'),
(30, 2, 'Midfielder'),

-- Winter Stallions
(31, 5, 'Captain'),
(31, 6, 'Defender'),
(31, 7, 'Striker'),

-- Frost Vipers FC
(32, 6, 'Captain'),
(32, 2, 'Goalkeeper'),
(32, 3, 'Forward');

-- Additional announcements
INSERT INTO announcements (announcement_id, title, content, posted_by, posted_at, related_sport_id, related_tournament_id, start_date, end_date) VALUES
                                                                                                                                                     (11, 'Spring Football Championship Finals', 'The finals of Spring Football Championship will be held on March 15th. Don''t miss the exciting match between top two teams!', 1, '2024-03-10 10:00:00', 1, 1, '2024-03-15 15:00:00', '2024-03-15 17:00:00'),
                                                                                                                                                     (12, 'Basketball League Quarter Finals Schedule', 'Quarter finals schedule for the Inter-College Basketball League has been announced. Matches will be held from April 15th to April 20th.', 1, '2024-04-10 14:00:00', 2, 2, '2024-04-15 00:00:00', '2024-04-20 23:59:59'),
                                                                                                                                                     (13, 'Cricket Tournament Team Registration', 'Team registration for the upcoming cricket tournament is now open. Last date for registration is April 25th, 2024.', 1, '2024-04-15 09:00:00', 3, 3, '2024-04-15 00:00:00', '2024-04-25 23:59:59'),
                                                                                                                                                     (14, 'Tennis Coaching Camp Announcement', 'Special tennis coaching camp for beginners will be conducted from June 1st to June 15th. Limited seats available!', 1, '2024-05-20 11:00:00', 4, NULL, '2024-06-01 00:00:00', '2024-06-15 23:59:59'),
                                                                                                                                                     (15, 'Captain''s Football League Playoffs', 'Playoff matches for Captain''s Football League will begin on September 15th. Top 8 teams will compete for the championship.', 6, '2024-09-10 16:00:00', 1, 6, '2024-09-15 00:00:00', '2024-09-25 23:59:59');
-- Update sequences to continue from the next available ID
SELECT setval('teams_team_id_seq', 32, true);
SELECT setval('tournaments_tournament_id_seq', 8, true);
SELECT setval('matches_match_id_seq', 7, true);
SELECT setval('announcements_announcement_id_seq', 10, true);
SELECT setval('rounds_round_id_seq', 20, true);

COMMIT;