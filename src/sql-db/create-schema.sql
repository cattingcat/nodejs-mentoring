DROP SEQUENCE IF EXISTS people_id_seq CASCADE;
CREATE SEQUENCE people_id_seq;

CREATE TABLE IF NOT EXISTS people (
	id			integer CONSTRAINT people_pk PRIMARY KEY DEFAULT nextval('people_id_seq'),
	firstName	varchar(50) NOT NULL,
	lastName	varchar(50) NOT NULL,
	birthdate	date
);

CREATE TABLE IF NOT EXISTS addresses (
	id			integer CONSTRAINT addresses_pk PRIMARY KEY,
	address		varchar(50) NOT NULL,
	userId		integer REFERENCES people(id)
);
