USE $DB_NAME;

LOCK TABLES major WRITE;

SET foreign_key_checks = 0;

INSERT INTO major VALUES
(NULL, "Computer Science", NULL);

SET foreign_key_checks = 1;

UNLOCK TABLES;
