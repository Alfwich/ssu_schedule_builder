use $DB_NAME;
BEGIN;
set @@foreign_key_checks = 0;

DROP TABLE IF EXISTS section_professor;
DROP TABLE IF EXISTS schedule_course_instance;
DROP TABLE IF EXISTS schedule;
DROP TABLE IF EXISTS student_course;
DROP TABLE IF EXISTS student;
DROP TABLE IF EXISTS section_time;
DROP TABLE IF EXISTS section;
DROP TABLE IF EXISTS professor;
DROP TABLE IF EXISTS course_instance;
DROP TABLE IF EXISTS course; 

CREATE TABLE course (
    id                  integer         NOT NULL PRIMARY KEY,
    subject             varchar(6)      NOT NULL,
    catalog_no          varchar(6)      NOT NULL,
    title               varchar(50)     NOT NULL,
    units               varchar(6)      NOT NULL,
    ge_code             varchar(8)
);

CREATE TABLE course_instance (
    id                  integer         NOT NULL PRIMARY KEY,
    course_id           integer         NOT NULL,
    FOREIGN KEY (course_id)
        REFERENCES course (id)
);

CREATE TABLE section (
    id                  char(4)         NOT NULL PRIMARY KEY,
    course_instance_id  integer         NOT NULL,
    section_no          integer         NOT NULL,
    location            varchar(16),
    component           varchar(4),
    FOREIGN KEY (course_instance_id)
        REFERENCES course_instance (id)
);

CREATE TABLE section_time (
    section_id          char(4)         NOT NULL,
    day                 varchar(3)      NOT NULL,
    start_time          char(4)         NOT NULL,
    end_time            char(4)         NOT NULL,
    PRIMARY KEY (section_id, day, start_time),
    FOREIGN KEY (section_id)
        REFERENCES section(id)
);

CREATE TABLE professor (
    id                  varchar(9)      NOT NULL PRIMARY KEY,
    fname               varchar(20)     NOT NULL,
    lname               varchar(20)     NOT NULL
);

CREATE TABLE section_professor (
    section_id          char(4)         NOT NULL,
    prof_id             varchar(9)      NOT NULL,
    PRIMARY KEY (section_id, prof_id),
    FOREIGN KEY (section_id) REFERENCES section (id),
    FOREIGN KEY (prof_id) REFERENCES professor (id)
);

CREATE TABLE student (
    id                  varchar(9)      NOT NULL PRIMARY KEY,
    fname               varchar(20)     NOT NULL,
    lname               varchar(20)     NOT NULL
);

CREATE TABLE student_course (
    student_id          varchar(9)      NOT NULL,
    course_id           integer         NOT NULL,
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES student (id),
    FOREIGN KEY (course_id) REFERENCES course (id)
);

CREATE TABLE schedule (
    id                  integer         NOT NULL AUTO_INCREMENT PRIMARY KEY,
    student_id          varchar(9)      NOT NULL,
    FOREIGN KEY (student_id) REFERENCES student (id)
);

CREATE TABLE schedule_course_instance (
    schedule_id         integer         NOT NULL,
    course_instance_id  integer         NOT NULL,
    PRIMARY KEY (schedule_id, course_instance_id),
    FOREIGN KEY (schedule_id) REFERENCES schedule (id),
    FOREIGN KEY (course_instance_id) REFERENCES course_instance (id)
);

set @@foreign_key_checks = 1;
COMMIT;
