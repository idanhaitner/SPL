---
id: rule-of-five
title: חוק החמישה וחוק האפס
sources:
  - "Classes/Chapter 5 - Rule of Five and Zero.pptx"
  - "Exrecises/SPL_PS4.pptx"
  - "Exams/16-b.pdf"
  - "Exams/16-b-solution.pdf"
  - "Exams/20-b.pdf"
  - "Exams/20-b-solution.pdf"
  - "Exams/24-a.pdf"
  - "Exams/24-a-solution.pdf"
  - "Exams/24-c.pdf"
  - "Exams/24-c-solution.pdf"
---

העתקה היא הדרך הישרה לתת לשני אובייקטים (object) את אותה תמונה. היא הדרך היקרה להחזיר תמונה מפונקציה. C++11 מוסיף ערוץ שני: סמנטיקת העברה (move semantics). אפשר לרוקן זמני. המשאב עובר, הבתים לא.

## ערכים שיש להם כתובת, וערכים שאין להם

:::definition id=def-value-category title="ערך מיקום (lvalue) וערך זמני (rvalue)" source="Classes/Chapter 5 - Rule of Five and Zero.pptx"
ערך מיקום הוא אובייקט שיש לו כתובת שאפשר לקחת, לבצע דרכה השמה, ולקשור אליו רפרנס (reference). היסטורית זה ערך שיכול לעמוד בצד שמאל. ערך זמני הוא זמני. הוא יכול להופיע מימין להשמה, והוא עומד להיעלם: תוצאה של חישוב, או אובייקט שחזר מפונקציה.

רפרנס `const` לערך מיקום נקשר לשניהם. הוא מאריך את חיי הערך הזמני עד לתחום הרפרנס, ומסרב לשינוי.
:::

`std::move(x)` לא מעביר כלום. זו המרה שנותנת למהדר להתייחס לערך המיקום `x` כאל ערך זמני, כדי שהעמסה שגונבת משאבים תהיה חוקית. אחרי העברה אמיתית, `x` עדיין חייב להיות אובייקט תקף. ה-`Image` שעברו ממנו בהרצאה מחזיק `nullptr`, וחייב להיות בטוח להשמדה.

רפרנס לערך זמני נכתב `&&`. הוא נקשר לערך זמני. הוא טיפוס הפרמטר של בנאי-העברה (move constructor) ושל אופרטור העברה (move-assignment operator).

```cpp
void convert(const Image& img);   // binds a named image or a temporary, does not steal
void convert(Image&& img);        // binds only a temporary, may steal
```

### פעולות העברה

:::definition id=def-rule-of-five title="חוק החמישה (rule of five)" source="Classes/Chapter 5 - Rule of Five and Zero.pptx"
חוק השלושה (rule of three), מורחב. אם כותבים אחד מבין הדיסטרקטור (destructor), בנאי העתקה (copy constructor), אופרטור השמה (assignment operator), בנאי-העברה, או אופרטור העברה, כותבים את הקבוצה שבאמת צריך. ההרצאה קוראת לשלוש האלה חובה ברגע שמנהלים משאב, ולשתי פעולות ההעברה החוזה ששומר על התוכנית מהירה.

```cpp
Image::Image(Image&& other)
    : _width(other._width), _height(other._height), _bytes(other._bytes) {
    other._bytes = nullptr;
    other._width = 0;
    other._height = 0;
}
```
:::

![העברה גונבת את המצביע (pointer) אל החוצץ ומשאירה את המקור עם nullptr. הבתים לא מועתקים](../assets/figures/move-transfer.svg)

בנאי-העברה מעתיק את המצביע, לא את הבתים, ואז מאפס את המקור כדי שהדיסטרקטור שלו יבצע `delete[]` על מצביע null, וזו פעולה ריקה. הציורים בשקפים הם: שני האובייקטים, אחר כך המצביע נגנב, אחר כך `other._bytes == nullptr`, ואחר כך הדיסטרקטור של `other` רץ בלי נזק.

אופרטור העברה חייב לשחרר את החוצץ ש-`*this` כבר מחזיק. הצורה הקצרה בהרצאה משתמשת שוב בפונקציית החלפה:

```cpp
Image& Image::operator=(Image&& other) {
    swap(other);
    return *this;
}
```

`other` יוצא מהפונקציה כשהוא מחזיק את החוצץ הישן, והדיסטרקטור שלו משחרר אותו. באג שהשקף מסמן בכוונה: `Image avi = new Image(...)` אינו האופן שבו בונים `Image` אוטומטי, ושימוש ב-`avi` אחרי `std::move(avi)` קורא אובייקט שעברו ממנו.

### חוק האפס (rule of zero)

:::definition id=def-raii title="RAII וחוק האפס" source="Classes/Chapter 5 - Rule of Five and Zero.pptx"
RAII הוא Resource Acquisition Is Initialization. הסיסמה הזוגית בשקף היא RRID, Resource Release Is Destruction. משיגים את המשאב בבנאי ומשחררים אותו בדיסטרקטור.

חוק האפס: אל תנהלו את המשאב בעצמכם. החזיקו איבר שכבר מממש את חמש הפעולות. אז החמש שהמהדר מייצר למחלקה (class) שלכם נכונות, ואתם לא כותבים אף אחת מהן.
:::

`std::vector<char>` כבר משחרר את החוצץ שלו, מעתיק עמוק (deep copy), ומעביר. `Image` ששומר `std::vector<char> _bytes` במקום `char*` מקבל את כל החמש מהמהדר. דעת ההרצאה על השם RAII היא שזה אחד השמות הגרועים בשפה. הרעיון עדיין הרעיון שמשתמשים בו.

כשכן צריך מצביע, הכלים בשקף הם המצביעים החכמים.

:::definition id=def-smart-pointers title="מצביע חכם ייחודי (unique_ptr) ומצביע חכם משותף (shared_ptr)" source="Classes/Chapter 5 - Rule of Five and Zero.pptx"
`std::unique_ptr<T>` הוא בעלות בלעדית. אי אפשר להעתיק אותו. אפשר להעביר אותו. אחרי אופטימיזציות הוא זול כמו מצביע גולמי (raw pointer). `std::shared_ptr<T>` הוא בעלות משותפת. העתקה שלו מגדילה מונה. הדיסטרקטור האחרון שמוריד את המונה משחרר את האובייקט. הוא קצת יותר איטי ממצביע גולמי.

העדיפו את `std::make_unique<T>(...)` ואת `std::make_shared<T>(...)` על פני `unique_ptr<T>(new T(...))`. ההרצאה דוחה את הסיבה לבטיחות חריגות (exception safety): ביטוי ה-`new` כארגומנט לפונקציה יכול לדלוף אם ארגומנט אחר זורק. `make_shared` גם שם את האובייקט ואת המונה בהקצאה אחת.
:::

```cpp
std::unique_ptr<char[]> bytes = std::make_unique<char[]>(100);
std::shared_ptr<Filter> filter = std::make_shared<Filter>(args...);
```

דוגמת ה-`Filter*` בשקפים היא שאלת הבעלות: אם `Image` שומר `Filter*` גולמי, מי קורא ל-`delete`? `shared_ptr<Filter>` עונה על זה. האובייקט מת כשה-`shared_ptr` האחרון מת. ההחלקה בשקף «ניתן להעתקה (non-copyable)» תחת `shared_ptr` הפוכה מהנקודות סביבה: `shared_ptr` ניתן להעתקה, `unique_ptr` לא. סמכו על הנקודות, לא על הסוגריים האלה.

כתיבת בנאי כלשהו מדכאת את בנאי ברירת המחדל שהמהדר מייצר. כתיבת בנאי העתקה מדכאת את פעולות ההעברה שהמהדר מייצר. אפשר לבקש אותן בחזרה עם `= default`, או לסרב להן עם `= delete`:

```cpp
class NoCopy {
public:
    NoCopy(const NoCopy&) = delete;
    NoCopy& operator=(const NoCopy&) = delete;
};
```

### לא מעבירים ערך מוחזר

העלמת העתקה (copy elision) בונה את ערך ההחזרה ישירות במשבצת של הקורא. RVO היא האופטימיזציה הזו לזמני `return Image(...)`. NRVO היא אותו דבר למקומי בעל שם, `return pic`. האזהרה בשקף:

```cpp
Image myPicture() {
    Image pic(1080, 1920, ...);
    return std::move(pic);   // not a good idea
}
```

`std::move` כופה את בנאי-ההעברה וחוסם NRVO. `return pic;` פשוט נותן למהדר לבנות את `pic` אצל הקורא, כך שאין מה להעביר.

:::problem id=worked-move-image source="Classes/Chapter 5 - Rule of Five and Zero.pptx" kind=worked solution_origin=source
`avi` הבעלים של חוצץ פיקסלים. מה `benny._bytes` מחזיק, מה `avi._bytes` מחזיק, ומה `~Image` על `avi` משחרר?

```cpp
Image avi(1080, 1920, pixels);
Image benny(std::move(avi));
```

:::solution
בנאי-העברה מעתיק את המצביע אל `benny` ושם את `avi._bytes` ל-`nullptr`, ומאפס את הממדים שההרצאה מאפסת.

```cpp
Image::Image(Image&& other)
    : _width(other._width), _height(other._height), _bytes(other._bytes) {
    other._bytes = nullptr;
    other._width = 0;
    other._height = 0;
}
```

`benny` הבעלים של הפיקסלים. הדיסטרקטור של `avi` מבצע `delete[]` על מצביע null ולא משחרר כלום. שני האובייקטים מושמדים בסוף הפונקציה; קיים חוצץ אחד בלבד.
:::
:::

:::check id=chk-move-cast
מה `std::move` עושה?

- [ ] הוא מקצה חוצץ חדש ומעתיק את הבתים
- [x] הוא ממיר ערך מיקום כדי שהעמסת העברה תוכל לגנוב ממנו
- [ ] הוא משמיד את האובייקט

המשפט בהרצאה הוא ש-`std::move` לא מעביר כלום. בנאי-ההעברה הוא שגונב, ורק אם בחירת ההעמסה בוחרת בו.
:::

:::trap
אובייקט שעברו ממנו הוא תקף וריק, לא נעלם. `processImage(avi)` אחרי `std::move(avi)` קורא את התמונה הריקה. השקף מסמן את הקריאה הזאת בהערת באג.
:::

:::trap
`shared_ptr` לא הופך מעגל (cycle) לבטוח. אם שני אובייקטים שומרים כל אחד `shared_ptr` אל האחר, המונה לא מגיע לאפס. דוגמת ה-`Filter` בהרצאה היא שיתוף חד-כיווני, וזה המקרה שהמונה נועד לו.
:::

## תרגול

:::problem id=ps4-copy-count source="Exrecises/SPL_PS4.pptx" kind=exercise solution_origin=derived
תרגול 4 שואל כמה פעמים בנאי ההעתקה רץ לפונקציה שמקבלת `MyClass` לפי ערך ומחזירה `MyClass` לפי ערך, ומה משתנה כשהפרמטר הופך ל-`const MyClass&`. הניחו שאין העלמת העתקה, כדי שאפשר לספור את ההעתקות שכללי השפה מכניסים. אחר כך אמרו אילו מאותן העתקות NRVO רשאי להסיר.

:::hint
כל פרמטר לפי ערך הוא העתקה אחת בקריאה. כל החזרה לפי ערך היא העתקה אחת בחזרה, אלא אם העלמת העתקה חלה.
:::
:::hint
פרמטר שהוא רפרנס ל-`const` לא מעתיק.
:::
:::hint
ספרו את הקריאה שמעבירה את הארגומנט, ואת ההחזרה, כשני אירועים נפרדים.
:::
:::solution
עם פרמטר לפי ערך והחזרה לפי ערך, ובלי העלמה: העתקה אחת אל הפרמטר, העתקה אחת החוצה מן ההחזרה, ובסך הכול שתי קריאות לבנאי העתקה. זמניים בדרך יכולים להוסיף עוד אם הגוף בונה זמני ואז מעתיק אותו אל משבצת ההחזרה.

החלפת הפרמטר ל-`const MyClass&` מסירה את ההעתקה בקריאה. העתקת ההחזרה נשארת, אלא אם NRVO בונה את המקומי בעל השם ישירות במשבצת ההחזרה של הקורא, ואז גם ההעתקה הזאת נעלמת. הנקודה בתרגול היא שהחתימה, לא הגוף, מחליטה את ההעתקה הראשונה.
:::
:::

:::problem id=ps4-unique-vs-shared source="Exrecises/SPL_PS4.pptx" kind=exercise solution_origin=source
דוגמאות הסיום בתרגול מבקשות לחזות שתי תוכניות. `sp2` הוא `shared_ptr` שהועתק מ-`sp1`, ואז `sp2` מושמד. `up2` הוא `unique_ptr` שמאותחל מ-`up1` באתחול בהעתקה. מה קורה בכל מקרה?

:::hint
העתקה של `shared_ptr` משנה מונה. השמדת בעלים אחד אינה הבעלים האחרון אם נשאר אחר.
:::
:::hint
ל-`unique_ptr` יש בנאי העתקה עם `= delete`.
:::
:::hint
ההערה בתרגול היא «sp2 הושמד ויש להם אותו מצביע» ו«שגיאת הידור».
:::
:::solution
אחרי ההעתקה, `sp1` ו-`sp2` הבעלים של אובייקט אחד והמונה הוא 2. השמדת `sp2` מורידה את המונה ל-1. האובייקט נשאר. `sp1` עדיין מחזיק את המצביע הזה.

`unique_ptr up2 = up1;` מנסה להעתיק. בנאי ההעתקה הוא `= delete`, ולכן התוכנית לא מתקמפלת. `unique_ptr up2 = std::move(up1);` מעביר: `up2` הבעלים של האובייקט ו-`up1` ריק.
:::
:::


:::examnote
השאלה אומרת «חוק החמישה» או «מצביע חכם» ומבקשת לגנוב חוצץ במקום לשכפל אותו, או לדחות את השכפול עד לכתיבה. המלכודת היא להשאיר את מצביע המקור חי, כך ששני דיסטרקטורים משחררים בלוק אחד, או להעתיק `unique_ptr`.
:::

:::problem id=exam-16b-q2 source="Exams/16-b.pdf" kind=exam solution_origin=derived
`ITEM_COLLECTION<T>` שומר פריטי `T`. `byVal` מקבל את האוסף לפי ערך.

א. כתבו בנאי העתקה עמוק. שימו לב לתחביר ה-template.

ב. השלימו `main` כדי שהאוסף יוכל להחזיק גם `SPHERE` וגם `BOX`, שיורשים מ-`SHAPE`.

ג. הסטודנט עובר לבנאי ההעתקה של ברירת המחדל. מה נשבר ב-`byVal(myShapeCollection)`?

ד. תקנו את הבעלות עם `shared_ptr`, בלי לשנות את תפקיד האוסף. `shared_ptr` הוא המחלקה מההרצאה.

:::hint
העתקה עמוקה מקצה מערך משלה ובונה כל `T` בבנאי העתקה. העתקת ברירת מחדל מעתיקה את המצביע.
:::
:::hint
`SPHERE` ו-`BOX` באוסף אחד אומר שהאוסף שומר מצביעים ל-`SHAPE`, לא `SHAPE` לפי ערך, אחרת האובייקטים נחתכים (slicing).
:::
:::hint
`byVal` לפי ערך ועוד העתקת ברירת מחדל אומר שהדיסטרקטור של הפרמטר משחרר את החוצץ של הקורא.
:::
:::solution
א. `ITEM_COLLECTION(const ITEM_COLLECTION<T>& other)` מקצה מערך חדש באותו גודל ובונה כל איבר בבנאי העתקה. הדיסטרקטור מבצע `delete[]` על המערך הזה.

ב. שמרו `SHAPE*`, או עדיף `shared_ptr<SHAPE>`, כדי ש-`SPHERE` ו-`BOX` ייכנסו למערך אחד בלי חיתוך. `Add` מקבל את מצביע הבסיס.

ג. העתקת ברירת המחדל מעתיקה את המצביע. הפרמטר של `byVal` הוא ההעתקה הרדודה (shallow copy) הזאת. הדיסטרקטור שלו משחרר את המערך. האוסף של הקורא נשאר עם מצביע תלוי (dangling pointer). השימוש הבא, או הדיסטרקטור של הקורא, הוא שחרור כפול (double free).

ד. החליפו את המערך הגולמי של מצביעים בעלי בעלות באיברי `std::shared_ptr<SHAPE>`, או החזיקו את המערך ב-`shared_ptr`. העתקת האוסף מעתיקה את ה-`shared_ptr`ים ומגדילה מונים. הדיסטרקטור של `byVal` מוריד את המונים שלו ולא משחרר אובייקט שהקורא עדיין מחזיק. `make_shared` של ההרצאה הוא הדרך ליצור את הצורות.
:::
:::

:::problem id=exam-20b-q1 source="Exams/20-b.pdf" kind=exam solution_origin=derived
השאלה היא תבנית המצביע החכם מהכיתה. אפי מממש `SmartPointer<T>` עם `T* ptr_`, וחלקים מהמחלקה נמחקו. השלימו אותו כמו ה-`shared_ptr` של ההרצאה: מונה רפרנסים, העתקה שחולקת את האובייקט, השמדה שמשחררת רק כשהמונה אפס, ובלי שחרור כפול. מותר עזרים.

:::hint
המונה חייב לחיות במקום שכל עותק יכול לראות. הוא לא יכול להיות איבר רגיל שמועתק לפי ערך בלי להיות משותף.
:::
:::hint
הדיסטרקטור האחרון, זה שמוריד את המונה מ-1 ל-0, הוא זה שמבצע `delete` על `ptr_`.
:::
:::hint
בנאי העתקה: מעתיקים את שני המצביעים, ואז `++*count_`. דיסטרקטור: `--*count_`, ומבצעים `delete` גם על האובייקט וגם על המונה כשהוא מגיע לאפס.
:::
:::solution
```cpp
template <typename T>
class SmartPointer {
    T* ptr_;
    int* count_;
public:
    explicit SmartPointer(T* p) : ptr_(p), count_(new int(1)) {}
    SmartPointer(const SmartPointer& other) : ptr_(other.ptr_), count_(other.count_) {
        ++*count_;
    }
    ~SmartPointer() {
        if (--*count_ == 0) {
            delete ptr_;
            delete count_;
        }
    }
    SmartPointer& operator=(const SmartPointer& other) {
        if (this == &other) return *this;
        if (--*count_ == 0) { delete ptr_; delete count_; }
        ptr_ = other.ptr_;
        count_ = other.count_;
        ++*count_;
        return *this;
    }
    T& operator*() const { return *ptr_; }
    T* operator->() const { return ptr_; }
};
```

זו בעלות משותפת של ההרצאה, כתובה במפורש. תשובה בצורת `unique_ptr` שמה `= delete` על פעולות ההעתקה ומממשת העברה על ידי גניבת `ptr_` ואיפוס המקור. הניסוח בשאלה, «תבנית המצביע החכם כפי שנלמדה בכיתה», מתאים למונה המשותף בשקפי פרק 5 כשהמצביע ניתן להעתקה. אם הקוד שנמחק מראה בנאי העתקה עם `= delete`, זה המצביע הייחודי במקום: העברה בלבד, בעלים אחד, `delete ptr_` בדיסטרקטור.
:::
:::

:::problem id=exam-24a-q1 source="Exams/24-a.pdf" kind=exam solution_origin=derived
`BinaryTree<T extends Comparable<T>>` ב-Java שומר `data`, `left` ו-`right`, ו-`insert` הולך שמאלה כש-`compareTo` חיובי וימינה אחרת, ומתעלם מכפילויות. `compareTo` מחזיר 1 כש-`this` גדול מ-`other`, ו-1- כשהוא קטן. הניחו ש-`T` תומך באופרטורים שצריך.

א. כתבו את מחלקת ה-C++ הבסיסית: שדות, שני הבנאים, גטרים, ו-`insert`.

ב. השלימו את המחלקה תחת חוק החמישה.

ג. ציירו את הזיכרון בהערה.

```cpp
BinaryTree<int> t(1);
t.insert(2);
t.insert(3);
f(BinaryTree<int>(1, new BinaryTree<int>(2), new BinaryTree<int>(3)));

void f(BinaryTree<int> t) {
    // @@ draw the memory here
}
```

:::hint
הצמתים ש-`insert` יוצר הם אובייקטים על הערימה (heap). המשתנה `t` ב-`main` הוא אובייקט אוטומטי על המחסנית (stack), והילדים שלו הם מצביעים.
:::
:::hint
חוק החמישה כאן אומר: אם הילדים הם מצביעים גולמיים בעלי בעלות, כותבים את הדיסטרקטור, העתקה עמוקה, השמה עמוקה, ואת שתי ההעברות שגונבות את המצביעים ומאפסות את המקור.
:::
:::hint
`f` מקבל את העץ לפי ערך. הארגומנט הוא זמני שנבנה בבנאי שלושת הארגומנטים. בהערה מסתכלים על הפרמטר, לא על ה-`t` של `main`.
:::
:::solution
א. שדות `T data`, `BinaryTree* left`, `BinaryTree* right`. הבנאי עם ארגומנט אחד מאפס את שני הילדים. הבנאי עם שלושה ארגומנטים שומר את שני המצביעים שקיבל ולא מקצה. `insert` משווה עם `data < value` / `data > value` (הענף של Java שבו `compareTo > 0` הולך שמאלה). ילד חסר הוא `new BinaryTree(value)`.

ב. הדיסטרקטור מבצע `delete` על `left` ועל `right`, וזה רקורסיבי. בנאי ההעתקה מקצה צומת חדש לכל ילד שאינו null. ההשמה היא שיטת copy-and-swap. בנאי-העברה גונב את שני המצביעים ושם את המצביעים של המקור ל-null. השמת ההעברה מחליפה. מחלקה שבמקום זה שומרת ילדים `std::unique_ptr<BinaryTree>` לא כותבת אף אחד מאלה: זה חוק האפס, והוא גם מספק את השאלה אם הממשק עדיין מתנהג כעץ.

ג. ה-`t` של `main` על המחסנית: נתון 1, שמאל null, ימין צומת ערימה 2 שהימין שלו הוא צומת ערימה 3. בנפרד, הקריאה בונה זמני: צומת מחסנית (או זמני) 1 שהמצביעים השמאלי והימני שלו מכוונים אל שני צמתי ערימה, 2 ו-3, שהוקצו בשני ביטויי ה-`new`. הפרמטר של `f` הוא העתקה לפי ערך של הזמני הזה. עם העתקה עמוקה, לפרמטר יש שני ילדי ערימה משלו. עם העברה מן הזמני, הפרמטר גנב את המצביעים האלה וילדי הזמני הם null. הציור חייב להראות את העץ של `main` ואת העץ של `f` כאובייקטים שונים. הם לא כינויים.
:::
:::

:::problem id=exam-24c-q1 source="Exams/24-c.pdf" kind=exam solution_origin=derived
העתקה בעת כתיבה (copy-on-write): שיבוט חולק את האובייקט עד שקורה כתיבה. רק השינוי הראשון מקצה עותק פרטי.

א. השלימו את `copy_on_write<T>`. הוא מחזיק `T* ptr`. ל-`T` יש `clone()`. `on_write()` נקרא לפני ההשמה הראשונה דרך העטיפה הזאת, וזה הרגע שבו השיבוט חייב לקרות אם האובייקט עדיין משותף.

ב. תקנו את הקטע כדי שהאופטימיזציה באמת תחול, וציירו זיכרון בנקודות המסומנות.

```cpp
A* a = new A(3);
A* b = a->clone();
```

הדוגמה בשאלה היא ש-`a` ו-`b` צריכים להצביע על `A` אחד עד שאחד מהם נכתב.

:::hint
`clone()` גולמי שתמיד מקצה אף פעם לא חולק. השיתוף חייב להיות בעטיפה, עם מונה קוראים.
:::
:::hint
`on_write` משבט רק כשהמונה גדול מאחד, ואז מוריד את העטיפה הזאת מן המונה הישן.
:::
:::hint
לפני כל כתיבה, `A` אחד על הערימה ושתי עטיפות שמצביעות עליו. אחרי ש-`b` כותב, שני אובייקטי `A`.
:::
:::solution
```cpp
template <typename T>
class copy_on_write {
public:
    T* ptr;
    int* users;
    explicit copy_on_write(T* p) : ptr(p), users(new int(1)) {}
    copy_on_write(const copy_on_write& o) : ptr(o.ptr), users(o.users) { ++*users; }
    void on_write() {
        if (*users > 1) {
            --*users;
            ptr = ptr->clone();
            users = new int(1);
        }
    }
    ~copy_on_write() {
        if (--*users == 0) { delete ptr; delete users; }
    }
};
```

ב. החליפו את `a->clone()` הנלהב בהעתקה של העטיפה. מיד אחרי ההעתקה, הציור הוא `A` אחד על הערימה עם הערך 3, ושתי עטיפות ש-`ptr` של שתיהן מכוון אליו, `users == 2`. ה-`on_write` הראשון דרך `b` קורא ל-`clone`, כך ש-`b.ptr` מכוון אל `A` חדש ו-`a` שומר את המקור. זו התמונה שהשאלה מתכוונת אליה ב«האובייקט עדיין לא הועתק».
:::
:::

חמש הפעולות הן מה שכותבים כשמתעקשים על מצביע גולמי. [ירושה](topic:inheritance) מוסיפה עוד פונקציה מיוחדת לרשימה: אם הדיסטרקטור הוא virtual, זה מפני שמצביע של מחלקת הבסיס (base class) יהיה זה שמבצע `delete` על האובייקט.
