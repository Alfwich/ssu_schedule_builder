use $DB_NAME;
BEGIN;
set @@foreign_key_checks = 0;

DROP TABLE IF EXISTS section_professor;
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
    instance_no         varchar(2)      NOT NULL,
    FOREIGN KEY (course_id)
        REFERENCES course (id)
);

CREATE TABLE section (
    id                  integer         NOT NULL PRIMARY KEY,
    course_instance_id  integer         NOT NULL,
    class_no            integer         NOT NULL,
    section_no          varchar(4)      NOT NULL,
    location            varchar(16),
    days                varchar(8),
    start_time          varchar(8),
    end_time            varchar(8),
    component           varchar(4),
    FOREIGN KEY (course_instance_id)
        REFERENCES course_instance (id)
);

CREATE TABLE professor (
    id                  varchar(9)      NOT NULL PRIMARY KEY,
    fname               varchar(20)     NOT NULL,
    lname               varchar(20)     NOT NULL
);

CREATE TABLE section_professor (
    section_id          integer         NOT NULL,
    prof_id             varchar(9)      NOT NULL,
    PRIMARY KEY (section_id, prof_id),
    FOREIGN KEY (section_id) REFERENCES section (id),
    FOREIGN KEY (prof_id) REFERENCES professor (id)
);

set @@foreign_key_checks = 1;
COMMIT;
