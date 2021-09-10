CREATE DATABASE pern_starter;

DROP TABLE IF EXISTS users, lines, memories, media;

/*
    NOTE: not sure if should use an id for primary key instead.
    Kinda forgot the rationale behind why should not use id as 
    primary key for CS2102 last time (I took under Yoga), 
    thought I think for this mod shouldnt really matter.
*/
CREATE TABLE users(
    user_id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    name VARCHAR NOT NULL,
    password VARCHAR NOT NULL
);

CREATE TABLE lines(
    line_id SERIAL PRIMARY KEY,
    user_id SERIAL NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    colour_hex CHAR(6) NOT NULL CHECK (colour_hex ~* '^[a-f0-9]{6}$')
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
    id SERIAL PRIMARY KEY, 
    url VARCHAR UNIQUE NOT NULL,
    memory_id SERIAL NOT NULL REFERENCES memories(memory_id) ON DELETE CASCADE
);

