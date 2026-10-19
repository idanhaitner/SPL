---
id: rule-of-three
title: חוק השלושה
sources:
  - "materials/lectures/Chapter 4 - Rule of Thee.pptx"
  - "materials/sessions/SPL_PS3.pptx"
  - "materials/exams/17-a.pdf"
  - "materials/exams/17-a-solution.pdf"
  - "materials/exams/17-b.pdf"
  - "materials/exams/17-b-solution.pdf"
---

אם מחלקה (class) מחזיקה משאב, העתקה איבר-איבר (memberwise copy) היא שקר. ה-`Image` של ההרצאה מחזיק `char* _bytes` שהוקצה בבנאי (constructor). העתקת האובייקט (object) מעתיקה את המצביע (pointer). שני האובייקטים מאמינים אז שהם הבעלים של חוצץ אחד, והדיסטרקטור (destructor) הראשון משחרר אותו מתחת לשני.

## שלוש הפעולות

:::definition id=def-rule-of-three title="חוק השלושה (rule of three)" source="materials/lectures/Chapter 4 - Rule of Thee.pptx"
אם מחלקה צריכה דיסטרקטור שכתב המתכנת, בנאי העתקה (copy constructor) שכתב המתכנת, או אופרטור השמה (assignment operator) שכתב המתכנת, היא כמעט תמיד צריכה את שלושתם.

- הדיסטרקטור משחרר את המשאב.
- בנאי העתקה מקצה משאב חדש ומעתיק את התוכן לתוכו.
- אופרטור השמה עושה את שניהם: הוא משחרר את מה שהאובייקט הזה כבר מחזיק, והוא לוקח העתקה עמוקה (deep copy) של האובייקט האחר.

```cpp
Image a(...);
Image b = a;   // copy constructor, not assignment
b = a;         // assignment, both objects already exist
```
:::

לדיסטרקטור יש רשימת פרמטרים ריקה ואין לו טיפוס החזרה. ההרצאה כותבת אותו `~Image()` והוא קורא ל-`delete[] _bytes`. ב-Java, נפילת הרפרנס (reference) האחרון ל-`Image` גם הופכת את מערך הבתים ללא נגיש. ב-C++, השמדת אובייקט ה-`Image` משמידה את המצביע, לא את הבתים, אלא אם הדיסטרקטור אומר אחרת.

![אובייקט Image על המחסנית (stack): רוחב, גובה, ומצביע אל חוצץ בתים נפרד על הערימה (heap)](../assets/figures/image-object-layout.svg)

### העתקה רדודה (shallow copy), ואז הקריסה

`void processImage(Image img)` מקבל את התמונה לפי ערך (by value), ולכן בנאי ההעתקה רץ בקריאה והדיסטרקטור רץ בחזרה. בנאי ההעתקה שהמהדר מייצר מעתיק את `_width`, את `_height` ואת `_bytes`. שני האובייקטים מצביעים על מערך אחד. הדיסטרקטור של הפרמטר מבצע `delete[]` על המערך הזה. ה-`_bytes` של הקורא הוא עכשיו מצביע לא תקף. ההרצאה מציירת את הפריים האחרון הזה כשהמצביע של הקורא עדיין בתוך האובייקט ובלוק הערימה נעלם.

התיקון מקצה.

```cpp
Image::Image(const Image& other)
    : _width(other._width), _height(other._height),
      _bytes(new char[_width * _height]) {
    std::memcpy(_bytes, other._bytes, _width * _height);
}
```

ההרצאה גם מראה את אותו בנאי כשהוא נכתב בהאצלה (delegating constructor) ל-`Image(int, int, char*)`, כך שההקצאה חיה במקום אחד. אחרי זה ל-`processImage` יש חוצץ משלו. הדיסטרקטור שלו משחרר רק את החוצץ הזה. התמונה של הקורא שלמה.

![העתקה רדודה חולקת חוצץ אחד, ולכן דיסטרקטור אחד משחרר אותו מתחת לאובייקט האחר. העתקה עמוקה נותנת לכל Image חוצץ משלו](../assets/figures/shallow-copy.svg)

### השמה אינה בנייה

```cpp
Image avi(1080, 1920, bytesAvi);
Image benni(1080, 1920, bytesBenni);
avi = benni;
```

שני האובייקטים כבר מחזיקים חוצץ. ההשמה שהמהדר מייצר מעתיקה את `benni._bytes` אל `avi._bytes` ונוטשת את המערך הישן של `avi`: דליפה (leak), וגם חוצץ משותף. פונקציית `assign` שנכתבה ביד, שמבצעת `delete[]` קודם ואז מקצה, חייבת גם לסרב להשמה עצמית (self-assignment). `avi.assign(avi)` ישחרר את החוצץ ואז יעתיק מהזיכרון ששוחרר.

הצורה שההרצאה מעדיפה היא שיטת copy-and-swap.

```cpp
void Image::swap(Image& other) {
    std::swap(_width, other._width);
    std::swap(_height, other._height);
    std::swap(_bytes, other._bytes);
}

Image& Image::operator=(const Image& other) {
    Image temp(other);   // deep copy, through the copy constructor
    swap(temp);
    return *this;        // temp's destructor frees what used to be ours
}
```

עקבו אחרי הציורים בשקפים. לפני הקריאה, ל-`avi` ול-`benni` יש לכל אחד חוצץ. `temp` הוא תמונה שלישית, העתקה עמוקה של `benni`. פונקציית החלפה מחליפה את `avi` עם `temp`, כך ש-`avi` מחזיק עכשיו את החוצץ החדש ו-`temp` מחזיק את הישן. היציאה מהפונקציה מפעילה את הדיסטרקטור של `temp` ומשחררת את החוצץ הישן. השמה עצמית בטוחה: `temp` הוא עותק, והחלפה עם עותק של עצמכם היא פעולה ריקה על הערכים.

ההשמה מחזירה `Image&` כי `=` נקשר ימינה. `avi = benni = carmi` הוא `avi = (benni = carmi)`, ולכן הקריאה הפנימית חייבת להחזיר משהו שהקריאה החיצונית יכולה לקשור כ-`const Image&`. החזרת `*this` היא האובייקט הזה. החזרת `void` לא תשרשר.

![שיטת copy-and-swap: temp מקבל חוצץ חדש B2, ההחלפה מוסרת את B2 ל-avi, והדיסטרקטור של temp משחרר את החוצץ הישן A](../assets/figures/copy-swap.svg)

תרגול 3 מנסח את אותו כלל במשפט אחד, ומוסיף הערת חריגה (exception): אם ההשמה זורקת אחרי שכבר שחררה את החוצץ הישן, האובייקט שבור. שיטת copy-and-swap עושה את עבודת ההקצאה קודם ב-`temp`. אם זו זורקת, `avi` לא השתנה.

| | בנאי העתקה | אופרטור השמה |
| --- | --- | --- |
| האובייקט בצד שמאל | עדיין לא קיים | כבר מחזיק משאב |
| השמה עצמית | לא יכולה לקרות | חייבת להיות לא מזיקה |
| משחרר חוצץ ישן | לא | כן |

:::problem id=worked-copy-and-swap title="השמה בהעתקה והחלפה" source="materials/lectures/Chapter 4 - Rule of Thee.pptx" kind=worked solution_origin=source
`avi` מחזיק את החוצץ A. `benni` מחזיק את החוצץ B. עקבו אחרי `avi = benni` ואמרו איזה חוצץ משוחרר.

```cpp
Image& Image::operator=(const Image& other) {
    Image temp(other);   // deep copy of B into a new buffer B2
    swap(temp);          // avi gets B2, temp gets A
    return *this;        // ~Image on temp runs delete[] on A
}
```

:::solution
`Image temp(other)` מעתיק עמוק את B אל חוצץ חדש B2. `avi` עדיין הבעלים של A. `swap(temp)` גורם ל-`avi._bytes` להצביע על B2 ול-`temp._bytes` להצביע על A. `temp` מושמד בסוף האופרטור, ו-`~Image` מבצע `delete[]` על A. `benni` עדיין הבעלים של B. `avi` הבעלים של B2. אין מצביע משותף.
:::
:::

:::check id=chk-init-vs-assign
איזו שורה קוראת לבנאי ההעתקה?

```cpp
Image a(...);
Image b = a;
b = a;
```

- [ ] שתי השורות
- [x] רק `Image b = a`
- [ ] רק `b = a`

`Image b = a` מאתחל אובייקט חדש. `b = a` משים לאובייקט שכבר קיים. סימני הפיסוק נראים כמו השמה בשתי השורות. הם לא.
:::

:::trap
`if (this == other)` משווה מצביע עם אובייקט. הבדיקה העצמית היא `if (this == &other)`. הצורה של copy-and-swap לא צריכה את הבדיקה כדי להיות נכונה, כי היא אף פעם לא משחררת את `*this` לפני שהעותק קיים.
:::

:::trap
`operator()` על ה-`Image` של ההרצאה הוא רק העמסה (overload) של `avi(x, y)`, ומחזיר `_bytes[y * _width + x]`. הוא אינו אחת משלוש הפונקציות המיוחדות. העמסה של אופרטור קוסמטי לא כופה לכתוב את חוק השלושה. בעלות על מצביע גולמי (raw pointer) כן כופה.
:::

## תרגול

:::problem id=ps3-rule-of-three title="שלוש הפונקציות של List" source="materials/sessions/SPL_PS3.pptx" kind=exercise solution_origin=source
אם מחלקה צריכה דיסטרקטור, בנאי העתקה, או אופרטור השמה שמוגדרים על ידי המשתמש, היא כמעט תמיד צריכה את שלושתם. `List` מחזיק `Node* head` שהוקצה עם `new`, והפונקציות המיוחדות שהמהדר מייצר עדיין במקום. מה נשבר, ואילו שלוש פונקציות כותבים?

```cpp
class List {
    Node* head;
};
```

:::hint
הפעולות שהמהדר מייצר מעתיקות את המצביע ולא מקצות רשימה שנייה.
:::
:::hint
שני אובייקטים, `head` אחד, שני דיסטרקטורים.
:::
:::hint
נקבו בשלוש: דיסטרקטור, בנאי העתקה, אופרטור השמה. אמרו מה כל אחת עושה ל-`head`.
:::
:::solution
`List b = a` מעתיק את `head`. `b` ו-`a` חולקים שרשרת אחת. כשדיסטרקטור אחד מבצע `delete` לאורך השרשרת, המצביע של הרשימה האחרת תלוי (dangling pointer), והדיסטרקטור שלה מבצע `delete` על אותם צמתים שוב.

כותבים את שלושתן. הדיסטרקטור הולך לאורך השרשרת ומבצע `delete` על כל צומת. בנאי ההעתקה מקצה צומת חדש לכל איבר ושם את `head` על השרשרת הזאת. אופרטור ההשמה משחרר את השרשרת ש-`this` כבר מחזיק, ואז מעתיק עמוק, ומחזיר `*this`. שיטת copy-and-swap היא ההשמה שמשתמשת שוב בבנאי ההעתקה ובדיסטרקטור: בונים עותק זמני, מחליפים את שני מצביעי ה-`head`, ונותנים לדיסטרקטור של הזמני לשחרר את השרשרת הישנה.

ההערה בתרגול על איברים שהמהדר מייצר: הם נכונים למחלקה שהאיברים שלה כבר מנהלים את עצמם. `Node*` גולמי אינו איבר כזה.
:::
:::


:::examnote
השאלה נותנת מחלקה קטנה עם מצביע גולמי או מערך גולמי ומבקשת את הדיסטרקטור ובנאי העתקה עמוק, לפעמים את שני הבנאים של לוח דו-ממדי. המלכודת היא העתקת ברירת המחדל איבר-איבר, או השמה שמשחררת את החוצץ לפני שיש לה חוצץ חדש.
:::

:::problem id=exam-17a-q2 title="בעלות על תיאור" source="materials/exams/17-a.pdf" kind=exam solution_origin=derived
סטודנטים ב-«C-Kalkel» שומרים תוצאות מבחנים ב-C++. `TestRes` מחזיק `char* description_`. `Test` מנהל אוסף של התוצאות האלה. השאלה מבקשת להפוך את המחלקות לנכונות תחת העתקה והשמדה: חוצץ התיאור בבעלות התוצאה, ומבחן שהועתק לא יכול לחלוק את החוצץ הזה. ממשו את הפונקציות המיוחדות שהבעלות דורשת. אל תדליפו את התיאור הקודם בהשמה.

:::hint
איבר `char*` הוא המצב של `Image::_bytes` בשם אחר.
:::
:::hint
ההעתקה בונה חוצץ חדש עם `new char[...]` ועם `memcpy` או `strcpy`. הדיסטרקטור הוא `delete[]`.
:::
:::hint
להשמה, או copy-and-swap או הסדר «מקצים את החוצץ החדש, ואז `delete` על הישן», כדי שזריקה או השמה עצמית לא יוכלו לשחרר את העותק היחיד.
:::
:::solution
```cpp
class TestRes {
    char* description_;
public:
    explicit TestRes(const char* s)
        : description_(new char[std::strlen(s) + 1]) {
        std::strcpy(description_, s);
    }
    ~TestRes() { delete[] description_; }
    TestRes(const TestRes& other) : TestRes(other.description_) {}
    TestRes& operator=(const TestRes& other) {
        if (this == &other) return *this;
        TestRes temp(other);
        std::swap(description_, temp.description_);
        return *this;
    }
};
```

`Test` שמחזיק מערך של `TestRes*` משתמש באותן שלוש פעולות על המערך: `delete[]` בדיסטרקטור, מערך חדש ועוד העתקת איברים בבנאי ההעתקה, ו-copy-and-swap להשמה. אם `Test` במקום זה שומר `TestRes` לפי ערך במכל שכבר יש לו את הפונקציות המיוחדות הנכונות, `Test` עצמו יכול להישאר עם אלה שהמהדר מייצר. הבאג שהשאלה מכוונת אליו הוא ה-`char*` הגולמי.
:::
:::

:::problem id=exam-17b-q2 title="העתקה עמוקה של לוח" source="materials/exams/17-b.pdf" kind=exam solution_origin=derived
`Terrain<T>` שומר לוח כבלוק `T*` של `height_ * width_` תאים. ממשו את שני הבנאים ואת הדיסטרקטור. בנאי ההעתקה חייב להיות העתקה עמוקה.

```cpp
template <typename T>
class Terrain {
public:
    Terrain(int w, int h);
    Terrain(const Terrain& other);
    ~Terrain();
};
```

:::hint
`new T[w * h]` אחד הוא הבעלים של הלוח. הרוחב והגובה הם מספרים שלמים פשוטים ומעתיקים את עצמם.
:::
:::hint
ההעתקה מקצה מערך משלה. השמה של כל תא מעתיקה `T`. אם `T` הוא רק מצביע, זה עמוק כמו ההעתקה של `T` עצמו.
:::
:::hint
התחילו את בנאי ההעתקה ב-`_w(other._w), _h(other._h), _cells(new T[_w * _h])`.
:::
:::solution
```cpp
template <typename T>
Terrain<T>::Terrain(int w, int h)
    : _w(w), _h(h), _cells(new T[w * h]) {}

template <typename T>
Terrain<T>::Terrain(const Terrain& other)
    : _w(other._w), _h(other._h), _cells(new T[_w * _h]) {
    for (int i = 0; i < _w * _h; ++i)
        _cells[i] = other._cells[i];
}

template <typename T>
Terrain<T>::~Terrain() { delete[] _cells; }
```

העתקת ברירת המחדל הייתה מעתיקה את `_cells` וחולקת לוח אחד. הדיסטרקטור של העותק היה אז משחרר את הלוח של המקור. חוק השלושה אומר שהדיסטרקטור שזה עתה נכתב כופה את בנאי ההעתקה, והוא גם כופה אופרטור השמה אם המחלקה מרשה `a = b`. השאלה מבקשת את הבנאים ואת הדיסטרקטור; מחלקה שלמה כותבת גם השמה, ב-copy-and-swap, או שמה עליו `= delete`.
:::
:::

שיטת copy-and-swap היא הגשר אל [חוק החמישה](topic:rule-of-five): אותה פונקציית החלפה גונבת חוצץ מאובייקט זמני במקום לשכפל אותו. עד אז, כל העתקה בנושא הזה באמת מקצה.
