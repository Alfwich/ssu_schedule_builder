USE schedule_assistace;

LOCK TABLES major WRITE;

SET foreign_key_checks = 0;

INSERT INTO major VALUES
(NULL, "Computer Science", NULL);

SET foreign_key_checks = 1;

UNLOCK TABLES;
