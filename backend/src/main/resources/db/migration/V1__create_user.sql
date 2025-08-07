CREATE TABLE users (
                       user_id SERIAL PRIMARY KEY,
                       name VARCHAR(100) NOT NULL,
                       email VARCHAR(100) UNIQUE NOT NULL,
                       phone VARCHAR(20),
                       role VARCHAR(50) CHECK (role IN ('user', 'admin', 'captain')) NOT NULL,
                       profile_photo TEXT
);
