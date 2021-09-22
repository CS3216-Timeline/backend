CREATE DATABASE cs3216_timeline;

DROP TABLE IF EXISTS users, lines, memories, media;

CREATE TABLE users(
    user_id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    password VARCHAR,
    picture_url VARCHAR
);

CREATE TABLE lines(
    line_id SERIAL PRIMARY KEY,
    user_id SERIAL NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    color_hex CHAR(6) NOT NULL CHECK (color_hex ~* '^[a-f0-9]{6}$'),
    last_updated_date TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE (user_id, name)
);

CREATE TABLE memories(
    memory_id SERIAL PRIMARY KEY,
    line_id SERIAL NOT NULL REFERENCES lines(line_id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    description VARCHAR,
    creation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    latitude numeric,
    longitude numeric,
    CHECK ((latitude >= -90 AND latitude <= 90 AND longitude >= -180 AND longitude <= 180) OR (latitude IS NULL AND longitude IS NULL))
);

CREATE TABLE media(
    media_id SERIAL PRIMARY KEY, 
    url VARCHAR UNIQUE NOT NULL,
    memory_id SERIAL NOT NULL REFERENCES memories(memory_id) ON DELETE CASCADE,
    position INT NOT NULL,
    UNIQUE (memory_id, position) DEFERRABLE INITIALLY DEFERRED;
);

CREATE OR REPLACE FUNCTION refresh_updated_date() RETURNS TRIGGER
AS $$
BEGIN
    IF (TG_TABLE_NAME = 'media') THEN
        IF (TG_OP = 'DELETE') THEN
            UPDATE lines SET last_updated_date = NOW() WHERE line_id = (SELECT line_id FROM memories WHERE memory_id = OLD.memory_id);
        ELSE
            UPDATE lines SET last_updated_date = NOW() WHERE line_id = (SELECT line_id FROM memories WHERE memory_id = NEW.memory_id);
    END IF;
    ELSE
        IF (TG_OP = 'DELETE') THEN
            UPDATE lines SET last_updated_date = NOW() WHERE line_id = OLD.line_id;
        ELSE
            UPDATE lines SET last_updated_date = NOW() WHERE line_id = NEW.line_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER update_line_media 
AFTER INSERT OR UPDATE OR DELETE ON media 
FOR EACH ROW 
EXECUTE PROCEDURE refresh_updated_date();

CREATE TRIGGER update_line_memories 
AFTER INSERT OR UPDATE OR DELETE ON memories 
FOR EACH ROW 
EXECUTE PROCEDURE refresh_updated_date();

CREATE TRIGGER update_line_details 
AFTER UPDATE ON lines
FOR EACH ROW
WHEN ((OLD.* IS DISTINCT FROM NEW.*) AND (OLD.last_updated_date = NEW.last_updated_date))
EXECUTE PROCEDURE refresh_updated_date();
