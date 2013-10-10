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
    printer.write("section_time", parser.section_times())


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

    def section_times(self):
        return self.section_parser.section_times


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

        #Input for sql writer
        self.course_instances = list()
        self.sections = list()
        self.section_professors = list()
        self.section_times = list()

        #Helper classes
        self.id_holder = id_holder
        self.instance_checker = InstanceChecker()

        #Helper members
        self.parsed_prof_sections = set()
        self.parsed_times = set()
        self.parsed_sections = set()
        self.cur_instance = list()
        self.row = dict()
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
                self.cur_instance = [self.row]
        else:
            self.cur_instance.append(self.row)

        # only add section a section once
        if self.row['Cls#'] not in self.parsed_sections:
            self.parsed_sections.add(self.row['Cls#'])
            self.sections.append(self.sql_section_output())

        # only add a time if it isn't a duplicate time (like two professors teaching one section or one section in two locations)
        pattern = self.row['Pat']
        day_list = list()
        if pattern != "ARR":
            if pattern == "FIVE":
                pattern = "MTWHF"
            num = 0
            for c in pattern:
                if c == 'H':
                    if day_list[-1] == 'T':
                        day_list[-1] = 'TH'
                    else:
                        day_list.append('TH')
                else:
                    day_list.append(c)
        else:
            day_list.append("ARR")

        for day in day_list:
            next_entry = self.row['Cls#'] + day + self.row['START TIME']
            if next_entry not in self.parsed_times:
                self.parsed_times.add(next_entry)
                self.section_times.append(self.sql_section_time_output(day))

        # only add professor if they haven't been added for the current section
        prof_section = self.row['ID'] + self.row['Cls#']
        if prof_section not in self.parsed_prof_sections:
            self.parsed_prof_sections.add(prof_section)
            self.section_professors.append(self.sql_section_professor_output())


    # Input: "10:00 AM", Output: "1000"
    def parse_time(self, time):
        if time:
            hour = time[:2]
            minute = time[3:5]

            if time[6:8] == "AM":
                if hour != "12":
                    return hour + minute
                else:
                    return "00" + minute

            else:
                if hour != "12":
                    return str(int(hour) + 12) + minute
                else:
                    return hour + minute

        else:
            return ""


    def sql_section_output(self):
        return [self.row['Cls#'], self.instance_id, self.row['Sct'], 
                self.row['Facil ID'], self.row['Component']]


    def sql_section_time_output(self, day):
        start_time = self.parse_time(self.row['START TIME'])
        end_time = self.parse_time(self.row['END TIME'])
        return [self.row['Cls#'], day, start_time, end_time]

    def sql_section_professor_output(self):
        return [self.row['Cls#'], self.row['ID']]

    def sql_instance_output(self):
        course_row = self.cur_instance[0]
        return [self.instance_id, 
                self.id_holder.get_course_id(course_row['Sbjt'] + course_row['Cat#'])]


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
