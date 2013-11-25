USE schedule;

SET foreign_key_checks = 0;

INSERT INTO schedule_course_instance VALUES
(NULL, (SELECT id FROM schedule ORDER BY RAND() LIMIT 1), (SELECT id FROM course_instance ORDER BY RAND() LIMIT 1)),
(NULL, (SELECT id FROM schedule ORDER BY RAND() LIMIT 1), (SELECT id FROM course_instance ORDER BY RAND() LIMIT 1)),
(NULL, (SELECT id FROM schedule ORDER BY RAND() LIMIT 1), (SELECT id FROM course_instance ORDER BY RAND() LIMIT 1)),
(NULL, (SELECT id FROM schedule ORDER BY RAND() LIMIT 1), (SELECT id FROM course_instance ORDER BY RAND() LIMIT 1)),
(NULL, (SELECT id FROM schedule ORDER BY RAND() LIMIT 1), (SELECT id FROM course_instance ORDER BY RAND() LIMIT 1)),
(NULL, (SELECT id FROM schedule ORDER BY RAND() LIMIT 1), (SELECT id FROM course_instance ORDER BY RAND() LIMIT 1)),
(NULL, (SELECT id FROM schedule ORDER BY RAND() LIMIT 1), (SELECT id FROM course_instance ORDER BY RAND() LIMIT 1));

SET foreign_key_checks = 1;

