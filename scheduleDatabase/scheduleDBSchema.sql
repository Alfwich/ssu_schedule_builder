use $DB_NAME;
BEGIN;
set @@foreign_key_checks = 0;

DROP TABLE IF EXISTS student_major;
DROP TABLE IF EXISTS major_department;
DROP TABLE IF EXISTS department;
DROP TABLE IF EXISTS major_requirement;
DROP TABLE IF EXISTS major;
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
    component           varchar(4),
    FOREIGN KEY (course_instance_id)
        REFERENCES course_instance (id)
);

CREATE TABLE section_time (
    section_id          char(4)         NOT NULL,
    day                 varchar(3)      NOT NULL,
    start_time          char(4), 
    end_time            char(4),
    location            varchar(16),
    PRIMARY KEY (section_id, day, start_time, location),
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

CREATE TABLE major (
    id                  integer         NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title               varchar(50)     NOT NULL UNIQUE,
    super_major         integer,
    FOREIGN KEY (super_major) REFERENCES major (id)
);

CREATE TABLE major_requirement (
    major_id            integer         NOT NULL,
    course_id           integer         NOT NULL,
    typ                 varchar(10)     NOT NULL,
    FOREIGN KEY (major_id) REFERENCES major (id),
    FOREIGN KEY (course_id) REFERENCES course (id)
);

CREATE TABLE student_major (
    major_id            integer         NOT NULL,
    student_id          varchar(9)      NOT NULL,
    PRIMARY KEY (major_id, student_id),
    FOREIGN KEY (major_id) REFERENCES major (id),
    FOREIGN KEY (student_id) REFERENCES student (id)
);

CREATE TABLE department (
    id                  integer         NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title               varchar(50)     NOT NULL
);

CREATE TABLE major_department (
    major_id            integer         NOT NULL,
    department_id       integer         NOT NULL,
    PRIMARY KEY (major_id, department_id),
    FOREIGN KEY (major_id) REFERENCES major (id),
    FOREIGN KEY (department_id) REFERENCES department(id)
);
    
set @@foreign_key_checks = 1;
COMMIT;
