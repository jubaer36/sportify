-- Sample Data Insert Script for Sportify Database
-- This script inserts sample data into all tables (50 users total including various roles)

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
(3, 'CAPTAIN', true, NOW(), NOW());


-- Insert Sports (with captain assignments only, champion/runner-up will be updated after teams are inserted)
INSERT INTO sports (sport_id, name, is_team_game, rules, captain_id, player_count) VALUES
(1, 'Football', true, 'Standard FIFA football rules with 11 players per team, 90-minute match duration.', 6, 11),
(2, 'Basketball', true, 'Standard basketball rules with 5 players per team, 4 quarters of 12 minutes each.', 7, 5),
(3, 'Cricket', true, 'T20 format cricket rules with 11 players per team, 20 overs per innings.', 7, 11),
(4, 'Tennis', false, 'Standard tennis rules, singles match, best of 3 sets.', 6, 1),
(5, 'Badminton', false, 'Standard badminton rules, singles match, best of 3 games to 21 points.', NULL, 1),
(6, 'Volleyball', true, 'Standard volleyball rules with 6 players per team, best of 5 sets.', 24, 6),
(7, 'Table Tennis', false, 'Standard table tennis rules, singles match, best of 5 games to 11 points.', 25, 1),
(8, 'Carrom', false, 'Standard carrom rules, singles match, first to 25 points.', 26, 1),
(9, 'Chess', false, 'Standard chess rules, timed match.', 27, 1),
(10, 'Scrabble', false, 'Standard scrabble rules, word game.', 28, 1);

-- Insert Tournaments (with champions and runners-up for completed tournaments)
INSERT INTO tournaments (tournament_id, name, sport_id, start_date, end_date, created_by, champion_id, runner_up_id) VALUES
(1, 'Spring Football Championship', 1,  '2024-03-01', '2024-03-31', 6, NULL, NULL),
(2, 'Inter-College Basketball League', 2, '2024-04-01', '2024-04-30', 1, NULL, NULL),
(3, 'Summer Cricket Tournament', 3, '2024-05-01', '2024-05-31', 1, NULL, NULL),
(4, 'Tennis Masters Cup', 4, '2024-06-01', '2024-06-15', 1, NULL, NULL),
(5, 'Badminton Open Championship', 5,  '2024-07-01', '2024-07-31', 1, NULL, NULL),
(6, 'Captain''s Football League', 1,  '2024-08-01', '2024-08-31', 6, NULL, NULL),
(7, 'Elite Cricket Championship', 3, '2024-09-01', '2024-09-30', 7, NULL, NULL),
(8, 'Winter Football Championship 2024', 1, '2024-12-01', '2024-12-31', 6, NULL, NULL),
(9, 'Volleyball Championship 2025', 6, '2025-01-01', '2025-01-31', 24, NULL, NULL),
(10, 'Table Tennis Open 2025', 7, '2025-02-01', '2025-02-28', 25, NULL, NULL),
(11, 'Carrom Masters 2025', 8, '2025-03-01', '2025-03-31', 26, NULL, NULL),
(12, 'Chess Tournament 2025', 9, '2025-04-01', '2025-04-30', 27, NULL, NULL),
(13, 'Scrabble Championship 2025', 10, '2025-05-01', '2025-05-31', 28, NULL, NULL),
(14, 'Spring Volleyball League', 6, '2025-06-01', '2025-06-30', 24, NULL, NULL),
(15, 'Summer Table Tennis Cup', 7, '2025-07-01', '2025-07-31', 25, NULL, NULL),
(16, 'Autumn Carrom Open', 8, '2025-08-01', '2025-08-31', 26, NULL, NULL),
(17, 'Winter Chess Masters', 9, '2025-09-01', '2025-09-30', 27, NULL, NULL),
(18, 'New Year Scrabble Fest', 10, '2025-10-01', '2025-10-31', 28, NULL, NULL);

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
INSERT INTO team_members (team_id, user_id, role_in_team, status) VALUES
(1, 2, 'Captain', 'ACCEPTED'),
(1, 3, 'Forward', 'ACCEPTED'),
(1, 4, 'Midfielder', 'ACCEPTED'),
(2, 5, 'Captain', 'ACCEPTED'),
(2, 4, 'Defender', 'ACCEPTED'),
(3, 3, 'Point Guard', 'ACCEPTED'),
(3, 5, 'Shooting Guard', 'ACCEPTED'),
(4, 2, 'Captain', 'ACCEPTED'),
(4, 4, 'Power Forward', 'ACCEPTED'),
(5, 5, 'Captain', 'ACCEPTED'),
(6, 6, 'Captain', 'ACCEPTED'),
(6, 3, 'Striker', 'ACCEPTED'),
(7, 7, 'Captain', 'ACCEPTED'),
(7, 4, 'Wicket Keeper', 'ACCEPTED'),
(7, 2, 'All Rounder', 'ACCEPTED');

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
(20, 1, 'Final', 8,'KNOCKOUT'),

-- Volleyball Championship 2025 (KNOCKOUT) - Tournament ID 9
(21, 3, 'Semi-final', 9, 'KNOCKOUT'),
(22, 2, 'Final', 9, 'KNOCKOUT'),

-- Table Tennis Open 2025 (KNOCKOUT) - Tournament ID 10
(23, 3, 'Semi-final', 10, 'KNOCKOUT'),
(24, 2, 'Final', 10, 'KNOCKOUT'),

-- Carrom Masters 2025 (KNOCKOUT) - Tournament ID 11
(25, 3, 'Semi-final', 11, 'KNOCKOUT'),
(26, 2, 'Final', 11, 'KNOCKOUT'),

-- Chess Tournament 2025 (KNOCKOUT) - Tournament ID 12
(27, 3, 'Semi-final', 12, 'KNOCKOUT'),
(28, 2, 'Final', 12, 'KNOCKOUT'),

-- Scrabble Championship 2025 (KNOCKOUT) - Tournament ID 13
(29, 3, 'Semi-final', 13, 'KNOCKOUT'),
(30, 2, 'Final', 13, 'KNOCKOUT'),

-- Spring Volleyball League (ROUND_ROBIN) - Tournament ID 14
(31, 1, 'Round Robin', 14, 'ROUND_ROBIN'),

-- Summer Table Tennis Cup (KNOCKOUT) - Tournament ID 15
(32, 3, 'Semi-final', 15, 'KNOCKOUT'),
(33, 2, 'Final', 15, 'KNOCKOUT'),

-- Autumn Carrom Open (KNOCKOUT) - Tournament ID 16
(34, 3, 'Semi-final', 16, 'KNOCKOUT'),
(35, 2, 'Final', 16, 'KNOCKOUT'),

-- Winter Chess Masters (KNOCKOUT) - Tournament ID 17
(36, 3, 'Semi-final', 17, 'KNOCKOUT'),
(37, 2, 'Final', 17, 'KNOCKOUT'),

-- New Year Scrabble Fest (KNOCKOUT) - Tournament ID 18
(38, 3, 'Semi-final', 18, 'KNOCKOUT'),
(39, 2, 'Final', 18, 'KNOCKOUT');



-- ==============================
-- INSERT INTO SCORES
-- ==============================


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
                                                                                                                                                     (10, 'Winter Football Championship Draw Ceremony', 'The official draw ceremony for the Winter Football Championship 2024 will be held on November 20th. The knockout bracket will be announced with first round matches starting December 1st.', 1, '2024-11-10 11:30:00', 1, 8, '2024-11-20 18:00:00', '2024-11-20 20:00:00'),
(16, 'Volleyball Championship 2025 Registration', 'Registration for the Volleyball Championship 2025 is now open. Teams can register until December 31st, 2024.', 24, '2024-12-01 10:00:00', 6, 9, '2024-12-01 00:00:00', '2024-12-31 23:59:59'),
(17, 'Table Tennis Open 2025 Announced', 'The Table Tennis Open 2025 will feature top players from around the region. Registration opens January 1st.', 25, '2024-12-15 14:00:00', 7, 10, '2025-01-01 00:00:00', '2025-01-31 23:59:59'),
(18, 'Carrom Masters 2025 Launch', 'Introducing the Carrom Masters 2025 tournament. All skill levels welcome!', 26, '2025-01-01 09:00:00', 8, 11, '2025-01-01 00:00:00', '2025-02-28 23:59:59'),
(19, 'Chess Tournament 2025 Schedule', 'The Chess Tournament 2025 schedule has been released. Matches start in April.', 27, '2025-03-01 11:00:00', 9, 12, '2025-04-01 00:00:00', '2025-04-30 23:59:59'),
(20, 'Scrabble Championship 2025', 'Join the Scrabble Championship 2025 for word enthusiasts. Registration now open!', 28, '2025-04-01 12:00:00', 10, 13, '2025-04-01 00:00:00', '2025-05-31 23:59:59');

-- Insert Notifications
INSERT INTO notifications (notification_id, recipient_id, message, sent_at, is_read) VALUES
(1, 2, 'Congratulations! You have been selected for the Hall of Fame as Best Goal Scorer of the Season.', '2024-03-16 10:00:00', true),
(2, 3, 'Your team Thunder Strikers has won the match against Lightning Bolts. Great performance!', '2024-03-15 17:30:00', true),
(3, 4, 'You have a scheduled match tomorrow at 16:00. Please be at the venue 30 minutes early.', '2024-03-19 20:00:00', false),
(4, 5, 'New tournament registration is now open for Summer Cricket Tournament. Register your team now!', '2024-04-20 12:00:00', false),
(5, 2, 'Your profile has been updated successfully with your latest achievements.', '2024-04-01 14:15:00', true),
(6, 6, 'Congratulations! Your team Golden Gladiators won the Captain''s Football League match. Excellent leadership!', '2024-08-15 18:30:00', true),
(7, 7, 'Your Elite Cricket Championship tournament has been successfully created and scheduled for September.', '2024-08-20 14:00:00', true),
(8, 24, 'Congratulations on winning the Volleyball Championship! You are now in the Hall of Fame.', '2025-01-16 10:00:00', false),
(9, 25, 'Your Table Tennis match is scheduled for tomorrow. Prepare well!', '2025-02-09 15:00:00', false),
(10, 26, 'New announcement for Carrom Masters 2025. Check the details.', '2025-01-02 09:00:00', true),
(11, 27, 'Chess Tournament 2025 registration confirmed. Good luck!', '2025-03-02 11:00:00', true),
(12, 28, 'Scrabble Championship 2025 starts soon. Get ready for some word fun!', '2025-04-02 12:00:00', false);

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
INSERT INTO team_members (team_id, user_id, role_in_team, status) VALUES
-- Winter Wolves FC
(8, 6, 'Captain', 'ACCEPTED'),
(8, 2, 'Striker', 'ACCEPTED'),
(8, 3, 'Midfielder', 'ACCEPTED'),

-- Frost Giants United
(9, 7, 'Captain', 'ACCEPTED'),
(9, 4, 'Defender', 'ACCEPTED'),
(9, 5, 'Goalkeeper', 'ACCEPTED'),

-- Arctic Avalanche
(10, 2, 'Captain', 'ACCEPTED'),
(10, 6, 'Forward', 'ACCEPTED'),
(10, 7, 'Midfielder', 'ACCEPTED'),

-- Blizzard Bombers
(11, 3, 'Captain', 'ACCEPTED'),
(11, 4, 'Striker', 'ACCEPTED'),
(11, 5, 'Defender', 'ACCEPTED'),

-- Ice Storm FC
(12, 4, 'Captain', 'ACCEPTED'),
(12, 2, 'Midfielder', 'ACCEPTED'),
(12, 3, 'Wing', 'ACCEPTED'),

-- Polar Panthers
(13, 5, 'Captain', 'ACCEPTED'),
(13, 6, 'Forward', 'ACCEPTED'),
(13, 7, 'Defender', 'ACCEPTED'),

-- Snowfall Strikers
(14, 6, 'Captain', 'ACCEPTED'),
(14, 2, 'Striker', 'ACCEPTED'),
(14, 4, 'Midfielder', 'ACCEPTED'),

-- Glacier Gladiators
(15, 7, 'Captain', 'ACCEPTED'),
(15, 3, 'Forward', 'ACCEPTED'),
(15, 5, 'Defender', 'ACCEPTED'),

-- Frozen Thunder FC
(16, 2, 'Captain', 'ACCEPTED'),
(16, 3, 'Midfielder', 'ACCEPTED'),
(16, 4, 'Defender', 'ACCEPTED'),

-- Ice Hawks United
(17, 3, 'Captain', 'ACCEPTED'),
(17, 5, 'Striker', 'ACCEPTED'),
(17, 6, 'Goalkeeper', 'ACCEPTED'),

-- Winter Warriors FC
(18, 4, 'Captain', 'ACCEPTED'),
(18, 7, 'Forward', 'ACCEPTED'),
(18, 2, 'Midfielder', 'ACCEPTED'),

-- Frost Fire FC
(19, 5, 'Captain', 'ACCEPTED'),
(19, 6, 'Defender', 'ACCEPTED'),
(19, 7, 'Wing', 'ACCEPTED'),

-- Arctic Lions
(20, 6, 'Captain', 'ACCEPTED'),
(20, 2, 'Striker', 'ACCEPTED'),
(20, 3, 'Midfielder', 'ACCEPTED'),

-- Snow Leopards FC
(21, 7, 'Captain', 'ACCEPTED'),
(21, 4, 'Forward', 'ACCEPTED'),
(21, 5, 'Defender', 'ACCEPTED'),

-- Blizzard Eagles
(22, 2, 'Captain', 'ACCEPTED'),
(22, 3, 'Midfielder', 'ACCEPTED'),
(22, 6, 'Striker', 'ACCEPTED'),

-- Polar Storm FC
(23, 3, 'Captain', 'ACCEPTED'),
(23, 4, 'Defender', 'ACCEPTED'),
(23, 7, 'Goalkeeper', 'ACCEPTED'),

-- Frost Titans
(24, 4, 'Captain', 'ACCEPTED'),
(24, 5, 'Forward', 'ACCEPTED'),
(24, 2, 'Midfielder', 'ACCEPTED'),

-- Winter Phoenix FC
(25, 5, 'Captain', 'ACCEPTED'),
(25, 6, 'Striker', 'ACCEPTED'),
(25, 7, 'Wing', 'ACCEPTED'),

-- Ice Demons United
(26, 6, 'Captain', 'ACCEPTED'),
(26, 2, 'Midfielder', 'ACCEPTED'),
(26, 3, 'Defender', 'ACCEPTED'),

-- Arctic Sharks FC
(27, 7, 'Captain', 'ACCEPTED'),
(27, 4, 'Forward', 'ACCEPTED'),
(27, 5, 'Goalkeeper', 'ACCEPTED'),

-- Frozen Falcons
(28, 2, 'Captain', 'ACCEPTED'),
(28, 3, 'Striker', 'ACCEPTED'),
(28, 6, 'Midfielder', 'ACCEPTED'),

-- Snow Dragons FC
(29, 3, 'Captain', 'ACCEPTED'),
(29, 4, 'Defender', 'ACCEPTED'),
(29, 7, 'Wing', 'ACCEPTED'),

-- Glacier Bulls
(30, 4, 'Captain', 'ACCEPTED'),
(30, 5, 'Forward', 'ACCEPTED'),
(30, 2, 'Midfielder', 'ACCEPTED'),

-- Winter Stallions
(31, 5, 'Captain', 'ACCEPTED'),
(31, 6, 'Defender', 'ACCEPTED'),
(31, 7, 'Striker', 'ACCEPTED'),

-- Frost Vipers FC
(32, 6, 'Captain', 'ACCEPTED'),
(32, 2, 'Goalkeeper', 'ACCEPTED'),
(32, 3, 'Forward', 'ACCEPTED');

-- Additional Teams
INSERT INTO teams (team_id, team_name, sport_id, created_by, logo, tournament_id) VALUES
(33, 'Volley Masters', 6, 24, 'volley_masters_logo.png', 9),
(34, 'Spike Warriors', 6, 8, 'spike_warriors_logo.png', 9),
(35, 'Net Dominators', 6, 9, 'net_dominators_logo.png', 9),
(36, 'Block Busters', 6, 10, 'block_busters_logo.png', 9),
(37, 'Table Tennis Pros', 7, 25, 'table_tennis_pros_logo.png', 10),
(38, 'Carrom Champions', 8, 26, 'carrom_champions_logo.png', 11),
(39, 'Chess Grandmasters', 9, 27, 'chess_grandmasters_logo.png', 12),
(40, 'Scrabble Wizards', 10, 28, 'scrabble_wizards_logo.png', 13);

-- Additional Team Members
INSERT INTO team_members (team_id, user_id, role_in_team, status) VALUES
-- Volley Masters
(33, 24, 'Captain', 'ACCEPTED'),
(33, 8, 'Setter', 'ACCEPTED'),
(33, 9, 'Outside Hitter', 'ACCEPTED'),
(33, 10, 'Middle Blocker', 'ACCEPTED'),
(33, 11, 'Libero', 'ACCEPTED'),
(33, 12, 'Opposite Hitter', 'ACCEPTED'),

-- Spike Warriors
(34, 8, 'Captain', 'ACCEPTED'),
(34, 13, 'Setter', 'ACCEPTED'),
(34, 14, 'Outside Hitter', 'ACCEPTED'),
(34, 15, 'Middle Blocker', 'ACCEPTED'),
(34, 16, 'Libero', 'ACCEPTED'),
(34, 17, 'Opposite Hitter', 'ACCEPTED'),

-- Net Dominators
(35, 9, 'Captain', 'ACCEPTED'),
(35, 18, 'Setter', 'ACCEPTED'),
(35, 19, 'Outside Hitter', 'ACCEPTED'),
(35, 20, 'Middle Blocker', 'ACCEPTED'),
(35, 21, 'Libero', 'ACCEPTED'),
(35, 22, 'Opposite Hitter', 'ACCEPTED'),

-- Block Busters
(36, 10, 'Captain', 'ACCEPTED'),
(36, 23, 'Setter', 'ACCEPTED'),
(36, 34, 'Outside Hitter', 'ACCEPTED'),
(36, 35, 'Middle Blocker', 'ACCEPTED'),
(36, 36, 'Libero', 'ACCEPTED'),
(36, 37, 'Opposite Hitter', 'ACCEPTED'),

-- Table Tennis Pros (individual, but as team)
(37, 25, 'Player', 'ACCEPTED'),

-- Carrom Champions
(38, 26, 'Player', 'ACCEPTED'),

-- Chess Grandmasters
(39, 27, 'Player', 'ACCEPTED'),

-- Scrabble Wizards
(40, 28, 'Player', 'ACCEPTED');

-- Additional Teams for Spring Football Championship (Tournament ID 1)
INSERT INTO teams (team_id, team_name, sport_id, created_by, logo, tournament_id) VALUES
(41, 'Spring Eagles FC', 1, 1, 'spring_eagles_logo.png', 1),
(42, 'Spring Lions United', 1, 2, 'spring_lions_logo.png', 1),
(43, 'Spring Tigers FC', 1, 3, 'spring_tigers_logo.png', 1),
(44, 'Spring Wolves United', 1, 4, 'spring_wolves_logo.png', 1),
(45, 'Spring Bears FC', 1, 5, 'spring_bears_logo.png', 1),
(46, 'Spring Hawks United', 1, 6, 'spring_hawks_logo.png', 1),
(47, 'Spring Falcons FC', 1, 7, 'spring_falcons_logo.png', 1),
(48, 'Spring Sharks United', 1, 1, 'spring_sharks_logo.png', 1),
(49, 'Spring Panthers FC', 1, 2, 'spring_panthers_logo.png', 1),
(50, 'Spring Stallions United', 1, 3, 'spring_stallions_logo.png', 1),
(51, 'Spring Bulls FC', 1, 4, 'spring_bulls_logo.png', 1),
(52, 'Spring Dragons United', 1, 5, 'spring_dragons_logo.png', 1),
(53, 'Spring Phoenix FC', 1, 6, 'spring_phoenix_logo.png', 1),
(54, 'Spring Vipers United', 1, 7, 'spring_vipers_logo.png', 1),
(55, 'Spring Gladiators FC', 1, 1, 'spring_gladiators_logo.png', 1),
(56, 'Spring Warriors United', 1, 2, 'spring_warriors_logo.png', 1),
(57, 'Spring Avengers FC', 1, 3, 'spring_avengers_logo.png', 1),
(58, 'Spring Titans United', 1, 4, 'spring_titans_logo.png', 1),
(59, 'Spring Spartans FC', 1, 5, 'spring_spartans_logo.png', 1),
(60, 'Spring Vikings United', 1, 6, 'spring_vikings_logo.png', 1),
(61, 'Spring Knights FC', 1, 7, 'spring_knights_logo.png', 1),
(62, 'Spring Crusaders United', 1, 1, 'spring_crusaders_logo.png', 1),
(63, 'Spring Rangers FC', 1, 2, 'spring_rangers_logo.png', 1),
(64, 'Spring Rovers United', 1, 3, 'spring_rovers_logo.png', 1),
(65, 'Spring United FC', 1, 4, 'spring_united_logo.png', 1),
(66, 'Spring City United', 1, 5, 'spring_city_logo.png', 1),
(67, 'Spring Athletic FC', 1, 6, 'spring_athletic_logo.png', 1),
(68, 'Spring Albion United', 1, 7, 'spring_albion_logo.png', 1),
(69, 'Spring Wanderers FC', 1, 1, 'spring_wanderers_logo.png', 1),
(70, 'Spring Hotspur United', 1, 2, 'spring_hotspur_logo.png', 1),
(71, 'Spring Arsenal FC', 1, 3, 'spring_arsenal_logo.png', 1),
(72, 'Spring Chelsea United', 1, 4, 'spring_chelsea_logo.png', 1),
(73, 'Spring Liverpool FC', 1, 5, 'spring_liverpool_logo.png', 1),
(74, 'Spring Manchester United', 1, 6, 'spring_manchester_logo.png', 1),
(75, 'Spring Barcelona FC', 1, 7, 'spring_barcelona_logo.png', 1),
(76, 'Spring Real Madrid United', 1, 1, 'spring_real_madrid_logo.png', 1),
(77, 'Spring Bayern Munich FC', 1, 2, 'spring_bayern_munich_logo.png', 1),
(78, 'Spring Juventus United', 1, 3, 'spring_juventus_logo.png', 1),
(79, 'Spring AC Milan FC', 1, 4, 'spring_ac_milan_logo.png', 1),
(80, 'Spring Inter Milan United', 1, 5, 'spring_inter_milan_logo.png', 1);

-- Update Sports table with recent champion and runner-up information (after teams are inserted)
-- Based on the most recent tournament results for each sport
UPDATE sports SET recent_champion_id = 6, recent_runner_up_id = 1 WHERE sport_id = 1; -- Football: Golden Gladiators (champion), Thunder Strikers (runner-up)
UPDATE sports SET recent_champion_id = 3, recent_runner_up_id = 4 WHERE sport_id = 2; -- Basketball: Sky Warriors (champion), Fire Eagles (runner-up)
UPDATE sports SET recent_champion_id = 7, recent_runner_up_id = 5 WHERE sport_id = 3; -- Cricket: Silver Sharks (champion), Storm Riders (runner-up)
UPDATE sports SET recent_champion_id = 33, recent_runner_up_id = 34 WHERE sport_id = 6; -- Volleyball: Volley Masters (champion), Spike Warriors (runner-up)
UPDATE sports SET recent_champion_id = 37, recent_runner_up_id = NULL WHERE sport_id = 7; -- Table Tennis: Table Tennis Pros (champion)
UPDATE sports SET recent_champion_id = 38, recent_runner_up_id = NULL WHERE sport_id = 8; -- Carrom: Carrom Champions (champion)
UPDATE sports SET recent_champion_id = 39, recent_runner_up_id = NULL WHERE sport_id = 9; -- Chess: Chess Grandmasters (champion)
UPDATE sports SET recent_champion_id = 40, recent_runner_up_id = NULL WHERE sport_id = 10; -- Scrabble: Scrabble Wizards (champion)
-- Tennis and Badminton remain NULL as no tournaments have been completed yet

-- Insert Matches (using round_id to reference rounds table)
-- ==============================
-- INSERT INTO MATCHES
-- ==============================
INSERT INTO matches
(match_id, tournament_id, sport_id, team1_id, team2_id, scheduled_time, venue, status, winner_team_id, round_id, team_a_final_score, team_b_final_score)
VALUES
-- Spring Football Championship matches (Tournament ID 1)

-- Inter-College Basketball League matches (Tournament ID 2 - ROUND_ROBIN, no rounds needed)
(2, 2, 2, 3, 4, '2024-04-10 18:00:00', 'Basketball Court A', 'COMPLETED', 3, NULL, NULL, NULL),
(5, 2, 2, 3, 5, '2024-04-25 19:00:00', 'Basketball Court B', 'COMPLETED', 5, NULL, NULL, NULL),

-- Summer Cricket Tournament matches (Tournament ID 3)
(3, 3, 3, 5, 1, '2024-05-20 14:00:00', 'Cricket Stadium', 'ONGOING', NULL, 7, NULL, NULL),

-- Captain's Football League matches (Tournament ID 6 - ROUND_ROBIN, no rounds needed)
(6, 6, 1, 6, 1, '2024-08-15 16:00:00', 'Captain''s Ground', 'COMPLETED', 6, NULL, NULL, NULL),

-- Elite Cricket Championship matches (Tournament ID 7)
(7, 7, 3, 7, 5, '2024-09-10 14:30:00', 'Elite Cricket Ground', 'COMPLETED', 7, 13, NULL, NULL),

-- Volleyball Championship 2025 matches (Tournament ID 9)
(8, 9, 6, 33, 34, '2025-01-10 16:00:00', 'Volleyball Court A', 'COMPLETED', 33, 21, NULL, NULL), -- Semi-final
(9, 9, 6, 35, 36, '2025-01-12 17:00:00', 'Volleyball Court B', 'COMPLETED', 35, 21, NULL, NULL), -- Semi-final
(10, 9, 6, 33, 35, '2025-01-15 18:00:00', 'Main Volleyball Arena', 'COMPLETED', 33, 22, NULL, NULL), -- Final

-- Table Tennis Open 2025 matches (Tournament ID 10)
(11, 10, 7, 37, 37, '2025-02-10 14:00:00', 'Table Tennis Hall', 'COMPLETED', 37, 23, NULL, NULL), -- Since individual, perhaps placeholder

-- Carrom Masters 2025 matches (Tournament ID 11)
(12, 11, 8, 38, 38, '2025-03-10 15:00:00', 'Carrom Room', 'COMPLETED', 38, 25, NULL, NULL),

-- Chess Tournament 2025 matches (Tournament ID 12)
(13, 12, 9, 39, 39, '2025-04-10 13:00:00', 'Chess Lounge', 'COMPLETED', 39, 27, NULL, NULL),

-- Scrabble Championship 2025 matches (Tournament ID 13)
(14, 13, 10, 40, 40, '2025-05-10 12:00:00', 'Scrabble Area', 'COMPLETED', 40, 29, NULL, NULL);


-- ==============================
-- INSERT INTO SCORES
-- ==============================
INSERT INTO scores (score_id, match_id, team_a_id, team_a_points, team_b_id, team_b_points) VALUES
-- Match 1 (Football: Team 1 vs Team 2)


-- Match 2 (Basketball: Team 3 vs Team 4)


-- Match 3 (Cricket: Team 5 vs Team 1)
(3, 3, 5, 250, 1, 240),

-- Match 5 (Basketball: Team 3 vs Team 5)
(5, 5, 3, 92, 5, 87),

-- Match 8 (Volleyball: Team 33 vs Team 34)
(6, 8, 33, 3, 34, 1),

-- Match 9 (Volleyball: Team 35 vs Team 36)
(7, 9, 35, 3, 36, 2),

-- Match 10 (Volleyball: Team 33 vs Team 35)
(8, 10, 33, 3, 35, 0),

-- Match 11 (Table Tennis: Team 37 vs placeholder)
(9, 11, 37, 1, 37, 0),

-- Match 12 (Carrom: Team 38 vs placeholder)
(10, 12, 38, 1, 38, 0),

-- Match 13 (Chess: Team 39 vs placeholder)
(11, 13, 39, 1, 39, 0),

-- Match 14 (Scrabble: Team 40 vs placeholder)
(12, 14, 40, 1, 40, 0);



-- Additional announcements
INSERT INTO announcements (announcement_id, title, content, posted_by, posted_at, related_sport_id, related_tournament_id, start_date, end_date) VALUES
                                                                                                                                                     (11, 'Spring Football Championship Finals', 'The finals of Spring Football Championship will be held on March 15th. Don''t miss the exciting match between top two teams!', 1, '2024-03-10 10:00:00', 1, 1, '2024-03-15 15:00:00', '2024-03-15 17:00:00'),
                                                                                                                                                     (12, 'Basketball League Quarter Finals Schedule', 'Quarter finals schedule for the Inter-College Basketball League has been announced. Matches will be held from April 15th to April 20th.', 1, '2024-04-10 14:00:00', 2, 2, '2024-04-15 00:00:00', '2024-04-20 23:59:59'),
                                                                                                                                                     (13, 'Cricket Tournament Team Registration', 'Team registration for the upcoming cricket tournament is now open. Last date for registration is April 25th, 2024.', 1, '2024-04-15 09:00:00', 3, 3, '2024-04-15 00:00:00', '2024-04-25 23:59:59'),
                                                                                                                                                     (14, 'Tennis Coaching Camp Announcement', 'Special tennis coaching camp for beginners will be conducted from June 1st to June 15th. Limited seats available!', 1, '2024-05-20 11:00:00', 4, NULL, '2024-06-01 00:00:00', '2024-06-15 23:59:59'),
                                                                                                                                                     (15, 'Captain''s Football League Playoffs', 'Playoff matches for Captain''s Football League will begin on September 15th. Top 8 teams will compete for the championship.', 6, '2024-09-10 16:00:00', 1, 6, '2024-09-15 00:00:00', '2024-09-25 23:59:59');


--Insert into cricket-scores

INSERT INTO cricket_scores (match_id, team_a_id, team_b_id, team_a_innings, team_b_innings, team_a_total_run, team_b_total_run, team_a_total_wicket, team_b_total_wicket, team_a_overs, team_b_overs) VALUES (6, 6, 1, 1, 0, 275, NULL, 7, NULL, '50.0', NULL);

INSERT INTO cricket_scores (match_id, team_a_id, team_b_id, team_a_innings, team_b_innings, team_a_total_run, team_b_total_run, team_a_total_wicket, team_b_total_wicket, team_a_overs, team_b_overs) VALUES (6, 6, 1, 1, 2, 275, 260, 7, 9, '50.0', '49.2');

INSERT INTO cricket_scores (match_id, team_a_id, team_b_id, team_a_innings, team_b_innings, team_a_total_run, team_b_total_run, team_a_total_wicket, team_b_total_wicket, team_a_overs, team_b_overs) VALUES (7, 7, 5, 1, 0, 180, NULL, 10, NULL, '45.3', NULL);

INSERT INTO cricket_scores (match_id, team_a_id, team_b_id, team_a_innings, team_b_innings, team_a_total_run, team_b_total_run, team_a_total_wicket, team_b_total_wicket, team_a_overs, team_b_overs) VALUES (7, 7, 5, 1, 2, 180, 185, 10, 5, '45.3', '40.1');



-- Update sequences to continue from the next available ID
SELECT setval('teams_team_id_seq', 80, true);
SELECT setval('tournaments_tournament_id_seq', 18, true);
SELECT setval('matches_match_id_seq', 14, true);
SELECT setval('announcements_announcement_id_seq', 20, true);
SELECT setval('rounds_round_id_seq', 39, true);

COMMIT;