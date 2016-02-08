DROP SEQUENCE IF EXISTS people_id_seq CASCADE;
CREATE SEQUENCE people_id_seq;

DROP SEQUENCE IF EXISTS addresses_id_seq CASCADE;
CREATE SEQUENCE addresses_id_seq;

DROP TABLE IF EXISTS addresses CASCADE;
DROP TABLE IF EXISTS people CASCADE;

CREATE TABLE IF NOT EXISTS people (
	id			integer CONSTRAINT people_pk PRIMARY KEY DEFAULT nextval('people_id_seq'),
	firstName	varchar(50) NOT NULL,
	lastName	varchar(50) NOT NULL,
	birthdate	date
);

CREATE TABLE IF NOT EXISTS addresses (
	id			integer CONSTRAINT addresses_pk PRIMARY KEY DEFAULT nextval('addresses_id_seq'),
	address		varchar(50) NOT NULL,
	peopleId	integer REFERENCES people(id) ON DELETE CASCADE
);

INSERT INTO people(id, firstName, lastName, birthdate)
VALUES(default, 'qwe', 'qwe_', '11-11-2015');

INSERT INTO addresses(id, address, peopleId)
VALUES(default, 'qwe', 1), (default, 'qwe123', 1);
