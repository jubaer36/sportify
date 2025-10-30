-- Drop the old cricket_scores table and create new simplified structure
DROP TABLE IF EXISTS cricket_scores CASCADE;

CREATE TABLE cricket_scores (
    cricket_score_id BIGSERIAL PRIMARY KEY,
    match_id BIGINT NOT NULL,
    team_id BIGINT NOT NULL,
    runs INTEGER DEFAULT 0,
    wickets INTEGER DEFAULT 0,
    overs DOUBLE PRECISION DEFAULT 0.0,
    CONSTRAINT fk_cricket_match FOREIGN KEY (match_id) REFERENCES matches(match_id) ON DELETE CASCADE,
    CONSTRAINT fk_cricket_team FOREIGN KEY (team_id) REFERENCES teams(team_id) ON DELETE CASCADE
);

-- Create index for faster queries by match_id
CREATE INDEX idx_cricket_scores_match_id ON cricket_scores(match_id);
CREATE INDEX idx_cricket_scores_team_id ON cricket_scores(team_id);
