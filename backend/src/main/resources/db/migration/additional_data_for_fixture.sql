-- Winter Football Championship - Additional Teams Data Insert
-- This script adds 25 new football teams for a single Winter Football Championship tournament

-- Create the Winter Football Championship tournament (single sport)
INSERT INTO tournaments (tournament_id, name, sport_id, type, start_date, end_date, created_by, champion_id, runner_up_id) VALUES
(8, 'Winter Football Championship 2024', 1, 'KNOCKOUT', '2024-12-01', '2024-12-31', 1, NULL, NULL);

-- Insert 25 new football teams for the Winter Football Championship
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

-- Add announcements for the Winter Football Championship
INSERT INTO announcements (announcement_id, title, content, posted_by, posted_at, related_sport_id, related_tournament_id) VALUES
(8, 'Winter Football Championship 2024 Registration Open!', 'The Winter Football Championship 2024 is now accepting team registrations! This knockout tournament will feature 32 teams competing for the winter crown. Register your teams before November 15th, 2024.', 1, '2024-11-01 09:00:00', 1, 8),
(9, 'Winter Football Championship Rules & Guidelines', 'Special winter playing conditions and rules have been published for the Winter Football Championship 2024. All 32 participating teams must review the updated guidelines including cold weather protocols.', 1, '2024-11-05 14:00:00', 1, 8),
(10, 'Winter Football Championship Draw Ceremony', 'The official draw ceremony for the Winter Football Championship 2024 will be held on November 20th. The knockout bracket will be announced with first round matches starting December 1st.', 1, '2024-11-10 11:30:00', 1, 8);

-- Update sequences to continue from the next available ID
SELECT setval('teams_team_id_seq', 32, true);
SELECT setval('tournaments_tournament_id_seq', 8, true);
SELECT setval('announcements_announcement_id_seq', 10, true);

COMMIT;