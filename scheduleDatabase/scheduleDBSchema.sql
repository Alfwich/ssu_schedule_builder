use zthompson;
BEGIN;
set @@foreign_key_checks = 0;

DROP TABLE IF EXISTS section_professor;
DROP TABLE IF EXISTS section;
DROP TABLE IF EXISTS course; 

CREATE TABLE course (
    subject     varchar(6)      NOT NULL,
    catalog_no  varchar(6)      NOT NULL,
    title       varchar(50)     NOT NULL,
    units       varchar(6)      NOT NULL,
    ge_code     varchar(8),
    PRIMARY KEY (subject, catalog_no)
);

CREATE TABLE section (
    id              integer         NOT NULL PRIMARY KEY,
    class_no        integer         NOT NULL,
    course_subj     varchar(6)      NOT NULL,
    course_no       varchar(6)      NOT NULL,
    instance_no     varchar(2)      NOT NULL,
    section_no      varchar(4)      NOT NULL,
    location        varchar(16),
    days            varchar(8),
    start_time      varchar(8),
    end_time        varchar(8),
    component       varchar(4),
    FOREIGN KEY (course_subj, course_no)
        REFERENCES course (subject, catalog_no)
);

CREATE TABLE section_professor (
    section_id  integer         NOT NULL,
    prof_id     varchar(9)      NOT NULL,
    prof_fname  varchar(20)     NOT NULL,
    prof_lname  varchar(20)     NOT NULL,
    PRIMARY KEY (section_id, prof_id),
    FOREIGN KEY (section_id) REFERENCES section (id)
);

set @@foreign_key_checks = 1;
COMMIT;
