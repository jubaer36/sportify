-- Create certificates table
CREATE TABLE IF NOT EXISTS certificates (
    certificate_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    tournament_id BIGINT NOT NULL,
    sport_id BIGINT NOT NULL,
    position VARCHAR(64) NOT NULL,
    issued_on DATE NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT fk_cert_user FOREIGN KEY (user_id) REFERENCES users(user_id),
    CONSTRAINT fk_cert_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments(tournament_id),
    CONSTRAINT fk_cert_sport FOREIGN KEY (sport_id) REFERENCES sports(sport_id)
);


