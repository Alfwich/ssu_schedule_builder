USE schedule_assistace;

LOCK TABLES schedule WRITE;

SET foreign_key_checks = 0;

INSERT INTO schedule VALUES
(NULL, "000000001"),
(NULL, "000000002"),
(NULL, "000000003");

SET foreign_key_checks = 1;

UNLOCK TABLES;
