---
id: pointers
title: מצביעים ורפרנסים
sources:
  - "materials/lectures/Chapter 2 - Pointers.pptx"
  - "materials/notes/lecture-notes.docx.pdf"
  - "materials/sessions/SPL_PS2 (1).pptx"
  - "materials/exams/20-a.pdf"
  - "materials/exams/20-a-solution.pdf"
---

מצביע (pointer) הוא משתנה המאחסן כתובת זיכרון של משתנה אחר.

## תחביר בסיסי

:::definition id=def-pointer title="מצביע ואופרטורים" source="materials/lectures/Chapter 2 - Pointers.pptx"

- `&` (Address-of): מחזיר את כתובת הזיכרון של המשתנה.
- `*` (Dereference): ניגש לתוכן השמור בכתובת המצביע.

```cpp
int x = 10;
int* p = &x;   // p holds the address of x
*p = 20;       // x is now 20

```

:::

הערך `nullptr` מייצג מצביע ריק שאינו מצביע לכתובת חוקית. גישה למצביע null תגרום לשגיאת קטע (Segmentation Fault).

![short בשני בתים, ותא מצביע ששומר את הכתובת של ה-short](../assets/figures/pointer-bytes.svg)

### השימוש ב-const עם מצביעים

```cpp
int x = 10, y = 20;

const int* p1 = &x;        // Pointer to const int: cannot change *p1, can change p1
int* const p2 = &x;        // Const pointer to int: can change *p2, cannot change p2
const int* const p3 = &x;  // Const pointer to const int: cannot change *p3 or p3

```

### אריתמטיקת מצביעים

קידום מצביע (`p++`) מגדיל את הכתובת ב-`sizeof(T)` בתים (גודל הטיפוס המוצבע):

```cpp
int arr[5] = {10, 20, 30, 40, 50};
int* p = arr;   // Points to arr[0]
p++;            // Points to arr[1] (4 bytes ahead if sizeof(int) == 4)

```

![px מכוון לכתובת 16. px + 1 מכוון ארבעה בתים אחר כך, לכתובת 20](../assets/figures/pointer-step.svg)

## רפרנס (Reference)

רפרנס (`T&`) מהווה כינוי (alias) למשתנה קיים. חובה לאתחל רפרנס בעת יצירתו, ולא ניתן לכוון אותו למשתנה אחר בהמשך.

```cpp
int x = 10;
int& ref = x; // ref is an alias for x
ref = 20;     // x is now 20

```

:::problem id=worked-pointer-step title="צעד של מצביע" source="materials/lectures/Chapter 2 - Pointers.pptx" kind=worked solution_origin=source
`sizeof(int)` הוא 4 ו-`x` בכתובת 16. איזו כתובת `px + 1` מציין?

```cpp
int x;
int* px = &x;
int* next = px + 1;
```

:::solution
`px + 1` מציין את כתובת 20. הצעד הוא הגודל של `int`, ארבעה בתים, לא בית אחד. `*(px + 1)` טוען את ה-int שמתחיל ב-20. ה-int הזה אינו `x`.
:::
:::

:::check id=chk-pass-mode
פרוצדורה קוראת אובייקט גדול ואינה משנה אותו. מה מעבירים ב-C++?

- [ ] רפרנס רגיל, כדי שתוכל לכתוב אם תרצה אחר כך
- [x] `const` רפרנס, או ערך אם האובייקט זול להעתקה
- [ ] מצביע null, כי אין צורך באובייקט

הסיכומים רוצים חיסכון בלי לחשוף כתיבה. רפרנס רגיל אומר שהפרוצדורה רשאית לשנות את המקור.
:::

:::problem id=worked-pointer-trace title="מצביע למצביע" source="materials/lectures/Chapter 2 - Pointers.pptx" kind=worked solution_origin=source
מה מדפיסים `i`, `*pi`, `*ppi` ו-`**ppi`, ולמה שווה `&i`?

```cpp
int i = 2;
int* pi = &i;
int** ppi = &pi;
```

:::solution
`i` הוא 2. `*pi` טוען את ה-int בכתובת השמורה ב-`pi`, שזה `i`, ולכן 2. `*ppi` טוען את המצביע השמור ב-`ppi`, שזה `pi`, ולכן הוא מדפיס את הכתובת של `i`. `**ppi` טוען את הכתובת הזו כ-int, ולכן 2. `&i` היא אותה כתובת כמו `pi` וכמו `*ppi`.

```text
i    = 2
pi   = &i
ppi  = &pi

*pi  = 2
*ppi = &i
**ppi = 2
```
:::
:::

:::check id=chk-star-const
איזו שורה לא מתקמפלת?

```cpp
short s1 = 1, s2 = 2;
const short* ps1 = &s1;
```

- [ ] `std::cout << *ps1;`
- [x] `*ps1 = 3;`
- [ ] `ps1 = &s2;`

`const` נמצא משמאל ל-`*`, ולכן ה-short קפוא ומשתנה המצביע לא.
:::

## תרגול

:::problem id=ps2-pointer-dangers title="ארבע תקלות מצביע" source="materials/sessions/SPL_PS2 (1).pptx" kind=exercise solution_origin=source
לכל קטע, נקבו בתקלה. אל תמחקו שורה שעדיין מתקמפלת.

```cpp
int* p = nullptr;
*p = 3;

int* q;
*q = 3;

int* r = new int;
delete r;
*r = 5;

int* a = new int;
int* b = a;
delete b;
*a = 3;
```

:::hint
שאלו, לכל מצביע, אם ברגע הכוכבית הוא מחזיק כתובת של אובייקט חי.
:::
:::hint
`delete` לא משנה את הביטים השמורים במשתני מצביע אחרים שהעתיקו את הכתובת.
:::
:::hint
הקטע הראשון שומר את כתובת הזקיף 0.
:::
:::solution
הראשון הוא הפעלת כוכבית על null: כתובת 0 היא הזקיף, והטעינה או הכתיבה היא segmentation fault.

השני הוא מצביע שלא אותחל. התרגול מציין ש-`int* p;` חשוף ואחריו `*p = 3` אינו תוכנית מוגדרת היטב. הביטים ב-`p` אינם אובייקט שהקציתם.

השלישי הוא שימוש אחרי `delete`. התא `r` עדיין מכיל את הכתובת הישנה, והכתובת הזו כבר אינה אובייקט. שקף מאוחר יותר בתרגול מעיר שההשמה עדיין מתקמפלת.

הרביעי הוא כינוי תלוי. `b` ו-`a` החזיקו כתובת אחת. `delete b` משחרר את ה-int. `*a` משתמש באותה כתובת. הדפוס הבטוח בשקף הוא `delete p; p = nullptr;`, ואותו דבר לכל עותק, ואת זה אי אפשר לעשות אלא אם עדיין יודעים על העותקים האלה.
:::
:::

:::problem id=ps2-delete-2d title="שחרור מערך דו-ממדי" source="materials/sessions/SPL_PS2 (1).pptx" kind=exercise solution_origin=source
שחררו כל בלוק שההקצאה הזו השיגה. אל תשחררו שורה פעמיים.

```cpp
int** arry = new int*[rowCount];
for (int i = 0; i < rowCount; ++i)
    arry[i] = new int[colCount];
```

:::hint
יש `rowCount + 1` בלוקי ערימה: מערך אחד של מצביעים, ומערך אחד של int לכל שורה.
:::
:::hint
שחררו את השורות לפני שמשחררים את המערך שמחזיק את הכתובות שלהן. אחרי ה-`delete[]` החיצוני כבר אין את מצביעי השורות.
:::
:::hint
הלולאה שהקצתה היא הלולאה שחייבת למחוק, בסדר הפוך של התלות.
:::
:::solution
```cpp
for (int i = 0; i < rowCount; ++i)
    delete[] arry[i];
delete[] arry;
arry = nullptr;
```

כל `arry[i]` הגיע מ-`new int[colCount]`, ולכן הוא משוחרר ב-`delete[]`. מערך המצביעים הגיע מ-`new int*[rowCount]`, ולכן גם הוא `delete[]`. היפוך הסדר הזה מאבד את העותקים היחידים של כתובות השורות, ויש זליגת זיכרון של כל שורה. הצבת `arry` ל-null אחר כך מתאימה להרגל המחיקה הבטוחה של התרגול.
:::
:::

:::examnote
השאלה בונה מאגר תמונות מאחורי מערך מצביעים, ואז מחזירה את המאגר לפי ערך מפונקציה שבנתה מקומי בברירת מחדל. המלכודת היא להתייחס לאובייקט המוחזר כאל עותק של הפיקסלים, ולהתייחס ל-`sizeof` של מצביע כאורך.
:::

:::problem id=exam-20a-q1 title="מאגר תמונות" source="materials/exams/20-a.pdf" kind=exam solution_origin=derived
כתבו תוכנית C++ ששומרת שני סוגים של תמונה, `Portrait` ו-`Scenery`. כל פיקסל הוא רמת אפור ב-`0..255`. הפיקסלים של תמונה אחת נשמרים במערך `BYTES` חד-ממדי, שורה אחרי שורה. `ImageRepository` מחזיק תמונות רבות במערך בשם `_images`.

א. ממשו את הבנאי (constructor) ואת `Insert`. הבנאי מקצה מערך של `capacity` מצביעים. `Insert` מקבל מערך של תמונות, מעתיק עמוקות (deep copy) את מערך המצביעים הזה, ולא מעתיק עמוקות את מערכי הבתים של התמונות. הוסיפו שדות או מתודות רק אם אתם צריכים אותם.

ב. סטודנט כותב:

```cpp
ImageRepository CreateEmptyRep() {
    ImageRepository rep;
    return rep;
}
```

הסבירו מה זה מחזיר, ומה לא בסדר בשימוש בזה כמאגר ריק.

שאר השאלה ממשיך את אותה מחלקה (class). ענו על (א) ועל (ב) כשאלת המצביעים.

:::hint
`_images` הוא מערך של מצביעים. העתקת המערך מעתיקה כתובות. העתקת `Image` הייתה מעתיקה פיקסלים. השאלה מבקשת את הראשון ואוסרת את השני.
:::
:::hint
`rep` הוא אובייקט אוטומטי. החזרה שלו לפי ערך בונה עותק מהמקומי. אם לא כתבתם בנאי העתקה (copy constructor), העותק חולק את `_images` עם אובייקט שעומד למות.
:::
:::hint
הבנאי חייב לעשות `_images = new Image*[capacity];` ולזכור את `capacity`. `Insert` מקצה מערך מצביעים חדש באותו אורך ומעתיק את המצביעים, לא את בלוקי ה-`BYTES`.
:::
:::solution
א. קריאה אחת עקבית של כללי השקף ושל השאלה:

```cpp
class Image { /* pixels in a BYTES block, virtual destructor */ };
class ImageRepository {
    Image** _images;
    int _capacity;
    int _size;
public:
    ImageRepository(int capacity)
        : _images(new Image*[capacity]), _capacity(capacity), _size(0) {}
    void Insert(Image** src, int n) {
        Image** copy = new Image*[n];
        for (int i = 0; i < n; ++i) copy[i] = src[i];  // pointers only
        delete[] _images;
        _images = copy;
        _capacity = n;
        _size = n;
    }
};
```

מערכי הבתים נשארים איפה שהתמונות כבר הקצו אותם. שני מאגרים יכולים להחזיק אותו `Image*`. זו ההעתקה הרדודה (shallow copy) שהשאלה ביקשה. מי שעושה `delete` ל-`Image` חייב להיות הבעלים היחיד. העיצוב הזה לא נותן לכם את זה.

ב. `rep` נבנה במסגרת של `CreateEmptyRep`. `return rep` משתמש בבנאי ההעתקה. בנאי ההעתקה שברירת המחדל מעתיק את המצביע `_images`. אחר כך רץ ההורס של `rep`. אם ההורס הזה הוא `delete[] _images`, האובייקט המוחזר מחזיק מצביע תלוי. אם ההורס לא משחרר, בכל מסלול אחר יש זליגת זיכרון והקורא חולק חוצץ עם מקומי מת. כך או כך, החזרה לפי ערך של אובייקט שמחזיק מצביעים היא הבעיה של חוק השלושה, לא דרך ליצור מאגר ריק. החזירו אובייקט שנבנה באחסון של הקורא, או move, הכלי של הפרק הבא. מאגר ריק נכון הוא `ImageRepository(capacity)` עם `_size == 0` ומערך מצביעים חי.
:::
:::

מצביעים הם הדרך שבה [מחלקות ועצמים](topic:classes-and-objects) מציינים `Student` על הערימה, והדרך שבה [חוק השלושה](topic:rule-of-three) מחליט אם עותק חולק חוצץ או מקצה חדש.
