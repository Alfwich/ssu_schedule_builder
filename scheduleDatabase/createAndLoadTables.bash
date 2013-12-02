#! /bin/bash

export CSV_FILE=campus_2014_spr_report.csv

echo 'Creating DB schema starts'
sed -i 's/$DB_NAME/'$DB_NAME'/' scheduleDBSchema.sql
mysql --password=$DB_PASS --user=$DB_USER < scheduleDBSchema.sql
sed -i 's/'$DB_NAME'/$DB_NAME/' scheduleDBSchema.sql
echo 'Creating DB schema ends'

python generateBaseTables.py
sed -i 's/$DB_NAME/'$DB_NAME'/' *.sql
for dataFile in course.sql professor.sql course_instance.sql section.sql \
    section_professor.sql student.sql schedule.sql major.sql section_time.sql \
    schedule_course_instance.sql;  do
    echo "Poplulating table $(echo $dataFile | sed 's/\.sql//')."
    mysql --password=$DB_PASS --user=$DB_USER < $dataFile
    echo "Poplulating table $(echo $dataFile | sed 's/\.sql//') completed."
done
sed -i 's/'$DB_NAME'/$DB_NAME/' *.sql

# major_requirement.sql
