import csv
import os

def main():
    
    parser = ScheduleParser()

    with open(os.environ['CSV_FILE']) as csvfile:
        reader = csv.DictReader(csvfile, delimiter=',', quotechar='"')
       
        for row in reader:

            strip_whitespace(row)
            parser.load(row)
            
    printer = SQLPrinter(os.environ['DB_NAME'])

    printer.write("course", parser.courses())
    printer.write("course_instance", parser.course_instances())
    printer.write("section", parser.sections())
    printer.write("professor", parser.professors())
    printer.write("section_professor", parser.section_professors())


def strip_whitespace(row):
    for k in row.keys():
        row[k] = row[k].strip()

class IdHolder:
    def __init__(self):
        self.course_ids = dict()

    def get_course_id(self, course):
        return self.course_ids[course]

    def set_course_id(self, course, num):
        self.course_ids[course] = num


class ScheduleParser:

    def __init__(self):
        self.id_holder = IdHolder()
        self.course_parser = CourseParser(self.id_holder)
        self.section_parser = SectionParser(self.id_holder)
        self.professor_parser = ProfessorParser(self.id_holder)

        
    def load(self, row):
        self.course_parser.load(row)
        self.section_parser.load(row)
        self.professor_parser.load(row)

    def courses(self):
        return self.course_parser.courses

    def course_instances(self):
        return self.section_parser.course_instances

    def sections(self):
        return self.section_parser.sections

    def section_professors(self):
        return self.section_parser.section_professors

    def professors(self):
        return self.professor_parser.professors


class InstanceChecker:

    def __init__(self):
        self.prev_row = dict()
        self.row = dict()

    def part_of_instance(self, row, cur_instance):
        self.row = row
        return all(map(self.is_same_instance, cur_instance))


    def is_same_instance(self, prev_row):
        self.prev_row = prev_row
        return (self.is_same_course() and 
                (self.is_same_id() or self.is_different_type()))


    def is_different_type(self):
        return self.row['Component'] != self.prev_row['Component']


    def is_same_id(self):
        return self.row['Cls#'] == self.prev_row['Cls#']


    def is_same_course(self):
        return (self.row['Sbjt'] == self.prev_row['Sbjt'] and 
                self.row['Cat#'] == self.prev_row['Cat#'])

    def same_course(self, row, prev_row):
        self.row = row
        self.prev_row = prev_row
        return self.is_same_course()


class SectionParser:

    def __init__(self, id_holder):
        self.id_holder = id_holder
        self.course_instances = list()
        self.sections = list()
        self.section_professors = list()
        self.instance_checker = InstanceChecker()
        self.cur_instance = list()
        self.row = dict()
        self.instance_num = 1
        self.section_id = 1
        self.instance_id = 1


    def load(self, row):
        self.row = row
        self.parse()

    # parse currently loaded row
    def parse(self):
        if self.cur_instance:
            if self.instance_checker.part_of_instance(self.row, self.cur_instance):
                self.cur_instance.append(self.row)
            else:
                self.course_instances.append(self.sql_instance_output())
                self.instance_id += 1
                self.update_instance_num()
                self.cur_instance = [self.row]
        else:
            self.cur_instance.append(self.row)

        self.sections.append(self.sql_section_output())
        self.section_professors.append(self.sql_section_professor_output())
        self.section_id += 1



    def update_instance_num(self):
        self.prev_row = self.cur_instance[0]
        if self.instance_checker.same_course(self.row, self.cur_instance[0]):
            self.instance_num += 1
        else:
            self.instance_num = 1


    def sql_section_output(self):
        return [self.section_id, self.instance_id, self.row['Cls#'],
                self.row['Sct'], self.row['Facil ID'], self.row['Pat'], 
                self.row['START TIME'], self.row['END TIME'], self.row['Component']]


    def sql_section_professor_output(self):
        return [self.section_id, self.row['ID']]

    def sql_instance_output(self):
        course_row = self.cur_instance[0]
        return [self.instance_id, 
                self.id_holder.get_course_id(course_row['Sbjt'] + course_row['Cat#']),
                self.instance_num]


class ProfessorParser:
    
    def __init__(self, id_holder):
        self.id_holder = id_holder
        self.parsed_profs = set()
        self.professors = list()
        self.row = dict()

    def load(self, row):
        self.row = row
        self.parse()
    
    # parse currently loaded row
    def parse(self):
        cur_prof = self.row['ID']
        if cur_prof not in self.parsed_profs:
            self.parsed_profs.add(cur_prof)
            self.professors.append(self.sql_output())

    def sql_output(self):
        return [self.row['ID'], self.row['First Name'], 
                self.row['Last']]

class CourseParser:

    def __init__(self, id_holder):
        self.id_holder = id_holder
        self.parsed_courses = set()
        self.courses = list()
        self.row = dict() 
        self.course_id= 1

    def load(self, row):
        self.row = row
        self.parse()

    # parse currently loaded row
    def parse(self):
        cur_course = self.row['Sbjt'] + self.row['Cat#']
        if cur_course not in self.parsed_courses:
            self.parsed_courses.add(cur_course)
            self.courses.append(self.sql_output())
            self.id_holder.set_course_id(cur_course, self.course_id)
            self.course_id += 1

    def sql_output(self):
        return [self.course_id, self.row['Sbjt'], self.row['Cat#'], 
                self.row['Descr'], self.row['SUV'],
                self.row['Designation']]

    
class SQLPrinter:

    def __init__(self, db_name):
        self.db_name = db_name 
        self.table_name = ""
        self.value_list = list()
        self.output = ""

    def write(self, table_name, value_list):
        self.table_name = table_name
        self.value_list = value_list

        self.header()
        self.values()
        self.footer()

        with open(table_name + ".sql", 'w') as f:
            f.write(self.output)

        self.output = ""

    def header(self):
        self.output += ("USE " + self.db_name + ";\n\n" +
                "LOCK TABLES " + self.table_name + " WRITE;\n\n" +
                "SET foreign_key_checks = 0;\n\n" +
                "INSERT INTO " + self.table_name + " VALUES\n")

    def values(self):
        last_item = self.value_list.pop(-1)

        for row in self.value_list:
            self.output += '("' + '","'.join(str(x) for x in row) + '"),\n'

        self.output += '("' + '","'.join(str(x) for x in last_item) + '");\n\n'

    def footer(self):
        self.output += ("SET foreign_key_checks = 1;\n\n" +
                "UNLOCK TABLES;")


if __name__ == "__main__":
    main()
