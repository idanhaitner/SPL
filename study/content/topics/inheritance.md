---
id: inheritance
title: ירושה
sources:
  - "materials/lectures/Chapter 6 - Inheritance.pptx"
  - "materials/sessions/SPL_PS3.pptx"
  - "materials/exams/16-a.pdf"
  - "materials/exams/16-a-solution.pdf"
  - "materials/exams/18-a.pdf"
  - "materials/exams/18-a-solution.pdf"
  - "materials/exams/18-b.pdf"
  - "materials/exams/18-b-solution.pdf"
  - "materials/exams/19-a.pdf"
  - "materials/exams/19-a-solution.pdf"
  - "materials/exams/19-b.pdf"
  - "materials/exams/19-b-solution.pdf"
  - "materials/exams/24-b.pdf"
  - "materials/exams/24-b-solution.pdf"
---

ירושה (Inheritance) מאפשרת להגדיר מחלקה נגזרת (Derived Class) המרחיבה מחלקת בסיס (Base Class), מוסיפה איברים ומעדכנת התנהגות.

```cpp
class BlurFilter : public Filter {
    double _str;
public:
    BlurFilter(double strength) : Filter("blur"), _str(strength) {}
    double getStrength() const { return _str; }
};

```

הבנאי של המחלקה הנגזרת מחויב לקרוא לבנאי של מחלקת הבסיס ברשימת האתחול. בהעדר קריאה מפורשת, יופעל בנאי ברירת המחדל של מחלקת הבסיס.

## עקרון ההחלפה של ליסקוב (LSP)

:::definition id=def-lsp title="עקרון ההחלפה של ליסקוב (Liskov Substitution Principle)" source="materials/lectures/Chapter 6 - Inheritance.pptx"
עקרון LSP קובע כי אובייקט ממחלקה נגזרת חייב להיות ניתק להחלפה בכל מקום שבו נדרש אובייקט ממחלקת הבסיס, מבלי לפגוע בתקינות התוכנית או להפר את השמורות (invariants) של מחלקת הבסיס.
:::

דוגמה להפרת LSP: הגדרת המחלקה `Square` כנגזרת מ-`Rectangle`. הקריאה ל-`setWidth(w)` במלבן משנה רק את הרוחב, בעוד שבריבוע היא מחייבת שינוי של הגובה. דריסה זו מפרה את החוזה של מחלקת הבסיס.

### רמות הרשאה וירושה ב-C++

| סוג ירושה | חבר public של הבסיס הופך ל- | חבר protected של הבסיס הופך ל- | חבר private של הבסיס |
| --- | --- | --- | --- |
| `public` | `public` (יחס is-a) | `protected` | לא נגיש |
| `protected` | `protected` | `protected` | לא נגיש |
| `private` | `private` (קומפוזיציה) | `private` | לא נגיש |

### פונקציות וירטואליות וטבלת vtable

:::definition id=def-virtual title="פונקציה וירטואלית ו-vtable" source="materials/lectures/Chapter 6 - Inheritance.pptx"
פונקציה שאינה וירטואלית נקשרת באמצעות **קשירה סטטית** (Static Binding) לפי הטיפוס הסטטי של המצביע/הרפרנס בזמן ההידור.

פונקציה המוכרזת כ-`virtual` נקשרת באמצעות **קשירה דינמית** (Dynamic Binding) לפי הטיפוס הדינמי של האובייקט בזמן הריצה.

מחלקה הכוללת לפחות פונקציה וירטואלית אחת היא מחלקה פולימורפית. המהדר מוסיף לכל מופע שלה מצביע חבוי (`vptr`) המוליך לטבלת פונקציות וירטואליות (`vtable`) של המחלקה.
:::

### דיסטרקטור וירטואלי (Virtual Destructor)

:::theorem id=thm-virtual-dtor title="חובת דיסטרקטור וירטואלי" source="materials/lectures/Chapter 6 - Inheritance.pptx"
אם מחלקה כוללת מתודות וירטואליות (כלומר מיועדת לשמש כמחלקת בסיס פולימורפית), הדיסטרקטור שלה חייב להיות מוכרז כ-`virtual`.

:::proof
אם הדיסטרקטור אינו וירטואלי, מחיקת אובייקט נגזר דרך מצביע למחלקת הבסיס (`Base* p = new Derived(); delete p;`) תפעיל קשירה סטטית ותקרא לדיסטרקטור של `Base` בלבד. כתוצאה מכך, הדיסטרקטור של `Derived` לא יורץ, ומשאבים שהוקצו במחלקה הנגזרת ידלפו (התנהגות לא מוגדרת - Undefined Behavior).
:::
:::

פונקציה וירטואלית טהורה (`pure virtual`) מוגדרת באמצעות `= 0`. מחלקה המכילה לפחות פונקציה וירטואלית טהורה אחת היא **מחלקה מופשטת (Abstract Class)** ולא ניתן ליצור מופעים שלה.

:::problem id=worked-virtual-call title="מעקב קריאה וירטואלית" source="materials/lectures/Chapter 6 - Inheritance.pptx" kind=worked solution_origin=source
הסבר איזו מתודה תיקרא כאשר `apply` מוגדר כ-`virtual` וכאשר אינו מוגדר כ-`virtual`:

```cpp
Filter* filter = new BlurFilter();
filter->apply(img);

```

:::solution

- **כאשר `apply` הוא `virtual`:** מבוצעת קשירה דינמית. ה-`vptr` מוליך ל-vtable של `BlurFilter`, ותיקרא המתודה `BlurFilter::apply`.
- **כאשר `apply` אינו `virtual`:** מבוצעת קשירה סטטית. לפי הטיפוס הסטטי של המצביע (`Filter*`), תיקרא המתודה `Filter::apply`.
:::
:::

![אובייקט BlurFilter מחזיק vptr. הקריאה עוקבת אחריו אל ה-vtable של המחלקה ומוצאת את BlurFilter::apply](../assets/figures/vtable-call.svg)

:::check id=chk-virtual-dtor
אתם הולכים לבצע `delete` ל-`BlurFilter` דרך `Filter*`. מה חייב להיות נכון לגבי `~Filter`?

- [ ] הוא חייב להיות וירטואלי טהור ובלי גוף
- [x] הוא חייב להיות virtual
- [ ] הוא חייב להיות private

הדיסטרקטור של הנגזרת חייב לרוץ. רק דיסטרקטור וירטואלי משוגר דרך ה-vptr.
:::

## תרגול

:::problem id=ps3-virtual-destructor title="מחיקה דרך מצביע בסיס" source="materials/sessions/SPL_PS3.pptx" kind=exercise solution_origin=source
אובייקט נגזר עובר `delete` דרך מצביע של הבסיס, והדיסטרקטור אינו virtual. מה התוצאה, ומה הכלל למחלקה שנועדה להיות בסיס?

```cpp
Base* p = new Derived();
delete p;
```

:::hint
הטיפוס הסטטי של המצביע הוא הבסיס. קריאות לא-virtual משתמשות בטיפוס הזה.
:::
:::hint
הניסוח בתרגול הוא «תוצאה לא מוגדרת», לא «הדיסטרקטור של הנגזרת עדיין רץ».
:::
:::hint
קשרו את הכלל אל «אם מחלקה אמורה לרשת ממנה».
:::
:::solution
ההתנהגות לא מוגדרת. בפועל מדלגים על הדיסטרקטור של הנגזרת, ולכן משאבים שהמחלקה הנגזרת מחזיקה דולפים, והשחרור עשוי להשתמש בגודל הבסיס. הכלל בתרגול: אם מחלקה נועדה לרשת ממנה, תנו לה דיסטרקטור וירטואלי. ההרצאה מחמירה יותר בניסוח ושקולה בתוצאה: מחלקה פולימורפית חייבת דיסטרקטור כזה. בנאים נשארים לא-virtual. מתודה וירטואלית טהורה, שנכתבת `= 0`, הופכת את הבסיס למופשט, וזו החלטה נפרדת מן הדיסטרקטור.
:::
:::

:::examnote
השאלה שמה שני טיפוסים נגזרים מאחורי מצביע בסיס אחד ושואלת למה קריאה לא-virtual, דיסטרקטור לא-virtual, או העמסה (overload) במקום override משתמשים בבסיס. המלכודת היא ציור זיכרון שמחסיר את ה-vptr, או `delete` דרך הבסיס שאף פעם לא מריץ את הדיסטרקטור של הנגזרת.
:::

:::problem id=exam-16a-q2 title="מבקר לצורות" source="materials/exams/16-a.pdf" kind=exam solution_origin=derived
למנוע משחק יש `SHAPE`ים (`SPHERE`, `BOX`) שמצוירים על ידי `SHADER`ים (`BASIC_SHADER`, `COMPLEX_SHADER`). לכל shader יש `Render(SPHERE*)` ו-`Render(BOX*)`. `RENDER_MGR::Render` עובר על הצורות ועל ה-shaders. בחירת העמסה על `SHAPE*` לא יכולה לבחור את `Render(SPHERE*)`.

א. ממשו את תבנית המבקר (visitor) כדי שהלולאה תשלח לזוג הנכון. `SHAPE` ו-`SHADER` חייבים להיות מופשטים. הוסיפו קוד רק במחלקות ששמן מופיע בשאלה.

ב. כתבו בנאי העתקה (copy constructor) עמוק ל-`RENDER_MGR`.

:::hint
שיגור כפול (double dispatch) צריך שתי קריאות virtual: הצורה מקבלת את ה-shader, וה-shader אז מקבל את הצורה הקונקרטית.
:::
:::hint
`Accept` על `SPHERE` קורא ל-`shader->Render(this)` כש-`this` הוא `SPHERE*`, ולכן ההעמסה נפתרת במחלקה הנגזרת.
:::
:::hint
מנהל שמחזיק מצביעים בעלי בעלות מעתיק עמוק על ידי שיבוט של כל צורה וכל shader, לא על ידי העתקת המצביעים.
:::
:::solution
```cpp
struct Shader {
    virtual ~Shader() = default;
    virtual void Render(Sphere* s) = 0;
    virtual void Render(Box* b) = 0;
};
struct Shape {
    virtual ~Shape() = default;
    virtual void Accept(Shader* sh) = 0;
};
struct Sphere : Shape {
    void Accept(Shader* sh) override { sh->Render(this); }
};
struct Box : Shape {
    void Accept(Shader* sh) override { sh->Render(this); }
};
```

`RENDER_MGR::Render` קורא ל-`shape->Accept(shader)` לכל זוג. `BasicShader` ו-`ComplexShader` דורסים את שתי העמסות ה-`Render`. בנאי ההעתקה מקצה צורות ו-shaders חדשים. אם בהיררכיה יש `clone()` וירטואלי, זו ההעתקה העמוקה; העתקת מערך המצביעים היא הבאג שסעיף ב נועד לתפוס.
:::
:::

:::problem id=exam-18a-q1 title="דיסטרקטור של תמונה" source="materials/exams/18-a.pdf" kind=exam solution_origin=derived
`Image` הוא בסיס מופשט עם `int n_pixels` ו-`virtual void show() = 0`. `ColorImage` יורש ממנו ומחזיק מערך פיקסלים. הטענות לבחירה כוללות: התוכנית דולפת (leak) כי `~ColorImage` אף פעם לא רץ; התיקון הוא `virtual ~Image() {}`; גם ל-`ColorImage` צריך דיסטרקטור משלו שמבצע `delete[]` על המערך; אין דליפה. בחרו את הטענה הנכונה, ואמרו מה העתקה לפי ערך של `ColorImage` עושה למערך תחת חוק השלושה (rule of three).

:::hint
`Image* p = new ColorImage(...); delete p;` משתמש ב-`~Image` אלא אם הדיסטרקטור הזה הוא virtual.
:::
:::hint
הפיכת הדיסטרקטור ל-virtual מריצה את `~ColorImage`. היא לא, כשלעצמה, משחררת מערך גולמי. הדיסטרקטור של הנגזרת חייב לעשות את זה.
:::
:::hint
האפשרויות בשאלה מתייחסות אל «הוסיפו `virtual ~Image`» כהכרחי ולא כמספיק כשקיים מערך שני.
:::
:::solution
`delete` דרך `Image*` מריץ רק את `~Image` כשהדיסטרקטור אינו virtual, ולכן `~ColorImage` אף פעם לא משחרר את מערך הפיקסלים. זו דליפה. הכרזה `virtual ~Image() = default` גורמת ל-`delete` להישלח אל `~ColorImage`. אם `ColorImage` מחזיק מערך גולמי, `~ColorImage` חייב לבצע עליו `delete[]`, ובנאי ההעתקה וההשמה חייבים להעתיק אותו עמוק. טענה שאומרת שאין דליפה היא שקר. טענה שרק משנה את `main` כדי לנקוב בטיפוס הדינמי מתקנת את השורה הזאת ומשאירה את ה-`delete` הבא דרך `Image*` שבור. העתקה לפי חוק השלושה היא באג נפרד: ההעתקה שהמהדר מייצר חולקת את המערך, ושני הדיסטרקטורים משחררים אותו פעמיים.
:::
:::

:::problem id=exam-18b-q1 title="זיכרון של היררכיית תמונות" source="materials/exams/18-b.pdf" kind=exam solution_origin=derived
`Image` הוא בסיס מופשט עם `int n_pixels` ו-`virtual void show() = 0`. `GrayImage` ו-`ColorImage` יורשים ממנו ונבדלים בטיפוס הפיקסל, וכל אחד מחזיק מערך פיקסלים משלו. ציירו את המחסנית ואת הערימה (heap) בהערה שבתוך `show`, כולל vptrים. סעיף מאוחר יותר שואל איזו המרה מוצאת את הטיפוס הדינמי. הדיון בשאלה כולל את `dynamic_cast`.

:::hint
אובייקט נגזר אחד הוא בלוק אחד: תת-אובייקט של הבסיס, ואז האיברים הנגזרים, ועוד vptr כי המחלקה פולימורפית.
:::
:::hint
משתנה מצביע על המחסנית שומר את הכתובת של הבלוק הזה. מערך הפיקסלים, אם הוקצה עם `new`, הוא בלוק ערימה שני.
:::
:::hint
`dynamic_cast` צריך את ה-vtable. הוא נכשל בזמן ריצה כשהאובייקט אינו מן הטיפוס היעד. זו אינה המרה של זמן הידור בלבד.
:::
:::solution
בקריאה, המחסנית מחזיקה את פרמטר המצביע (ואת כתובת החזרה). אובייקט הערימה מתחיל ב-vptr, אחר כך `n_pixels`, אחר כך המצביע הנגזר אל חוצץ הפיקסלים, ואחר כך החוצץ עצמו כבלוק ערימה נוסף. לתמונת שחור-לבן ולתמונת צבע יש vtable שונה, ולכן `show` דרך `Image*` מגיע לדריסה. `dynamic_cast<ColorImage*>(p)` מחזיר null כש-`p` אינו תמונת צבע, ומחזיר את המצביע כשכן. המרה בסגנון C לא מבצעת את הבדיקה הזאת. הציור שהשאלה מדפיסה נכון כשכל תת-אובייקט פולימורפי מראה vptr ומערך הפיקסלים לא מצויר בתוך מסגרת המחסנית.
:::
:::

:::problem id=exam-19a-q1 title="מאגר אפליקציות" source="materials/exams/19-a.pdf" kind=exam solution_origin=derived
`APP` מופשט עם `virtual void run() = 0`. `PAY_APP` ו-`PLAY_APP` דורסים אותו. `MY_APPS_REPO` חייב לשמור את שני הסוגים במערך אחד.

א. תנו ל-`apps_repo_arr_` טיפוס יחיד שיכול להחזיק את שניהם.

ב. ממשו את `MY_APPS_REPO(int n_pay_app, int n_play_app)` כדי להקצות ולשמור את המספר הזה מכל אחד.

ג. המחלקה למדה דרך לעצור לקוחות מלקרוא ל-`new` על המאגר, על ידי הסתרת הבנייה. ממשו את זה, והראו איך לקוח עדיין משיג מופע.

ד. `Clone` ו-`test_apps_repo` כבר נכונים. גרמו ל-`repo->test_apps_repo(test->Clone())` לבצע את ההעתקה ביעילות. ממשו רק את הפונקציות שהשורה הזאת צריכה.

:::hint
מערך אחד של `APP*` מחזיק את שני הטיפוסים הנגזרים. מערך של `APP` היה חותך (slicing), ומערך של טיפוס נגזר אחד לא יכול להחזיק את האחר.
:::
:::hint
הסתרת `new` היא בנאי פרטי ועוד מפעל (factory) סטטי, או `operator new` פרטי. המפעל מחזיר מצביע או מצביע חכם.
:::
:::hint
`Clone` מחזיר מאגר חדש. אם הוא מחזיר לפי ערך, בנאי ההעתקה רץ. העברה, או החזרת מצביע, היא הגרסה היעילה שהשורה מבקשת.
:::
:::solution
א. `APP** apps_repo_arr_;` או `std::vector<std::unique_ptr<APP>>`. הטיפוס הסטטי הוא מצביע הבסיס.

ב. הקצו `n_pay_app + n_play_app` משבצות. `n_pay_app` הראשונות הן `new PAY_APP`, והשאר `new PLAY_APP`.

ג. הפכו כל בנאי לפרטי ופרסמו `static MY_APPS_REPO* create(...)`. לקוחות לא יכולים לכתוב `new MY_APPS_REPO` מחוץ למחלקה. הם קוראים ל-`create`.

ד. `Clone` צריך להעביר או להעתיק עמוק את מערך המצביעים אל מאגר חדש. הארגומנט של `test_apps_repo` הוא זמני אם `Clone` מחזיר לפי ערך, ולכן בנאי-העברה (move constructor) של המאגר גונב את מערך המצביעים במקום לשכפל אותו שוב. הדיסטרקטור הווירטואלי על `APP` נדרש כדי שהשמדת המאגר תבצע `delete` על היישומים האמיתיים. ממשו את `Clone` ואת הבנאי או את פעולת ההעברה שהקריאה משתמשת בהם, לא את כל המחלקה.
:::
:::

:::problem id=exam-19b-q1 title="העמסה מול טיפוס דינמי" source="materials/exams/19-b.pdf" kind=exam solution_origin=derived
`TESTER` מכריז על שלוש העמסות, `test(APP*)`, `test(PAY_APP*)`, `test(PLAY_APP*)`, כולן virtual במובן של הבסיס, אבל קריאה `tester->test(app)` שבה ל-`app` יש טיפוס סטטי `APP*` קושרת את העמסת ה-`APP*` בזמן הידור. בחירת העמסה לא משתמשת בטיפוס הדינמי. ציירו את הזיכרון של הריצה עד ההערה, והסבירו למה אובייקט `PAY_APP` עדיין פוגע ב-`test(APP*)`.

:::hint
בחירת העמסה מסתכלת על הטיפוס הסטטי של הארגומנט. השיגור הווירטואלי מסתכל אחר כך על הטיפוס הדינמי של האובייקט שעליו נקראת המתודה, לא של הארגומנט.
:::
:::hint
תבנית המבקר היא הדרך לגרום לטיפוס הדינמי של הארגומנט להשתתף. העמסה יחידה לא עושה את זה.
:::
:::hint
ציור הזיכרון עדיין צריך vptr אם פונקציה כלשהי באובייקט היא virtual.
:::
:::solution
`test(app)` עם `APP* app` בוחר את `TESTER::test(APP*)` בזמן הידור, גם כש-`app` מצביע על `PAY_APP`. virtual על שלוש ההעמסות האלה בוחר רק את הדריסה של ה-tester לחתימה המדויקת הזאת. הוא לא מסתכל בתוך `app`. כדי לשגר לפי היישום צריך `accept` וירטואלי על `APP` (מבקר), או שרשרת `dynamic_cast`, שההרצאה מתייחסת אליה כאל הכלי הנחות. תמונת הזיכרון היא אובייקט ה-tester ואובייקט היישום, לכל אחד vptr אם הם פולימורפיים, השדות הנוספים של היישום בחלק הנגזר, והמצביע על המחסנית. אין מצביע פונקציה שני שמסתתר בארגומנט.
:::
:::

:::problem id=exam-24b-q1 title="עץ בסריקה תוכית" source="materials/exams/24-b.pdf" kind=exam solution_origin=derived
ל-`BinaryTree<T>` יש `left` ו-`right`. `InorderBinaryTree` יורש ממנו וגם מממש ממשק סריקה. ציירו זיכרון בסוף:

```cpp
Traversable<BinaryTree<int>>* t1 = new InorderBinaryTree<BinaryTree<int>>(
    BinaryTree<int>(2),
    new InorderBinaryTree<BinaryTree<int>>(BinaryTree<int>(1)),
    new InorderBinaryTree<BinaryTree<int>>(BinaryTree<int>(3)));
InorderBinaryTree<int> t2(2,
    new InorderBinaryTree<int>(1),
    new InorderBinaryTree<int>(3));
```

:::hint
`t1` הוא מצביע אחד על המחסנית. האובייקט על הערימה, והוא מכיל תת-אובייקט `BinaryTree` ועוד את החלק הנגזר.
:::
:::hint
`t2` הוא אובייקט אוטומטי. הילדים שלו הוקצו עם `new`, ולכן הילדים האלה על הערימה אף ש-`t2` לא.
:::
:::hint
איבר `BinaryTree<int>(2)` לפי ערך מוטמע, לא מצביעים אליו. ילד `new InorderBinaryTree` הוא בלוק נפרד עם vptr משלו.
:::
:::solution
`t1` חי במסגרת ומחזיק כתובת ערימה. אובייקט הערימה הזה הוא `InorderBinaryTree` שתת-האובייקט של הבסיס שלו שומר נתון 2 ושני מצביעי ילדים. כל ילד הוא `InorderBinaryTree` ערימה משלו, נתון 1 ונתון 3. כי המחלקה פולימורפית דרך `Traversable`, לכל אחד משלושת האובייקטים האלה יש vptr.

`t2` הוא כל האובייקט הנגזר במסגרת: נתון 2, vptr, ושני מצביעים. הילדים 1 ו-3 הם אובייקטי ערימה, לכל אחד vptr. אל תציירו את השדות של `t2` עצמו על הערימה. אל תציירו את השדות של הילדים בתוך `t2`. צומת הערך `BinaryTree<int>(2)` ששימש ארגומנט הועתק אל ההורה; הוא אינו עץ חי רביעי אחרי שהבנאי חוזר.
:::
:::

ה-vptr הוא המצביע החבוי האחרון במודל האובייקט. [חזרה ל-Java](topic:java-runtime) משתמש באותו רעיון באיות אחר: כל מתודה לא-`static` היא virtual, ואוסף הזבל (garbage collector), לא `delete`, מסיים את חיי האובייקט.
