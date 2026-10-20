---
id: rule-of-five
title: חוק החמישה וחוק האפס
sources:
  - "materials/lectures/Chapter 5 - Rule of Five and Zero.pptx"
  - "materials/sessions/SPL_PS4.pptx"
  - "materials/exams/16-b.pdf"
  - "materials/exams/16-b-solution.pdf"
  - "materials/exams/20-b.pdf"
  - "materials/exams/20-b-solution.pdf"
  - "materials/exams/24-a.pdf"
  - "materials/exams/24-a-solution.pdf"
  - "materials/exams/24-c.pdf"
  - "materials/exams/24-c-solution.pdf"
---

העתקה היא הדרך הישירה להעניק לשני אובייקטים (objects) גישה לנתונים זהים, אך היא גם הדרך היקרה והבזבזנית להחזיר אובייקט כבד מפונקציה. תקן C++11 הוסיף מנגנון נוסף: סמנטיקת העברה (move semantics). סמנטיקה זו מאפשרת לרוקן אובייקט זמני — המשאב מועבר לבעלות האובייקט החדש, מבלי להעתיק את הבתים בזיכרון.

## ערכים שיש להם כתובת, וערכים שאין להם

:::definition id=def-value-category title="ערך מיקום (lvalue) וערך זמני (rvalue)" source="materials/lectures/Chapter 5 - Rule of Five and Zero.pptx"
ערך מיקום (lvalue) הוא אובייקט בעל כתובת זיכרון מוגדרת שניתן לזקק, לבצע אליה השמה ולקשור אליה רפרנס (reference). היסטורית, זהו ערך היכול להופיע בצד שמאל של אופרטור השמה.

ערך זמני (rvalue) הוא ערך חולף ללא כתובת זיכרון נגישה בעלת שם. הוא מופיע בצד ימין של השמה ועומד להיעלם מהזיכרון (למשל: תוצאת חישוב ביניים או אובייקט המוחזר לפי ערך מפונקציה).

רפרנס מסוג `const` לערך מיקום (`const T&`) יכול להיקשר הן ל-lvalue והן ל-rvalue. כאשר הוא נקשר ל-rvalue, הוא מאריך את זמן החיים של הערך הזמני עד לסיום תחום ההגדרה (scope) של הרפרנס, ומונע שינויים בתוכנו.
:::

הפונקציה `std::move(x)` אינה מעבירה זיכרון בפועל. היא מבצעת המרה (cast) המנחה את המהדר להתייחס ל-lvalue `x` כאל rvalue (`x&&`), ובכך מאפשרת בחירה בהעמסה (overload) שגונבת משאבים. לאחר העברה, האובייקט `x` נותר במצב תקף אך מרוקן (valid but unspecified state). אובייקט `Image` שהועבר, למשל, יחזיק מצביע `nullptr` ויהיה בטוח להשמדה.

רפרנס לערך זמני מסומן ב-`&&` (למשל `Image&&`). הוא נקשר אך ורק ל-rvalue, ומשמש כחתימה עבור בנאי העברה (move constructor) ואופרטור השמת העברה (move-assignment operator).

```cpp
void convert(const Image& img);   // binds a named image or a temporary, does not steal
void convert(Image&& img);        // binds only a temporary, may steal

```

### פעולות העברה

:::definition id=def-rule-of-five title="חוק החמישה (rule of five)" source="materials/lectures/Chapter 5 - Rule of Five and Zero.pptx"
חוק החמישה הוא הרחבה של חוק השלושה (rule of three). אם מחלקה מגדירה מפורשות אחד מבין חמשת האיברים הבאים: דיסטרקטור (destructor), בנאי העתקה (copy constructor), אופרטור השמת העתקה (copy assignment operator), בנאי העברה (move constructor), או אופרטור השמת העברה (move assignment operator) — עליה להגדיר מפורשות את כל החמישה.

שלושת הראשונים נדרשים לנהל משאבים בצורה תקינה ולהסיר סכנות כמו שחרור כפול או דליפות זיכרון; השניים הנוספים מספקים את חוזה ההעברה השומר על ביצועים מהירים.
:::

בנאי העברה מעתיק את המצביע בלבד (ולא את הנתונים עצמם), ואז מאפס את המקור (`nullptr`) כדי שהדיסטרקטור שלו יבצע `delete[]` על מצביע null — פעולה בטוחה וחסרת השפעה.

```cpp
Image::Image(Image&& other)
    : _width(other._width), _height(other._height), _bytes(other._bytes) {
    other._bytes = nullptr;
    other._width = 0;
    other._height = 0;
}

```

אופרטור השמת העברה חייב לשחרר את החוצץ הקיים ב-`*this` לפני קבלת הבעלות החדשה. דרך אלגנטית לממש זאת היא בעזרת פונקציית החלפה (swap):

```cpp
Image& Image::operator=(Image&& other) {
    swap(other);
    return *this;
}

```

בעת היציאה מהאופרטור, האובייקט `other` מחזיק במשאב הישן של `*this`, והדיסטרקטור שלו משחרר אותו באופן אוטומטי.

מלכודת נפוצה: הקצאה בסגנון `Image avi = new Image(...)` אינה דרך תקינה ליצירת אובייקט אוטומטי במחסנית, ושימוש ב-`avi` לאחר הפעלת `std::move(avi)` קורא מתוך אובייקט שהועבר ומרוקן.

### חוק האפס (rule of zero)

:::definition id=def-raii title="RAII וחוק האפס" source="materials/lectures/Chapter 5 - Rule of Five and Zero.pptx"
RAII פירושו Resource Acquisition Is Initialization (מנגנון שבו הקצאת המשאב נקשרת לאתחול האובייקט, ושחרורו נקשר להשמדתו - RRID, Resource Release Is Destruction).

**חוק האפס (Rule of Zero):** תכננו מחלקות כך שלא ינהלו מפורשות משאבי זיכרון גולמיים. במקום זאת, השתמשו באיברים שכבר מנהלים את המשאב בעצמם (כגון `std::vector` או מצביעים חכמים). במצב זה, חמש הפעולות שמייצר המהדר אוטומטית יהיו נכונות לחלוטין, ולא תידרשו לכתוב אף אחת מהן.
:::

המחלקה `std::vector<char>` כבר מנהלת בעצמה את החוצץ, מבצעת העתקה עמוקה, ומממשת העברה. מחלקה `Image` השומרת `std::vector<char> _bytes` במקום `char*` מקבלת את חוק החמישה בחינם מהמהדר.

כאשר כן נדרש ניהול זיכרון דינמי, השתמשו במצביעים חכמים:

:::definition id=def-smart-pointers title="מצביע חכם ייחודי (unique_ptr) ומצביע חכם משותף (shared_ptr)" source="materials/lectures/Chapter 5 - Rule of Five and Zero.pptx"

* `std::unique_ptr<T>`: מייצג בעלות בלעדית. אינו ניתן להעתקה, אך ניתן להעברה. לאחר אופטימיזציה של המהדר, הביצועים שלו זהים למצביע גולמי (raw pointer).
* `std::shared_ptr<T>`: מייצג בעלות משותפת. העתקתו מגדילה מונה ייחוסים (reference count). הדיסטרקטור האחרון שמוריד את המונה לאפס משחרר את האובייקט.

מומלץ להשתמש ב-`std::make_unique<T>(...)` ו-`std::make_shared<T>(...)` במקום הקצאה ישירה כגון `unique_ptr<T>(new T(...))`. השימוש בפונקציות אלו מבטיח בטיחות מול חריגות (exception safety) ומונע דליפות זיכרון, ובמקרה של `make_shared` אף מאחד את הקצאת האובייקט והמונה לבלוק זיכרון יחיד.
:::

```cpp
std::unique_ptr<char[]> bytes = std::make_unique<char[]>(100);
std::shared_ptr<Filter> filter = std::make_shared<Filter>(args...);

```

כאשר כותבים בנאי מפורש מכל סוג שהוא, המהדר מנטרל את היצירה האוטומטית של בנאי ברירת המחדל. הגדרת בנאי העתקה מנטרלת את יצירת פונקציות ההעברה האוטומטיות. ניתן להחזירן מפורשות בעזרת `= default`, או לבטלן לחלוטין בעזרת `= delete`:

```cpp
class NoCopy {
public:
    NoCopy(const NoCopy&) = delete;
    NoCopy& operator=(const NoCopy&) = delete;
};

```

### העלמת העתקה (Copy Elision)

העלמת העתקה (copy elision) היא אופטימיזציה של המהדר המבוצעת בזמן החזרת אובייקטים לפי ערך. האובייקט המוחזר נבנה ישירות בתוך משבצת הזיכרון של הקורא, ללא יצירת עותקים זמניים.

* **RVO (Return Value Optimization):** מיושם בעת החזרת ערך זמני אנונימי: `return Image(...);`.
* **NRVO (Named Return Value Optimization):** מיושם בעת החזרת אובייקט מקומי בעל שם: `return pic;`.

אזהרה מפורשת:

```cpp
Image myPicture() {
    Image pic(1080, 1920, ...);
    return std::move(pic);   // Anti-pattern!
}

```

שימוש ב-`std::move` על אובייקט מקומי בעת החזרה פוגע באופטימיזציית NRVO ומאלץ הפעלת בנאי העברה, במקום לבנות את האובייקט ישירות אצל הקורא ללא כל העברה או העתקה.

:::problem id=worked-move-image title="העברת תמונה" source="materials/lectures/Chapter 5 - Rule of Five and Zero.pptx" kind=worked solution_origin=source
האובייקט `avi` מחזיק בבעלות על חוצץ פיקסלים. מה יחזיקו `benny._bytes` ו-`avi._bytes`, ומה ישחרר הדיסטרקטור `~Image` של `avi`?

```cpp
Image avi(1080, 1920, pixels);
Image benny(std::move(avi));

```

:::solution
בנאי ההעברה מעתיק את המצביע ל-`benny` ומאפס את `avi._bytes` ל-`nullptr`:

```cpp
Image::Image(Image&& other)
    : _width(other._width), _height(other._height), _bytes(other._bytes) {
    other._bytes = nullptr;
    other._width = 0;
    other._height = 0;
}

```

`benny` מנהל כעת את הבעלות על הפיקסלים. הדיסטרקטור של `avi` מבצע `delete[]` על מצביע null ולכן אינו משחרר דבר. בסיום הפונקציה מושמדים שני האובייקטים, אך החוצץ בזיכרון משוחרר פעם אחת בלבד.
:::
:::

:::check id=chk-move-cast
מה מבצעת הפונקציה `std::move`?

* [ ] מקצה חוצץ חדש ומעתיקה את הבתים
* [x] ממירה ערך מיקום (lvalue) לערך זמני (rvalue) כדי לאפשר בחירה בהעמסת העברה
* [ ] משמידה את האובייקט המקורי

`std::move` אינה מעבירה זיכרון בפועל; היא מבצעת המרת טיפוס בלבד. בנאי ההעברה הוא זה שמבצע את גניבת המשאבים.
:::

:::trap
אובייקט שעברו ממנו נותר במצב תקף אך מרוקן — הוא אינו נעלם מהזיכרון. קריאה ל-`processImage(avi)` לאחר `std::move(avi)` תפעל על תמונה ריקה.
:::

:::trap
`shared_ptr` אינו פותר בעיה של מצביעים מעגליים (cyclic dependencies). אם שני אובייקטים מחזיקים `shared_ptr` זה לזה, מונה הייחוסים לעולם לא יגיע לאפס והזיכרון ידלף. לפתרון בעיה זו יש להשתמש ב-`std::weak_ptr`.
:::

## תרגול

:::problem id=ps4-copy-count title="כמה העתקות" source="materials/sessions/SPL_PS4.pptx" kind=exercise solution_origin=derived
כמה פעמים ירוץ בנאי ההעתקה בהנחה שאין העלמת העתקה (copy elision), ומה משתנה כשהפרמטר מועבר כ-`const MyClass&`? אילו העתקות NRVO רשאי להסיר?

```cpp
MyClass pass(MyClass value) {
    return value;
}

MyClass passRef(const MyClass& value) {
    MyClass local(value);
    return local;
}

```

:::hint
העברת פרמטר לפי ערך דורשת העתקה בכניסה. החזרה לפי ערך דורשת העתקה ביציאה (בהעדר העלמת העתקה).
:::
:::hint
העברת פרמטר ברפרנס קבוע (`const MyClass&`) אינה מבצעת העתקה בכניסה.
:::
:::solution
ב-`pass` (ללא NRVO וללא העלמה): העתקה אחת מבוצעת בכניסה לפרמטר `value`, והעתקה שנייה מבוצעת ביציאה בהחזרת הערך — בסך הכול שתי קריאות לבנאי ההעתקה.

ב-`passRef`: העברת הפרמטר ברפרנס מונעת את ההעתקה בכניסה. הקריאה ל-`local(value)` מבצעת העתקה מפורשת אחת, והחזרת `local` מבצעת העתקה שנייה. אם אופטימיזציית NRVO מופעלת, היא בונה את `local` ישירות במשבצת הזיכרון של הקורא, ומבטלת את העתקת ההחזרה.
:::
:::

:::problem id=ps4-unique-vs-shared title="shared מול unique" source="materials/sessions/SPL_PS4.pptx" kind=exercise solution_origin=source
מה יתרחש בכל אחד מקטעי הקוד הבאים?

```cpp
auto sp1 = std::make_shared<int>(1);
{
    auto sp2 = sp1;
}

```

```cpp
auto up1 = std::make_unique<int>(1);
auto up2 = up1;

```

:::hint
העתקה של `shared_ptr` מגדילה את מונה הייחוסים.
:::
:::hint
ל-`unique_ptr` יש בנאי העתקה מבוטל (`= delete`).
:::
:::solution
בקטע הראשון: ההשמה `sp2 = sp1` מעתיקה את המצביע המשותף ומעלת את מונה הייחוסים ל-2. ביציאה מהבלוק הפנימי, `sp2` מושמד ומונה הייחוסים יורד ל-1. ה-`int` בערימה נשאר חי ונגיש דרך `sp1`.

בקטע השני: השורה `auto up2 = up1;` מנסה לבצע העתקה של `unique_ptr`. כיוון שבנאי ההעתקה שלו מבוטל (`= delete`), התוכנית תיכשל בהידור. כדי להעביר את הבעלות יש לכתוב מפורשות: `auto up2 = std::move(up1);`.
:::
:::

:::examnote
שאלות בחינה העוסקות בחוק החמישה או במצביעים חכמים דורשות לעיתים קרובות לממש העברת משאבים (ללא העתקה) או ליישם מנגנון השהיית העתקה (Copy-On-Write). יש להקפיד על איפוס המקור לאחר העברה ועל מניעת העתקה לא מורשית של `unique_ptr`.
:::

:::problem id=exam-16b-q2 title="אוסף לפי ערך" source="materials/exams/16-b.pdf" kind=exam solution_origin=derived
המחלקה `ITEM_COLLECTION<T>` מנהלת אוסף פריטים. הפונקציה `byVal` מקבלת את האוסף לפי ערך.

א. כתבו בנאי העתקה עמוק, תוך הקפדה על תחביר תבנית (template).

ב. השלימו את `main` כך שהאוסף יוכל להחזיק הן `SPHERE` והן `BOX` (שניהם יורשים מ-`SHAPE`).

ג. מה יתרחש בשרשור `byVal(myShapeCollection)` אם נעבור לבנאי העתקה של ברירת מחדל?

ד. תקנו את ניהול הבעלות באמצעות `shared_ptr`.

:::solution
א. בנאי העתקה עמוק:

```cpp
template <typename T>
ITEM_COLLECTION<T>::ITEM_COLLECTION(const ITEM_COLLECTION<T>& other)
    : _capacity(other._capacity), _size(other._size), _items(new T[other._capacity]) {
    for (int i = 0; i < _size; ++i) {
        _items[i] = other._items[i];
    }
}

```

ב. כדי למנוע חיתוך אובייקטים (slicing) ולאפשר פולימורפיזם, יש לאחסן מצביעים: `ITEM_COLLECTION<SHAPE*>` או בגרסה בטוחה `ITEM_COLLECTION<std::shared_ptr<SHAPE>>`.

ג. בנאי העתקה של ברירת מחדל מבצע העתקה רדודה (shallow copy) של המצביע למערך. בעת העברת האוסף לפי ערך ל-`byVal`, נוצר העתק רדוד. בסיום `byVal`, הדיסטרקטור של הפרמטר משחרר את המערך ב-`delete[]`. האוסף המקורי נותר עם מצביע תלוי (dangling pointer), ובעת השמדתו תתרחש שגיאת שחרור כפול (double free).

ד. שימוש ב-`ITEM_COLLECTION<std::shared_ptr<SHAPE>>` מבטיח שכאשר האוסף מועתק, מועתקים המצביעים החכמים ומוני הייחוסים שלהם גדלים. השמדת עותק זמני תוריד את המונים מבלי לשחרר את הצורות עצמן בטרם עת.
:::
:::

:::problem id=exam-20b-q1 title="מצביע חכם" source="materials/exams/20-b.pdf" kind=exam solution_origin=derived
ממשו את המחלקה `SmartPointer<T>` בהתאם למודל הבעלות המשותפת (`shared_ptr`): כולל מונה ייחוסים דינמי, העתקה המשתפת את האובייקט, ושחרור הזיכרון רק כאשר מונה הייחוסים מגיע לאפס.

:::solution

```cpp
template <typename T>
class SmartPointer {
    T* ptr_;
    int* count_;
public:
    explicit SmartPointer(T* p = nullptr)
        : ptr_(p), count_(p ? new int(1) : new int(0)) {}

    SmartPointer(const SmartPointer& other)
        : ptr_(other.ptr_), count_(other.count_) {
        if (ptr_) {
            ++(*count_);
        }
    }

    ~SmartPointer() {
        release();
    }

    SmartPointer& operator=(const SmartPointer& other) {
        if (this != &other) {
            release();
            ptr_ = other.ptr_;
            count_ = other.count_;
            if (ptr_) {
                ++(*count_);
            }
        }
        return *this;
    }

    T& operator*() const { return *ptr_; }
    T* operator->() const { return ptr_; }

private:
    void release() {
        if (ptr_ && --(*count_) == 0) {
            delete ptr_;
            delete count_;
            ptr_ = nullptr;
            count_ = nullptr;
        }
    }
};

```

:::
:::

:::problem id=exam-24a-q1 title="עץ תחת חוק החמישה" source="materials/exams/24-a.pdf" kind=exam solution_origin=derived
נתונה מחלקת עץ בינארי `BinaryTree<T>` המנהלת צמתים המוקצים דינמית בערימה.

א. הגדירו את המחלקה ב-C++ כולל שדות, בנאים, מתודת `insert` וגטרים.

ב. המשיכו את המחלקה וממשו את חוק החמישה (דיסטרקטור, בנאי העתקה, אופרטור השמת העתקה, בנאי העברה, אופרטור השמת העברה).

ג. שרטטו את מצב הזיכרון (מחסנית וערימה) עבור הקריאה `f(BinaryTree<int>(1, ...))` בהנחה שמימשתם העברה.

:::solution
א.+ב. מימוש המחלקה עם חוק החמישה:

```cpp
template <typename T>
class BinaryTree {
    T data;
    BinaryTree* left;
    BinaryTree* right;

public:
    BinaryTree(const T& val) : data(val), left(nullptr), right(nullptr) {}
    BinaryTree(const T& val, BinaryTree* l, BinaryTree* r)
        : data(val), left(l), right(r) {}

    // Destructor
    ~BinaryTree() {
        delete left;
        delete right;
    }

    // Copy Constructor
    BinaryTree(const BinaryTree& other)
        : data(other.data),
          left(other.left ? new BinaryTree(*other.left) : nullptr),
          right(other.right ? new BinaryTree(*other.right) : nullptr) {}

    // Copy Assignment Operator
    BinaryTree& operator=(const BinaryTree& other) {
        if (this != &other) {
            BinaryTree temp(other);
            std::swap(data, temp.data);
            std::swap(left, temp.left);
            std::swap(right, temp.right);
        }
        return *this;
    }

    // Move Constructor
    BinaryTree(BinaryTree&& other) noexcept
        : data(std::move(other.data)), left(other.left), right(other.right) {
        other.left = nullptr;
        other.right = nullptr;
    }

    // Move Assignment Operator
    BinaryTree& operator=(BinaryTree&& other) noexcept {
        if (this != &other) {
            delete left;
            delete right;
            data = std::move(other.data);
            left = other.left;
            right = other.right;
            other.left = nullptr;
            other.right = nullptr;
        }
        return *this;
    }

    void insert(const T& val) {
        if (val < data) {
            if (left) left->insert(val);
            else left = new BinaryTree(val);
        } else if (val > data) {
            if (right) right->insert(val);
            else right = new BinaryTree(val);
        }
    }
};

```

ג. בעת הקריאה `f(BinaryTree<int>(...))`, הארגומנט הוא rvalue אנונימי. בנאי ההעברה נגנב את המצביעים `left` ו-`right` מהאובייקט הזמני ומאפס את המצביעים במקור. במסגרת המחסנית של `f` נוצר האובייקט `t` המקבל את הבעלות על הצמתים שבערימה.
:::
:::

:::problem id=exam-24c-q1 title="העתקה בעת כתיבה" source="materials/exams/24-c.pdf" kind=exam solution_origin=derived
ממשו מחלקת מעטפת `copy_on_write<T>` המיישמת מנגנון העתקה בעת כתיבה (Copy-On-Write): אובייקטים משוכפלים חולקים את אותם הנתונים בערימה עד לביצוע פעולת כתיבה ראשונה (`on_write()`), שבה מבוצע שיבוט פרטי.

:::solution

```cpp
template <typename T>
class copy_on_write {
    T* ptr;
    int* users;

public:
    explicit copy_on_write(T* p)
        : ptr(p), users(new int(1)) {}

    // Copy Constructor: share data, increment reference count
    copy_on_write(const copy_on_write& other)
        : ptr(other.ptr), users(other.users) {
        ++(*users);
    }

    // Called before any mutating operation
    void on_write() {
        if (*users > 1) {
            --(*users);
            ptr = ptr->clone(); // Allocate private copy
            users = new int(1);
        }
    }

    ~copy_on_write() {
        if (--(*users) == 0) {
            delete ptr;
            delete users;
        }
    }

    T* operator->() {
        on_write();
        return ptr;
    }

    const T* operator->() const {
        return ptr; // Const access does not trigger copy
    }
};

```

:::
:::
