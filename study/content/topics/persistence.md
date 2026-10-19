---
id: persistence
title: אחסון ו-SQL
sources:
  - "materials/lectures/Chapter 13 - Persistance.pptx"
  - "materials/notes/lecture-notes.docx.pdf"
  - "materials/sessions/SPL_PS12.pptx"
  - "materials/sessions/SPL_PS13_PRES.pptx"
  - "materials/exams/15-a.pdf"
  - "materials/exams/15-a-solution.pdf"
  - "materials/exams/15-b.pdf"
  - "materials/exams/15-b-solution.pdf"
  - "materials/exams/16-a.pdf"
  - "materials/exams/16-a-solution.pdf"
  - "materials/exams/16-b.pdf"
  - "materials/exams/16-b-solution.pdf"
  - "materials/exams/17-a.pdf"
  - "materials/exams/17-a-solution.pdf"
  - "materials/exams/17-b.pdf"
  - "materials/exams/17-b-solution.pdf"
  - "materials/exams/18-a.pdf"
  - "materials/exams/18-a-solution.pdf"
  - "materials/exams/18-b.pdf"
  - "materials/exams/18-b-solution.pdf"
  - "materials/exams/19-a.pdf"
  - "materials/exams/19-a-solution.pdf"
  - "materials/exams/19-b.pdf"
  - "materials/exams/19-b-solution.pdf"
  - "materials/exams/20-a.pdf"
  - "materials/exams/20-a-solution.pdf"
  - "materials/exams/20-b.pdf"
  - "materials/exams/20-b-solution.pdf"
---

RAM שוכח. הוא צריך חשמל, הוא נמחק באתחול, הוא מת עם התהליך (process), והוא המאגר היקר והקטן יותר. דיסק שומר בתים עד שמישהו מוחק אותם, והוא גדול. סיריאליזציה (serialization) יכולה לשים אובייקט על הדיסק הזה. פרק 13 מונה למה זה עדיין אינו בסיס נתונים: חיפוש עושה דה-סיריאליזציה (deserialization) לאובייקטים שלמים, אין אינדקס, עדכון כותב את הקובץ מחדש, מקביליות היא מנעול שאתם ממציאים, ואין טרנזקציות.

DBMS הוא סביבת הריצה של הנתונים האלה. ההרצאה נוקבת ב-MS SQL Server, ב-MySQL, ב-Oracle, וב-SQLite. מתחת, השכבות הן גישה לדיסק, גישה לקבצים, פעולות על רשומות (record/row), ושאילתות.

## המודל הרלציוני

:::definition id=def-relational title="בסיס נתונים רלציוני" source="materials/lectures/Chapter 13 - Persistance.pptx"
בסיס נתונים רלציוני (Relational Database) שומר רשומות בטבלאות (table). לשדה (field) יש שם וטיפוס. מפתח ראשי (primary key) מזהה רשומה אחת. מפתח זר (foreign key) הוא הפניה למפתח בטבלה אחרת, והוא צריך להיות ייחודי ביעד, בדרך כלל המפתח הראשי של אותה טבלה. בשקפים, מצביע או הפניה הם מפתח זר. שדה יכול להיות `NOT NULL` או `UNIQUE`.

כלל העיצוב בשקפים: מחלקה הופכת לטבלה, הפניה הופכת למפתח זר, ורשימה הופכת לטבלה נוספת. הזוג `(student id, course id)` בטבלה הנוספת הזו הוא המפתח הראשי של הקישור, וכל אחד משני השדות האלה הוא מפתח זר.

הסיכומים מוסיפים את סדר העיצוב. מחלקה היא טבלה. שדה שהטיפוס שלו הוא אובייקט אינו עמודה של אובייקט: הוא מפתח זר אל הטבלה של המחלקה ההיא, או טבלה של היעד כשהקשר הוא הבעלות. שדה שהוא מערך או אוסף הוא טבלת קישור, לא רשימת עמודות. שדה ששולפים לפיו מקבל אינדקס. בכל טבלה יש שדה, או קבוצת שדות, שהם גם המפתח וגם ייחודיים.
:::

הפעולות של המודל, בשמות של הסיכומים: בחירה (selection) שומרת שורות לפי תנאי, הטלה (projection) שומרת עמודות, ומכפלה קרטזית מזווגת כל שורה עם כל שורה. צירוף (join) הוא שלושתן יחד: מכפלה, ואז בחירה של הזוגות שתנאי החיבור מתקיים בהם, ואז הטלה אל העמודות שביקשו. `SELECT` בלי תנאי חיבור נעצר אחרי המכפלה.

האוניברסיטה של ההרצאה:

| students | | | |
| --- | --- | --- | --- |
| id | name | login | dept |
| 3984 | Alice | alice12 | 1 |

| departments | | |
| --- | --- | --- |
| id | name | building |
| 1 | science | 37 |

| courses | | |
| --- | --- | --- |
| id | name | teacher |
| 1 | prog | Gil |

רשימת הקורסים של סטודנט אינה שדה של מערכים. היא `StudentsCourses(StudId, CourseId, Year, Grade)` עם מפתח ראשי `(StudId, CourseId, Year)`.

NoSQL, על שקף אחד, הוא המשפחה האחרת: מאגר מפתח-ערך, קרוב לטבלת גיבוב, עם MongoDB ו-Redis כדוגמאות. שאר הפרק, וכל שאלה, הם SQL רלציוני.

### DDL

שפת הגדרת הנתונים של SQL יוצרת והורסת את הצורה.

```sql
CREATE TABLE Students (
  Id INTEGER PRIMARY KEY,
  Name VARCHAR(20) NOT NULL,
  Login VARCHAR(10) UNIQUE,
  DeptId INTEGER REFERENCES Departments(Id)
);
CREATE TABLE Departments (
  Id INTEGER PRIMARY KEY,
  Name VARCHAR(20) UNIQUE NOT NULL,
  Building INTEGER
);
CREATE INDEX idx_departments_name ON Departments(name);
CREATE TABLE StudentsCourses (
  StudId INTEGER,
  CourseId INTEGER,
  Year INTEGER,
  Grade INTEGER,
  PRIMARY KEY (StudId, CourseId, Year),
  FOREIGN KEY (StudId) REFERENCES Students(Id),
  FOREIGN KEY (CourseId) REFERENCES Courses(Id)
);
```

סכימה (schema) היא מרחב שמות של טבלאות. `CREATE SCHEMA University;` ו-`DROP SCHEMA`. `DROP TABLE Students;`, `DROP INDEX ...`, ו-`ALTER TABLE Students ADD COLUMN Email VARCHAR(50);` הן פקודות ה-DDL האחרות בשקפים.

### DML

שפת הטיפול בנתונים משנה וקוראת רשומות.

```sql
INSERT INTO Departments (Id, Name, Building) VALUES (1, 'science', 37);
INSERT INTO Students (Id, DeptId) VALUES (2485, 2);          -- fails: Name is NOT NULL
INSERT INTO Students (Id, Name, DeptId) VALUES (2485, 'Bob', 2);  -- Login may be omitted
```

השמטת רשימת השדות, `INSERT INTO Courses VALUES (1, 'prog', 'Gil')`, עובדת רק כל עוד סדר השדות בטבלה תואם את סדר הערכים. ההרצאה מייעצת נגד זה.

```sql
UPDATE Students SET Login = 'bob12' WHERE Id = 2485;   -- one row, Id is unique
UPDATE Students SET Login = 'x';                        -- every row
DELETE FROM Students WHERE Id = 2485;
DELETE FROM Students WHERE Id < 3000;
DELETE FROM Students;                                   -- every row, the table stays
```

`SELECT` הוא הקריאה.

```sql
SELECT * FROM Students;
SELECT Id, Name FROM Students;
SELECT * FROM Students WHERE Id = 3984;
```

`SELECT Students.Name, Courses.Name FROM Students, Courses` בלי תנאי חיבור הוא המכפלה הקרטזית: כל סטודנט מזווג עם כל קורס. Alice מופיעה פעם לכל קורס. התיקון הוא inner join.

```sql
SELECT S.name, C.name
FROM Students S
INNER JOIN StudentsCourses SC ON S.id = SC.student_id
INNER JOIN Courses C ON SC.course_id = C.id;
```

![Students, טבלת ההרשמה, ו-Courses. Alice מקושרת ל-prog. ל-Bob ול-systems אין רשומת קישור](../assets/figures/sql-join.svg)

`INNER JOIN` שומר רק רשומות שמתאימות. `LEFT JOIN` שומר כל סטודנט, עם שדות קורס שהם null כשאין לסטודנט הרשמה. `RIGHT JOIN` שומר כל קורס, עם שדות סטודנט שהם null כשאף אחד לא למד אותו. `FULL JOIN` שומר את שני הצדדים. טבלאות המתרגלים של מפגש 12 הן אותו דפוס: `PRACTICAL_SESSIONS.TA_ID` מפנה אל `TEACHING_ASSISTANTS.ID`, ו-left join מראה את Matan ואת Yair עם שדות מפגש תרגול שהם null כי אין להם קבוצה.

מפגש 13 שם תוכנית Python לפני הטבלאות האלה. DTO הוא רשומה אחת כאובייקט (`Student` עבור הטבלה `students`). DAO הוא האובייקט שעושה `insert` ו-`find` ל-DTO הזה, בדרך כלל טבלה אחת, לעתים קרובות singleton. repository מחזיק כמה DAO ואת המתודות שמחברות טבלאות, כולל `create_tables`. ORM הוא הגרסה הגנרית: `row_map` בונה DTO מרשומה לפי סדר השדות, ומחלקת DAO אחת משרתת כל טבלה. דוגמת בודק המטלות שומרת `students`, `assignments`, ו-`grades`, מריצה קובץ שהוגש, וכותבת רשומת ציון. Bob נכשל כי הפונקציה שלו מחזירה `"main"` והפלט הצפוי הוא `"Main"`.

:::problem id=worked-inner-join title="מה inner join מחזיר" source="materials/lectures/Chapter 13 - Persistance.pptx" kind=worked solution_origin=source
Alice רשומה ל-`prog`. Bob אינו רשום לכלום. `prog` ו-`systems` שניהם קיימים. מה השאילתה הזו מחזירה, ומה left join מוסיף?

```sql
SELECT S.name, C.name
FROM Students S
INNER JOIN StudentsCourses SC ON S.id = SC.student_id
INNER JOIN Courses C ON SC.course_id = C.id;
```

:::solution
ה-inner join מחזיר רשומה אחת, Alice עם `prog`. ל-Bob אין רשומת קישור, ולכן הוא נעלם. גם קורס שאף אחד אינו לומד נעלם.

ה-left join מסטודנטים עדיין מחזיר את Alice עם `prog`, והוא מחזיר את Bob עם שם קורס שהוא null. Bob נשמר כי הטבלה השמאלית נשמרת. `systems` עדיין אינו מופיע, כי החיבור התחיל מסטודנטים. right join מסטודנטים לקורסים היה מראה את `systems` עם סטודנט שהוא null והיה משמיט את Bob.
:::
:::

:::check id=chk-fk
ערך 9 ב-`Students.DeptId`, כשב-`Departments` יש מזהים 1 ו-2, מפר איזה אילוץ?

- [ ] `PRIMARY KEY` על `Students.Id`
- [x] המפתח הזר מ-`DeptId` אל `Departments.Id`
- [ ] `NOT NULL` על `Students.Name`

מפתח זר אומר שכל `DeptId` הוא מזהה של רשומה כלשהי ב-`Departments`. הייחודיות של `Students.Id` היא אילוץ אחר.
:::

:::trap
`SELECT * FROM A, B` נראה כמו join והוא מכפלה. על טבלה של אלף רשומות מול אלף אחרות מתקבלות מיליון רשומות. הרשימה של Alice כפול כל קורס בהרצאה היא הבאג הזה בקנה מידה קטן.
:::

:::trap
רשימה שנשמרת כשדה אחד מופרד בפסיקים אינה יכולה להיות מפתח זר, ואי אפשר לאנדקס אותה כשייכות. הכלל של ההרצאה הוא טבלה נוספת.
:::

## תרגול

:::problem id=ps12-foreign-key title="מפתח זר של מתרגל" source="materials/sessions/SPL_PS12.pptx" kind=exercise solution_origin=source
ב-`PRACTICAL_SESSIONS` של מפגש 12 יש שדות `TA_ID`, `GroupNum`, `Location`, `Time`. ב-`TEACHING_ASSISTANTS` יש `ID`, `Name`, `OfficeHours`. כתבו את שני משפטי ה-`CREATE TABLE`. `GroupNum` הוא המפתח הראשי של מפגש תרגול. `ID` הוא המפתח הראשי של מתרגל. `TA_ID` של מפגש תרגול מפנה למתרגל.

:::hint
המפתח הזר הוא השדה שמשמעותו "המזהה של רשומה שם".
:::
:::hint
`OfficeHours` ו-`Time` יכולים להיות טקסט. `ID` ו-`GroupNum` הם מספרים שלמים.
:::
:::hint
הצהירו על המפתח הראשי של הטבלה שאליה מפנים לפני שמסתמכים עליו, או הצהירו על המפתח הזר אחרי ששתי הטבלאות קיימות.
:::
:::solution
```sql
CREATE TABLE TEACHING_ASSISTANTS (
  ID INTEGER PRIMARY KEY,
  Name TEXT NOT NULL,
  OfficeHours TEXT
);
CREATE TABLE PRACTICAL_SESSIONS (
  GroupNum INTEGER PRIMARY KEY,
  TA_ID INTEGER REFERENCES TEACHING_ASSISTANTS(ID),
  Location TEXT,
  Time TEXT
);
```

הכנסת מפגש תרגול עם `TA_ID = 8` נכשלת אם אין מתרגל עם `ID` 8. זה האילוץ שדוגמת ה-insert של מפגש 12 עומדת להתנגש בו.
:::
:::

:::problem id=ps12-join title="join של מפגש ומתרגל" source="materials/sessions/SPL_PS12.pptx" kind=exercise solution_origin=source
אלה שתי הטבלאות. כתבו שאילתה שמחזירה `Time`, `Location`, `GroupNum`, ואת `Name` של המתרגל, לכל מפגש תרגול שיש לו מתרגל. אחר כך אמרו מה left join ממתרגלים מוסיף שהשאילתה הזו מסתירה. בדוגמה, Shaked על שתי קבוצות ו-Matan על אף אחת.

```sql
CREATE TABLE TEACHING_ASSISTANTS (
  ID INTEGER PRIMARY KEY,
  Name TEXT NOT NULL,
  OfficeHours TEXT
);
CREATE TABLE PRACTICAL_SESSIONS (
  GroupNum INTEGER PRIMARY KEY,
  TA_ID INTEGER REFERENCES TEACHING_ASSISTANTS(ID),
  Location TEXT,
  Time TEXT
);
```

:::hint
התאימו את `PRACTICAL_SESSIONS.TA_ID` ל-`TEACHING_ASSISTANTS.ID`.
:::
:::hint
inner join משמיט את המתרגל שאין לו מפגש תרגול.
:::
:::hint
הגדירו במפורש את השדות ששתי הטבלאות חולקות, או תנו כינוי לטבלאות.
:::
:::solution
```sql
SELECT ps.Time, ps.Location, ps.GroupNum, ta.Name
FROM PRACTICAL_SESSIONS ps
INNER JOIN TEACHING_ASSISTANTS ta ON ps.TA_ID = ta.ID;
```

Shaked מופיע פעמיים, פעם לכל קבוצה. Matan אינו מופיע. `LEFT JOIN` מ-`TEACHING_ASSISTANTS` אל מפגשי התרגול שומר את Matan ואת Yair, עם `Time`, `Location`, ו-`GroupNum` שהם null, וזו טבלת התוצאה השנייה על השקף של מפגש 12.
:::
:::

:::problem id=ps13-dto-dao title="DTO מול DAO" source="materials/sessions/SPL_PS13_PRES.pptx" kind=exercise solution_origin=source
לבודק של מפגש 13 יש טבלאות `students(id, name)`, `assignments(num, expected_output)`, ו-`grades(student_id, assignment_num, grade)`. נקבו ב-DTO, ב-DAO, ובמתודת ה-repository שמחזירה ציון יחד עם שם הסטודנט. אמרו למה המתודה האחרונה אינה על ה-DAO של הציונים.

:::hint
DTO הוא רשומה אחת. שמו הוא רשומת הטבלה, ביחיד.
:::
:::hint
המתודות של DAO מזכירות טבלה אחת.
:::
:::hint
join חוצה טבלאות, ולכן הוא חי על ה-repository.
:::
:::solution
`Student`, `Assignment`, ו-`Grade` הם ה-DTO. `_Students`, `_Assignments`, ו-`_Grades` הם ה-DAO, כל אחד מחזיק את החיבור ומממש `insert` ו-`find` לטבלה אחת. `repo.get_grades_with_names()` מחבר את `grades` אל `students` ומחזיר רשומות שיש בהן גם `assignment_num` וגם `name`. המתודה הזו שייכת ל-repository, כי היא אינה עוסקת בטבלה אחת. גם `create_tables` נמצא ב-repository, מאותה סיבה: הוא יוצר את שלושתן.

ההגשה של Bob מחזירה `"main"` ו-`expected_output` של המטלה הוא `"Main"`, ולכן רשומת הציון שלו רושמת את אי-ההתאמה. ההשוואה רגישה לאותיות גדולות כי המפגש מדפיס שהוא נכשל בדיוק מהסיבה הזו.
:::
:::

:::problem id=ps13-orm-find title="מיפוי עמודות ל-DTO" source="materials/sessions/SPL_PS13_PRES.pptx" kind=exercise solution_origin=source
המפגש מחליף `find` שנכתב ביד ב-`row_map(row, col_mapping, dto_type)`, שבונה ארגומנטים לבנאי לפי אינדקס שדה וקורא לבנאי של ה-DTO. `Assignment.find` היה `return Assignment(*c.fetchone())`. מה `col_mapping` חייב להכיל כדי שה-`find` הגנרי עדיין יבנה `Assignment(num, expected_output)`?

:::hint
סדר ארגומנטי הבנאי הוא הסדר של ה-DTO, לא כל סדר ש-`SELECT *` במקרה משתמש בו, אלא אם עשיתם את הסדרים האלה תואמים.
:::
:::hint
`row_map` מאנדקס את הרשומה עם כל איבר של `col_mapping`.
:::
:::hint
`Assignment` מקבל `num` ואחר כך `expected_output`.
:::
:::solution
`col_mapping` הוא רשימת האינדקסים לפי סדר הבנאי. אם הרשומה היא `(num, expected_output)`, המיפוי הוא `[0, 1]`. אם שאילתה בחרה `expected_output` לפני `num`, המיפוי הוא `[1, 0]`, כדי שהבנאי עדיין יקבל את `num` ראשון. `dto_type(*ctor_args)` הוא `Assignment(num, expected_output)`. מיפוי שהולך אחרי `SELECT *` בעיניים עצומות נשבר ברגע שסדר השדות בטבלה משתנה, וזו אותה אזהרה שהרצאת ה-SQL נתנה על `INSERT` בלי רשימת שדות.
:::
:::


:::examnote
השאלה מתארת עסק קטן במשפטים ומבקשת טבלאות, מפתחות, ו-`SELECT` אחד. המלכודת היא רשימה שנדחסה לשדה אחד, או join שמכפיל רשומות כי טבלת הקישור הושמטה.
:::

:::problem id=exam-15a-q4 title="סכמת BigApple" source="materials/exams/15-a.pdf" kind=exam solution_origin=derived
BigApple שומר לקוח (שם, טלפון, תאריך הצטרפות, וקישורים ללקוחות אחרים שהם משפחה) וכל פעולה על החשבון (תאריך וסוג: הודעה שנשלחה, שיחה יוצאת, שיחה שלא נענתה, הודעה שהתקבלה, עם מספר הטלפון האחר).

א. הגדירו את הטבלאות.
ב. SQL להודעות שהתקבלו על ידי בני המשפחה של Ringo Starr.

:::hint
משפחה היא יחס בין שני לקוחות, ולכן היא טבלה, לא שדה של שמות.
:::
:::hint
הסוג של פעולה הוא שדה או טבלה קטנה. מספר הטלפון האחר הוא שדה של הפעולה.
:::
:::hint
"המשפחה של Ringo" היא join מ-Ringo דרך טבלת המשפחה, ואז אל פעולות של הודעה שהתקבלה.
:::
:::solution
```sql
CREATE TABLE Customers (
  phone TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  joined DATE NOT NULL
);
CREATE TABLE Family (
  phone TEXT REFERENCES Customers(phone),
  relative TEXT REFERENCES Customers(phone),
  PRIMARY KEY (phone, relative)
);
CREATE TABLE Actions (
  id INTEGER PRIMARY KEY,
  phone TEXT REFERENCES Customers(phone),
  kind TEXT NOT NULL,
  other_phone TEXT,
  at TIMESTAMP NOT NULL
);
SELECT a.*
FROM Customers c
JOIN Family f ON f.phone = c.phone
JOIN Actions a ON a.phone = f.relative AND a.kind = 'received'
WHERE c.name = 'Ringo Starr';
```

שמרו את שני הכיוונים ב-`Family`, או הכניסו את הזוג בשני הסדרים, אם "משפחה" סימטרית. שדה טקסט יחיד `relatives` על `Customers` אינו ניתן ל-join.
:::
:::

:::problem id=exam-15b-q4 title="ניידות מספר" source="materials/exams/15-b.pdf" kind=exam solution_origin=derived
הרחיבו את BigApple עם סוג קשר המשפחה (הורה, אח, ילד), טבלה של מפעילות מתחרות, והיסטוריה של ניידות מספר: התאריך שבו הלקוח עזב, והמפעילה שאליה עזב.

א. הטבלאות הנוספות.
ב. כל מפעילה ש-Ringo Starr עבר אליה, עם התאריך.

:::hint
אל תוסיפו שדה ל-`Actions` בשביל זה. ניידות אינה שיחה.
:::
:::hint
לקוח יכול לעזוב יותר מפעם אחת, ולכן ההיסטוריה היא טבלה, לא שני שדות על `Customers`.
:::
:::hint
סוג המשפחה הוא שדה על טבלת המשפחה הקיימת.
:::
:::solution
מוסיפים `kind TEXT` ל-`Family`. מוסיפים `Carriers(id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL)`. מוסיפים `Portings(phone TEXT REFERENCES Customers(phone), left_on DATE, carrier_id INTEGER REFERENCES Carriers(id), PRIMARY KEY (phone, left_on))`.

```sql
SELECT car.name, p.left_on
FROM Customers c
JOIN Portings p ON p.phone = c.phone
JOIN Carriers car ON car.id = p.carrier_id
WHERE c.name = 'Ringo Starr'
ORDER BY p.left_on;
```
:::
:::

:::problem id=exam-16a-q4 title="מפגשי Abbey Road" source="materials/exams/16-a.pdf" kind=exam solution_origin=derived
Abbey Road שומר מפגשי הקלטה. למפגש יש תאריך, שיר, להקה, והרבה טייקים. בטייק יש אנשים בתפקידים: נגנים (אדם רשאי לנגן כמה כלים בטייק אחד), זמרים, וטכנאים.

א. טבלאות.
ב. מספרי הטייק ושמות השירים שבהם Billy Preston ניגן בקלידים במהלך מפגשי Get Back של ה-Beatles, מינואר 1969, ממוינים לפי תאריך עולה.

:::hint
טייק שייך למפגש. השתתפות שייכת לטייק ולאדם ולתפקיד, והכלי הוא שדה של ההשתתפות הזו.
:::
:::hint
"כמה כלים" פירושו כמה רשומות השתתפות, לא שדה כלים אחד.
:::
:::hint
סננו להקה, תאריך, אדם, וכלי, ואז הקרינו מספר טייק ושם שיר.
:::
:::solution
```sql
CREATE TABLE Sessions (
  id INTEGER PRIMARY KEY,
  on_date DATE NOT NULL,
  song TEXT NOT NULL,
  band TEXT NOT NULL
);
CREATE TABLE Takes (
  session_id INTEGER REFERENCES Sessions(id),
  take_no INTEGER,
  PRIMARY KEY (session_id, take_no)
);
CREATE TABLE People (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE Participations (
  session_id INTEGER,
  take_no INTEGER,
  person_id INTEGER REFERENCES People(id),
  role TEXT NOT NULL,
  instrument TEXT,
  PRIMARY KEY (session_id, take_no, person_id, role, instrument),
  FOREIGN KEY (session_id, take_no) REFERENCES Takes(session_id, take_no)
);
SELECT t.take_no, s.song
FROM Sessions s
JOIN Takes t ON t.session_id = s.id
JOIN Participations p ON p.session_id = s.id AND p.take_no = t.take_no
JOIN People pe ON pe.id = p.person_id
WHERE s.band = 'Beatles' AND s.song = 'Get Back'
  AND s.on_date >= '1969-01-01' AND s.on_date < '1969-02-01'
  AND pe.name = 'Billy Preston' AND p.instrument = 'keyboards'
ORDER BY s.on_date;
```
:::
:::

:::problem id=exam-16b-q4 title="תפקידים קבועים" source="materials/exams/16-b.pdf" kind=exam solution_origin=derived
סכמת Abbey Road: למפגש הקלטה יש תאריך, שיר, להקה, והרבה טייקים. בטייק יש אנשים בתפקידים (נגן, זמר, טכנאי), והתפקיד שמור כטקסט.

א. הראו איך Kim Philby יכול להופיע כמשתתף בתפקיד סוכן כפול.
ב. הגבילו תפקידים לקבוצה קבועה: נגן, זמר, טכנאי.

:::hint
אם `role` הוא טקסט חופשי, הרשומה היא עוד השתתפות. ההגבלה היא טבלת תפקידים חוקיים או check.
:::
:::hint
מפתח זר אל טבלת `Roles` דוחה תפקיד שלא הוכנס.
:::
:::hint
אל תוסיפו שדה בוליאני לכל תפקיד. תפקיד חדש היה שינוי סכמה.
:::
:::solution
א. מכניסים את Kim ל-`People` ורשומת `Participations` עם `role = 'double agent'`. הסכמה מתירה כל טקסט תפקיד, ולכן זה נתון, לא טבלה חדשה.

ב. `CREATE TABLE Roles (name TEXT PRIMARY KEY);` מכניסים `player`, `singer`, `engineer`. משנים את `Participations.role` ל-`REFERENCES Roles(name)`. הכנסת הסוכן הכפול אז נכשלת עד שמוסיפים את התפקיד הזה בכוונה. `CHECK (role IN (...))` הוא החלופה כשהשאלה רוצה את האילוץ בשדה אחד.
:::
:::

:::problem id=exam-17a-q4 title="חנות משקפיים" source="materials/exams/17-a.pdf" kind=exam solution_origin=derived
חנות משקפיים מקוונת. מחסנים דגם (מספר דגם, מחיר). רושמים לקוח (שם, מזהה). רכישה רושמת את מזהה הלקוח ואת הדגם, והחנות מנפיקה קבלה עם מספר ייחודי ופרטי הרכישה. לקוח יכול לשאול את המחיר של דגם. הבעלים יכול לרשום כל קבלה.

תנו את הטבלאות ואת שתי השאילתות: מחיר של דגם, וכל הקבלות.

:::hint
קבלה היא רשומה, לא תדפיס. המפתח הראשי שלה הוא מספר הקבלה.
:::
:::hint
מספר הדגם על רכישה הוא מפתח זר. הקלדתו פעמיים מזמינה אי-התאמה עם המחיר.
:::
:::hint
שאילתת המחיר אינה נוגעת בקבלות.
:::
:::solution
```sql
CREATE TABLE Models (
  model_no INTEGER PRIMARY KEY,
  price INTEGER NOT NULL
);
CREATE TABLE Customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE Receipts (
  receipt_no INTEGER PRIMARY KEY,
  customer_id TEXT REFERENCES Customers(id),
  model_no INTEGER REFERENCES Models(model_no)
);
SELECT price FROM Models WHERE model_no = ?;
SELECT * FROM Receipts;
```

המחיר חי רק על `Models`, ולכן שינוי מחיר מאוחר יותר אינו דורש עריכת קבלות ישנות אם השאלה רצתה את המחיר בזמן המכירה. אם היא רצתה, מעתיקים את `price` אל `Receipts` בהכנסה. "המחיר של דגם" בשאלה קורא את הקטלוג.
:::
:::

:::problem id=exam-17b-q4 title="עבודות מוסך" source="materials/exams/17-b.pdf" kind=exam solution_origin=derived
מוסך. לעבודה יש מספר רכב, תיאור תקלה, ומזהה עבודה. לעובד יש שם ומזהה. שיוך עובד לעבודה רושם את העובד, את העבודה, ושהיא לא הסתיימה. סיום עבודה מסמן אותה כגמורה.

טבלאות, ובנוסף השאילתה לעבודות שלא הסתיימו של עובד.

:::hint
"לא הסתיימה" הוא שדה על השיוך, או `finished_at` שהוא null.
:::
:::hint
עבודה יכולה להתקיים לפני שיש לה עובד, ולכן טבלת העבודה וטבלת השיוך אינן אותה טבלה.
:::
:::hint
השאילתה מסננת את העובד ואת דגל "לא הסתיימה".
:::
:::solution
```sql
CREATE TABLE Jobs (
  job_id INTEGER PRIMARY KEY,
  car_no TEXT NOT NULL,
  fault TEXT NOT NULL
);
CREATE TABLE Workers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
);
CREATE TABLE Assignments (
  job_id INTEGER REFERENCES Jobs(job_id),
  worker_id TEXT REFERENCES Workers(id),
  finished INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (job_id, worker_id)
);
SELECT j.*
FROM Assignments a
JOIN Jobs j ON j.job_id = a.job_id
WHERE a.worker_id = ? AND a.finished = 0;
```

הסיום הוא `UPDATE Assignments SET finished = 1 WHERE job_id = ? AND worker_id = ?`.
:::
:::

:::problem id=exam-18a-q4 title="שאלת מבחן חוזרת" source="materials/exams/18-a.pdf" kind=exam solution_origin=derived
בנק שאלות שומר את הטקסט של כל שאלה, ורשומה של כל שנה שבה היא ניתנה, באחד משני המושבים של אותה שנה. שאלה רשאית לחזור בשנה מאוחרת ואסור להשתמש בה פעמיים באותה שנה. בחרו את הסכמה שאוכפת את זה, ואמרו איזה מפתח עושה את העבודה.

:::hint
רשומה אחת לכל שאלה, ורשומה אחת לכל (שאלה, שנה, מושב), זו הצורה שיכולה לחזור בין שנים.
:::
:::hint
"לא פעמיים בשנה אחת" הוא מפתח ראשי שכולל את השנה.
:::
:::hint
זוג שדות `year_a` ו-`year_b` על השאלה אינו יכול לשמור שנה שלישית.
:::
:::solution
```sql
CREATE TABLE questions (
  id INTEGER PRIMARY KEY,
  text TEXT NOT NULL
);
CREATE TABLE asked (
  question_id INTEGER REFERENCES questions(id),
  year INTEGER NOT NULL,
  moed TEXT NOT NULL,
  PRIMARY KEY (question_id, year)
);
```

המפתח הראשי `(question_id, year)` דוחה הכנסה שנייה של אותה שאלה באותה שנה, בכל אחד משני המושבים. שנה מאוחרת יותר היא רשומה חדשה. שדות `year_a` ו-`year_b` על `questions` זוכרים רק שני שימושים ואינם יכולים לבטא את האילוץ למושב שלישי. אם אפשרות בשאלה משתמשת ב-`question_id_A` וב-`question_id_B` כשני מפתחות זרים בטבלת שנה, זה זוכר זוג שאלות אחד לשנה וזה הגרגר הלא נכון.
:::
:::

:::problem id=exam-18b-q4 title="האזנות משטרה" source="materials/exams/18-b.pdf" kind=exam solution_origin=derived
האזנות משטרה. הקלטה שומרת את הטקסט, את מספר המתקשר, את מספר היעד, ואת התאריך. לכל מספר טלפון יש שם בעלים וכתובת.

השאלה מתחילה:

```sql
CREATE TABLE phone (
  phone_num INT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL
);
```

השלימו את הסכמה וכתבו שאילתה להקלטות של מספר נתון, עם שמות שני הבעלים.

:::hint
לשיחה שני מפתחות זרים אל `phone`, ולכן מצטרפים ל-`phone` פעמיים.
:::
:::hint
תנו כינוי לשני ה-join. אחרת `name` דו-משמעי.
:::
:::hint
המפתח הראשי של ההקלטה יכול להיות מזהה מלאכותי.
:::
:::solution
```sql
CREATE TABLE recordings (
  id INTEGER PRIMARY KEY,
  from_num INT REFERENCES phone(phone_num),
  to_num INT REFERENCES phone(phone_num),
  at TIMESTAMP NOT NULL,
  body TEXT NOT NULL
);
SELECT r.at, r.body, src.name, dst.name
FROM recordings r
JOIN phone src ON src.phone_num = r.from_num
JOIN phone dst ON dst.phone_num = r.to_num
WHERE r.from_num = ? OR r.to_num = ?;
```
:::
:::

:::problem id=exam-19a-q4 title="סכמת Airbnb" source="materials/exams/19-a.pdf" kind=exam solution_origin=derived
Airbnb. למשתמש יש מזהה והוא רשאי להיות אורח, מארח (host), או שניהם. לנכס יש מזהה, מארח אחד, מחיר ללילה, ותיאור. להשכרה יש אורח, נכס (ולכן את המארח של הנכס הזה), צ'ק-אין, וצ'ק-אאוט. אחרי הצ'ק-אאוט המארח כותב המלצה על האורח והאורח כותב אחת על המארח.

שלושה חלקים בשאלה מבקשים להשלים את הסכמה ושאילתה אחת. תנו את הטבלאות.

:::hint
"אורח או מארח או שניהם" אינו שתי תת-מחלקות עם שני מפתחות ראשיים. טבלת `users` אחת, ונכס מצביע על מזהה מארח.
:::
:::hint
המלצה היא רשומה שנכתבת בסוף השכרה, עם מחבר ונושא.
:::
:::hint
מארח אחד, הרבה נכסים: המפתח הזר חי על הנכס.
:::
:::solution
```sql
CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE properties (
  property_id INTEGER PRIMARY KEY,
  host_id INTEGER REFERENCES users(id),
  price INTEGER NOT NULL,
  description TEXT NOT NULL
);
CREATE TABLE rentals (
  id INTEGER PRIMARY KEY,
  guest_id INTEGER REFERENCES users(id),
  property_id INTEGER REFERENCES properties(property_id),
  check_in DATE NOT NULL,
  check_out DATE
);
CREATE TABLE recommendations (
  rental_id INTEGER REFERENCES rentals(id),
  author_id INTEGER REFERENCES users(id),
  about_id INTEGER REFERENCES users(id),
  text TEXT NOT NULL,
  PRIMARY KEY (rental_id, author_id)
);
```

משתמש שגם מארח וגם נוסע הוא פשוט משתמש שמופיע כ-`host_id` על נכס כלשהו וכ-`guest_id` על השכרה כלשהי. אין טבלה שנייה.
:::
:::

:::problem id=exam-19b-q4 title="לילה אחד לנכס" source="materials/exams/19-b.pdf" kind=exam solution_origin=derived
למשתמש יש מזהה והוא רשאי להיות אורח, מארח, או שניהם. לנכס יש מזהה, מארח אחד, מחיר ללילה, ותיאור. להשכרה יש אורח, נכס, צ'ק-אין, וצ'ק-אאוט. בנוסף: שני אורחים אינם יכולים לחלוק נכס באותו לילה. אכפו את זה בסכמה, לא בהערה.

:::hint
המקרה האסור הוא שתי רשומות השכרה עם אותו נכס ותאריכים חופפים. מפתח ראשי אינו מבטא חפיפה.
:::
:::hint
אם השאלה מקבלת קריאה פשוטה יותר, רשומה אחת לכל (נכס, לילה) כן מבטאת את זה.
:::
:::hint
טבלת קישור `stay(property_id, night, rental_id)` עם מפתח ראשי `(property_id, night)` הופכת את ההתנגשות לכישלון הכנסה.
:::
:::solution
שומרים את הטבלאות של Airbnb מהשאלה על המשתמשים, הנכסים וההשכרות. מוסיפים

```sql
CREATE TABLE nights (
  property_id INTEGER REFERENCES properties(property_id),
  night DATE,
  rental_id INTEGER REFERENCES rentals(id),
  PRIMARY KEY (property_id, night)
);
```

הזמנה כותבת רשומת `nights` אחת לכל לילה של השהייה. אורח שני בלילה תפוס פוגע במפתח הראשי וההכנסה נכשלת. אילוץ `CHECK` אינו יכול לראות רשומות אחרות ב-SQL שההרצאה לימדה; הטבלה הנוספת יכולה. השאילתה "מי שוהה בנכס P בלילה D" היא join מ-`nights` אל `rentals` אל `users`.
:::
:::

:::problem id=exam-20a-q4 title="סכמת DVD" source="materials/exams/20-a.pdf" kind=exam solution_origin=derived
שירות DVD. למשתמשים יש מזהה ושם. לסרטים יש מזהה, שם, תיאור, כל מספר קטגוריות מתוך {Action, Drama, Romance, kids}, ממוצע `score`, ו-`num_scorers`. צפייה רושמת את המשתמש, את הסרט, ואת התאריך.

טבלאות, ושאילתה לסרטים שמשתמש צפה בהם, עם הקטגוריות שלהם.

:::hint
"כל מספר קטגוריות" הוא טבלת קישור. שדה קטגוריה יחיד שגוי.
:::
:::hint
`score` ו-`num_scorers` הם שדות של הסרט רק אם מקבלים צבירה שמורה. ההרצאה תעדיף לחשב אותם.
:::
:::hint
טבלת הצפייה היא הרבים-לרבים בין משתמשים לסרטים, ועוד תאריך.
:::
:::solution
```sql
CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE movies (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  score REAL,
  num_scorers INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE categories (
  movie_id INTEGER REFERENCES movies(id),
  category TEXT NOT NULL,
  PRIMARY KEY (movie_id, category)
);
CREATE TABLE watches (
  user_id INTEGER REFERENCES users(id),
  movie_id INTEGER REFERENCES movies(id),
  on_date DATE NOT NULL,
  PRIMARY KEY (user_id, movie_id, on_date)
);
SELECT m.name, c.category
FROM watches w
JOIN movies m ON m.id = w.movie_id
LEFT JOIN categories c ON c.movie_id = m.id
WHERE w.user_id = ?;
```

סרט עם שתי קטגוריות מופיע פעמיים, פעם לכל קטגוריה, וזו טבלת הקישור שעושה את עבודתה. `LEFT JOIN` שומר סרט שאין לו רשומת קטגוריה.
:::
:::

:::problem id=exam-20b-q4 title="ממוצע ציונים" source="materials/exams/20-b.pdf" kind=exam solution_origin=derived
למשתמשים יש מזהה ושם. לסרטים יש מזהה, שם, תיאור, כל מספר קטגוריות מתוך {Action, Drama, Romance, kids}, ממוצע `score`, ו-`num_scorers`. צפייה רושמת את המשתמש, את הסרט, ואת התאריך. כתבו את השאילתה שמעדכנת את הממוצע של סרט כשמשתמש מגיש ציון חדש `s`, באמצעות `score` ו-`num_scorers` השמורים, ואת השאילתה שמפרטת סרטים בקטגוריה ממוינים לפי ציון.

:::hint
הממוצע החדש הוא `(score * num_scorers + s) / (num_scorers + 1)`.
:::
:::hint
שני השדות משתנים ב-`UPDATE` אחד.
:::
:::hint
מסנן הקטגוריה מצטרף ל-`categories`.
:::
:::solution
```sql
UPDATE movies
SET score = (score * num_scorers + :s) / (num_scorers + 1),
    num_scorers = num_scorers + 1
WHERE id = :movie;

SELECT m.name, m.score
FROM movies m
JOIN categories c ON c.movie_id = m.id
WHERE c.category = 'Drama'
ORDER BY m.score DESC;
```

העדכון הוא משפט אחד כדי שקורא לא יראה ספירה חדשה עם הממוצע הישן. שני משפטים היו צריכים את הטרנזקציה שההרצאה אמרה שסיריאליזציה אינה נותנת. ה-join הוא פנימי, ולכן סרט בלי רשומת Drama נעדר, וזה מה שהמסנן אומר.
:::
:::

שכבת האחסון במפגש 13 היא הדרך שבה שרת Java או Python מתוך [Reactor](topic:reactor) קורא להוראות האלה בלי לפזר SQL לאורך הפרוטוקול.
