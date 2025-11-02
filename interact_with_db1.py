import os
import sqlite3
import streamlit as st

# Connect to SQLite database
connection1 = sqlite3.connect("student.db")
cursor = connection1.cursor()


#Faculty database
connection2 = sqlite3.connect("Faculty.db")

fac_cursor = connection2.cursor()



drop_table1_command = "DROP TABLE IF EXISTS SECTION1;"

# Execute the command
cursor.execute(drop_table1_command)
connection1.commit() 


drop_table2_command = "DROP TABLE IF EXISTS SECTION2;"

# Execute the command
cursor.execute(drop_table2_command)
connection1.commit()


drop_MARKS1_command = "DROP TABLE IF EXISTS MARKS;"

# Execute the command
cursor.execute(drop_MARKS1_command)
connection1.commit()



drop_MARKS2_command = "DROP TABLE IF EXISTS MARKS2;"

# Execute the command
cursor.execute(drop_MARKS2_command)
connection1.commit()

 




drop_faculty_command = "DROP TABLE IF EXISTS FACULTY;"

# Execute the command
fac_cursor.execute(drop_faculty_command)
connection2.commit() 


# Create table only if it doesn't exist to avoid errors on subsequent runs
cursor.execute("""
CREATE TABLE IF NOT EXISTS SECTION1 (
    STUDENT_ID INT,
    NAME VARCHAR(30),
    AGE INT
    
)
""")

cursor.execute("""
INSERT INTO SECTION1 VALUES
    (1,'POOJITH', 23),
    (2,'DEVAPRIYA', 22),  
    (3,'PRAGNA', 20),
    (4,'ANDREW', 24),
    (5, 'MIKE',25 ),
    (6, 'JOHN', 22)
""")

connection1.commit()

print("Inserted records are:")

data = cursor.execute("SELECT * FROM SECTION1")

rows = data.fetchall()  
for row in rows:
    print(row)





cursor.execute("""
CREATE TABLE IF NOT EXISTS SECTION2 (
    STUDENT_ID INT,
    NAME VARCHAR(30),
    AGE INT
)
""")

cursor.execute("""
INSERT INTO SECTION2 VALUES
    (7,'RYAN', 23),
    (8,'ANA', 22),  
    (9,'CASSIY', 19),
    (10,'KRISTI', 24),
    (11, 'RENI',25 ),
    (12, 'ARLIN', 22)
""")

connection1.commit()

print("Inserted records are:")

data2 = cursor.execute("SELECT * FROM SECTION2")

rows = data2.fetchall()  
for row in rows:
    print(row)



#################MARKS TBALE#######################

cursor.execute("""
CREATE TABLE IF NOT EXISTS MARKS (
    RECORD_ID INT,
    STUDENT_ID INT,
    ML INT,
    AI INT,
    DS INT,
    TOTAL AS (ML + AI + DS),
    FOREIGN KEY (STUDENT_ID) REFERENCES SECTION1(STUDENT_ID),
    FOREIGN KEY (STUDENT_ID) REFERENCES SECTION2(STUDENT_ID)
)
""")

cursor.execute("""
INSERT INTO MARKS (RECORD_ID, STUDENT_ID, ML, AI, DS)
VALUES
(1, 1, 85, 90, 95),
(2, 2, 88, 92, 89),
(3, 3, 78, 84, 80),
(4, 4, 91, 93, 88),
(5, 5, 85, 87, 90),
(6, 6, 80, 82, 85),
(7, 7, 90, 91, 92),
(8, 8, 88, 90, 87),
(9, 9, 84, 86, 85),
(10, 10, 82, 84, 83),
(11, 11, 91, 89, 90),
(12, 12, 77, 79, 75)
""")

connection1.commit()

print("Inserted records are:")

data3 = cursor.execute("SELECT * FROM MARKS")

rows = data3.fetchall()  
for row in rows:
    print(row)

connection1.close()














fac_cursor.execute(
    """CREATE TABLE IF NOT EXISTS FACULTY (
    Name VARCHAR(30),
    SUBJECT VARCHAR(30),
    SALARY VARCHAR(15),
    DEPARTMENT VARCHAR(30)
)
   """
)

fac_cursor.execute(
    """
    INSERT INTO FACULTY VALUES
    ('RAMESH', 'DATA STRUCTURES', 5000, 'COMPUTER SCIENCE'),
    ('ZHOU', 'BIG DATA', 6000, 'BIO MEDICAL'),  
    ('SHA', 'PREDICTIVE MODELING', 8000, 'MATHIMATICAL'),
    ('LAURA', 'INTRODUCTION TO DATA SCIENCE', 8000, 'DATA SCIENCE')
    """
)

connection2.commit()

rows = fac_cursor.execute('SELECT * from FACULTY')

for row in rows.fetchall():
    print(row)


connection2.close()