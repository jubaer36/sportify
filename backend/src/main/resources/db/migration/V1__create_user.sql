CREATE TABLE users (
                       user_id SERIAL PRIMARY KEY,
                       name VARCHAR(100) NOT NULL,
                       email VARCHAR(100) UNIQUE NOT NULL,
                       username VARCHAR(100) UNIQUE,
                       password VARCHAR(255),
                       phone VARCHAR(20),
                       role VARCHAR(50) CHECK (role IN ('PLAYER', 'ADMIN', 'REFEREE', 'SCOREKEEPER')) NOT NULL,
                       profile_photo TEXT
);
