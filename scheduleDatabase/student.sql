USE $DB_NAME;

LOCK TABLES student WRITE;

SET foreign_key_checks = 0;

INSERT INTO student VALUES
("000000001", "John", "Doe"),
("000000002", "Jane", "Doe"),
("000000003", "Billy", "Bob");

SET foreign_key_checks = 1;

UNLOCK TABLES;
