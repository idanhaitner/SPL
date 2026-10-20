---
id: classes-and-objects
title: מחלקות ועצמים
sources:
  - "materials/lectures/Chapter 3 - Classes and Objects.pptx"
  - "materials/sessions/SPL_PS1 (1).pptx"
  - "materials/sessions/SPL_PS3.pptx"
---

מחלקה (class) ב-C++ מגדירה פריסת זיכרון (layout) של נתונים לצד פונקציות המקבלות מצביע סמוי (`this`) לפריסה זו. פרק זה מתאר את מסלול הבנייה של התוכנית: כיצד קוד מקור הופך לקובץ הרצה, כיצד אובייקטים מוקצים ומאותחלים, וכיצד פונקציות חבר ניגשות לאובייקט.

## בניית תוכנית (Build Pipeline)

פונקציה ב-C++ אינה חייבת להיות מוגדרת בתוך מחלקה; פונקציות המוגדרות מחוץ למחלקה נמצאות בטווח הגלובלי (global scope).

הצהרה (declaration) מציגה את שם הפונקציה וחתימתה (prototype). הגדרה (definition) מספקת גם את גוף הפונקציה. מותר להצהיר על פונקציה מספר פעמים, אך חובה להגדיר אותה פעם אחת בלבד (Rule One Definition - ODR).

הצהרה מוקדמת (forward declaration) מודיעה למהדר על קיומו של טיפוס או פונקציה. הצהרות המיועדות לשיימינג בין מספר קובצי `.cpp` מרוכזות בקובצי כותרת (`.h` / `.hpp`). הפקודה `#include` מעתיקה את תוכן קובץ הכותרת ישירות אל קובץ המקור. כדי למנוע הכללה מעגלית וכפולה, משתמשים בשומרי הכללה (include guards):

```cpp
#ifndef POINT_H
#define POINT_H
// declarations
#endif

```

תהליך הבנייה כולל ארבעה שלבים:

:::definition id=def-build title="ארבעת שלבי הבנייה" source="materials/sessions/SPL_PS1 (1).pptx"

1. **הקדם-מעבד (Preprocessor):** מעבד הנחיות `#` (`#include`, `#define`, `#ifndef`), מסיר הערות, ומפיק קוד מורחב.
2. **המהדר (Compiler):** מתרגם את הקוד המורחב לשפת אסמבלי (Assembly).
3. **האסמבלר (Assembler):** מתרגם את קוד האסמבלי לקובץ אובייקט בשפת מכונה (`.o` / `.obj`).
4. **המקשר (Linker):** מחבר את קובצי האובייקט והספריות, פותר כתובות של סמלים וקריאות חיצוניות, ומפיק קובץ הרצה יחיד (Executable).
:::

![ארבעה שלבי בנייה לפי הסדר: קדם-מעבד, קומפיילר, אסמבלר, ואז המקשר שמייצר קובץ הרצה אחד](../assets/figures/build-pipeline.svg)

שפת Java מקמפלת קוד לבייטקוד ומבצעת קישור דינמי בזמן ריצה. לעומת זאת, ב-C++ הקישור מבוצע מראש (Ahead-of-Time). הדגל `g++ -c` עוצר את התהליך לאחר שלב האסמבלר ומפיק קובץ `.o`. הדגל `g++ -o name` קובע את שם קובץ ההרצה (ברירת המחדל ב-Linux היא `a.out`).

:::problem id=worked-compile-vs-link title="קישור בלי main" source="materials/sessions/SPL_PS1 (1).pptx" kind=worked solution_origin=source
הפקודה הראשונה מצליחה והשנייה נכשלת. איזה שלב נכשל ולמה?

```text
g++ -c student.cpp
g++ -o app student.o

```

:::solution
השלב השני (הקישור) נכשל. הפקודה `g++ -c` מפיקה קובץ אובייקט `student.o` ואינה מחפשת את נקודת הכניסה `main`. הפקודה השנייה מנסה לייצר קובץ הרצה ומפעילה את המקשר. כיוון ש-`main` אינה מוגדרת ב-`student.o`, המקשר מדווח על סמל חסר (undefined reference to `main`).
:::
:::

קובץ `Makefile` מנהל תלויות בנייה. הפקודה `make` מריצה את המטרה הראשונה בקובץ אלא אם צוינה מטרה מפורשת. פקודות ב-Makefile חייבות להתחיל בתו Tab:

```makefile
hello: helloWorld.o run.o
	g++ -o bin/hello bin/helloWorld.o bin/run.o

```

ב-C++, הטיפוסים הבסיסיים כוללים את `int`, `double`, `bool`, `char`. המילה השמורה `const` משמשת ליצירת קבועים (במקום `final` ב-Java). המחלקה `std::string` מייצגת מחרוזת משתנית ומשווה באמצעות `==`. המחלקה `std::vector<T>` מייצגת מערך דינמי.

## אובייקטים וערכים

:::definition id=def-class title="מחלקה ו-struct" source="materials/lectures/Chapter 3 - Classes and Objects.pptx"
מחלקה מגדירה אוסף של שדות ומתודות עם הרשאות גישה. ב-`class`, ברירת המחדל של הרשאת הגישה היא `private`. ב-`struct`, ברירת המחדל היא `public`. הגדרת מחלקה מסתיימת בנקודה-פסיק `;`:

```cpp
struct Point {
    const int x, y;
    Point(int x, int y);
} p1(1, 1), p2(2, 2);

```

:::

אתחול שדות המחלקה בבנאי מבוצע באמצעות רשימת אתחול (initializer list) המופיעה לפני גוף הבנאי. זוהי הדרך היחידה לאתחל שדות `const` ושדות רפרנס (`&`), והיא מונעת אתחול כפול (בניית מופע ברירת מחדל ולאחר מכן השמה):

```cpp
// student.h
class Student {
    std::string _name;
    int _year;
public:
    Student(const std::string& name, int year);
    void print() const;
};

// student.cpp
Student::Student(const std::string& name, int year)
    : _name(name), _year(year) {
    std::cout << "Student " << name << " created";
}

```

העברת אובייקטים גדולים כארגומנטים מבוצעת בדרך כלל ברפרנס לקבוע (`const T&`) כדי למנוע העתקה מיותרת.

אובייקט המוקצה ללא `new` נוצר במסגרת המחסנית והגישה לאיבריו מבוצעת עם אופרטור הנקודה `.`. אובייקט המוקצה עם `new` נוצר בערימה, הגישה אליו מבוצעת דרך מצביע בעזרת אופרטור החץ `->`.

```cpp
Student a("Avi", 2000);
a.print();
Student* pb = new Student("Benni", 2000);
pb->print();
delete pb;

```

### המצביע this, מתודות const ו-static

לכל מתודת איבר שאינה `static` מועבר מצביע סמוי בשם `this`, המחזיק את כתובתו של האובייקט עליו הופעלה המתודה.

אובייקט שהוגדר כ-`const` רשאי לקרוא רק למתודות שהוגדרו כ-`const` (מתודות המתחייבות שלא לשנות את שדות האובייקט). בתוך מתודת `const`, הטיפוס של `this` הוא `const ClassName*`.

למתודה שהוגדרה כ-`static` אין מצביע `this`, ולכן היא אינה יכולה לפיכך הגישה לשדות איבר רגילים. בנאי יכול לקרוא לבנאי אחר של אותה מחלקה באמצעות דלגציה (delegation) ברשימת האתחול.

### החזרת אובייקטים ממתודות

החזרת אובייקט לפי ערך מייצרת עותק של האובייקט. החזרת רפרנס למשתנה מקומי שהוקצה במחסנית היא טעות חמורה, כיוון שהאובייקט מושמד עם סיום הפונקציה:

```cpp
Image& myPicture() {
    Image avi(...);
    return avi;          // Undefined Behavior: avi is destroyed at function exit
}

```

החזרת רפרנס מותרת כאשר היא מתייחסת לאובייקט שזמן חייו נמשך מעבר לקריאה (כגון שדה של המחלקה).

מתודות מיוחדות במחלקה:

- **בנאי ברירת מחדל (Default Constructor):** נוצר אוטומטית על ידי המהדר רק אם לא הוגדר בנאי מפורש.
- **בנאי העתקה (Copy Constructor):** מקבל רפרנס לאובייקט מאותו הטיפוס (`const ClassName&`).
- **אופרטור השמה (Copy Assignment Operator):** מופעל בעת השמת אובייקט קיים לאובייקט קיים אחר.
- **הורס (Destructor):** נקרא בעת השמדת האובייקט לשחרור משאבים.

:::check id=chk-dot-arrow
נתון `Student* pb = new Student("Benni", 2000);`. כיצד יש לקרוא למתודה `print`?

- [ ] `pb.print()`
- [x] `pb->print()`
- [ ] `(*pb)->print()`

`pb` הוא מצביע. אופרטור `->` מבצע חילול מצביע וגישה לאיבר. הביטוי `(*pb).print()` שקול לו.
:::

:::problem id=worked-initializer title="רשימת אתחול" source="materials/lectures/Chapter 3 - Classes and Objects.pptx" kind=worked solution_origin=source
מדוע המחלקה `Point` חייבת להשתמש ברשימת אתחול עבור `x` ו-`y`, ומדוע `Line` משתמשת בפונקציה סטטית לאתחול `len`?

```cpp
struct Point {
    const int x, y;
    Point(int x, int y) : x(x), y(y) {}
};

struct Line {
    Point p1, p2;
    const int len;
    Line(Point a, Point b)
        : p1(a), p2(b), len(calcLen(a, b)) {}
    static int calcLen(const Point& a, const Point& b);
};

```

:::solution
שדות `const` חייבים להיות מאותחלים ברשימת האתחול, כיוון שאי אפשר לבצע אליהם השמה בתוך גוף הבנאי לאחר שנוצרו.

ב-`Line`, השדה `len` הוא `const` ולכן חייב להיאפיין ברשימת האתחול. קריאה לפונקציית איבר רגילה מהרשימה אינה מותרת כיוון שהאובייקט (`this`) טרם סיים את אתחולו. פונקציה `static` אינה תלויה ב-`this` ולפיכך ניתן לקרוא לה בבטחה.
:::
:::

:::trap
שכחת נקודה-פסיק `;` בסוף הגדרת `class` או `struct` היא שגיאת הידור נפוצה, שכן התחביר מאפשר הצהרת מופעים בצמוד להגדרה.
:::

## תרגול

:::problem id=ps1-link-vs-java title="איפה הקישור קורה" source="materials/sessions/SPL_PS1 (1).pptx" kind=exercise solution_origin=source
הסבר מתי מתרחש שלב הקישור ב-Java מול C++, ואיזה קובץ מייצרת הפקודה `g++ -c`.
:::hint
הקומפיילר של Java לא פולט קוד מכונה למערכת הפעלה אחת.
:::
:::hint
קובצי אובייקט של C++ עדיין מכילים סמלים שקובצי `.cpp` אחרים מגדירים. משהו אחרי `-c` צריך לתקן אותם פנימה.
:::
:::hint
שלב האסמבלר בתרגול כותב `*.o` ב-Unix.
:::
:::solution
ב-Java, הקוד מקומפל לבייטקוד והקישור מבוצע דינמית בזמן ריצה על ידי ה-JVM בעת טעינת המחלקות.

ב-C++, הפקודה `g++ -c` מריצה את הקדם-מעבד, המהדר והאסמבלר, ומפיקה קובץ אובייקט (`.o`). קובץ זה מכיל קוד מכונה אך סמלים חיצוניים טרם נפתרו. הקישור מבוצע בשלב נפרד לפני יצירת קובץ ההרצה.
:::
:::

:::problem id=ps1-makefile-first-target title="המטרה הראשונה של make" source="materials/sessions/SPL_PS1 (1).pptx" kind=exercise solution_origin=source
מה יקרה בעת הרצת הפקודה `make` עבור הקובץ הבא?

```makefile
clean:
	rm -rf bin

hello: helloWorld.o run.o
	g++ -o bin/hello bin/helloWorld.o bin/run.o

```
:::hint
`make` בלי ארגומנטים לא מחפש מטרה בשם `all` אלא אם זו המטרה שהוא מוצא ראשונה.
:::
:::hint
התרגול אומר שברירת המחדל היא המטרה הראשונה בקובץ.
:::
:::hint
הפקודה מתחת למטרה מוזחת בטאב. שורת התלות היא `target: dep1 dep2`.
:::
:::solution
הפקודה `make` ללא ארגומנטים מריצה את המטרה הראשונה בקובץ, שהיא `clean`. לפיכך היא תמחק את התוצרים ולא תבנה את `hello`. כדי לבנות את התוכנית יש להריץ `make hello` או להעביר את המטרה `hello` להיות הראשונה בקובץ.
:::
:::

:::problem id=ps3-pass-by-value title="שלוש חתימות של emphasize" source="materials/sessions/SPL_PS3.pptx" kind=exercise solution_origin=source
נתונות החתימות הבאות. אילו מהן מאפשרות לשנות את המחרוזת של הקורא, ואיזו מאפשרת העברת `nullptr`?

```cpp
void emphasize1(std::string word);
void emphasize2(std::string& word);
void emphasize3(std::string* word);

```
:::hint
פרמטר לפי ערך הוא אובייקט אחר מזה של הקורא.
:::
:::hint
רפרנס חייב להיקשר לאובייקט. מצביע יכול להחזיק `nullptr`, והגוף צריך לבדוק אותו.
:::
:::hint
הגוף בשקף הוא `word.append(3, '!')` או `word->append(3, '!')`.
:::
:::solution

- `emphasize1`: מקבלת עותק (by value). שינויים בתוך הפונקציה אינם משפיעים על הקורא.
- `emphasize2`: מקבלת רפרנס (by reference). שינויים משפיעים ישירות על המחרוזת של הקורא. אינה יכולה לקבל `nullptr`.
- `emphasize3`: מקבלת מצביע. שינויים דרך חילול המצביע משפיעים על הקורא. יכולה לקבל `nullptr` (ונדרשת בדיקת תקינות בגוף הפונקציה).
:::
:::

רשימת האתחול ו-`this` הם החצי הרגיל של מחלקה. [חוק השלושה](topic:rule-of-three) הוא מה שמשתנה כשאחד האיברים הוא מצביע לחוצץ שהקציתם. [ירושה](topic:inheritance) היא מה שמשתנה כשקריאה דרך מצביע למחלקת בסיס צריכה להגיע לפונקציה הנגזרת.
