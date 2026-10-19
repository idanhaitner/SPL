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

ירושה (inheritance) בונה מחלקה (class) חדשה על מחלקה קיימת. מחלקת הבסיס (base class) היא זו שכבר קיימת. המחלקה הנגזרת (derived class) מוסיפה איברים ויכולה להחליף התנהגות. הנקודתיים בראש המחלקה הן האיות של C++ ל-`extends` של Java.

```cpp
class BlurFilter : public Filter {
    double _str;
public:
    BlurFilter(double strength) : Filter("blur"), _str(strength) {}
    double getStrength() { return _str; }
};
```

הבנאי (constructor) של המחלקה הנגזרת חייב לקרוא לבנאי של מחלקת הבסיס. אם הוא לא קורא, המהדר מנסה את בנאי ברירת המחדל של הבסיס, והתוכנית נכשלת בהידור כשלבסיס אין בנאי כזה. תרגול 3 מראה גם את הצורה המפורשת `Student(...) : Person(name) {}` וגם את הצורה המשתמעת, שמתקמפלת רק כשאפשר לבנות `Person` בלי ארגומנטים.

## מה יחס is-a באמת דורש

המרה למעלה (upcasting) שומרת אובייקט (object) נגזר במצביע (pointer) של מחלקת הבסיס או ברפרנס (reference) של מחלקת הבסיס. ההצדקה בשקף היא יחס is-a: `BlurFilter` הוא `Filter`.

```cpp
void process(Image& img, const Filter& filter);
BlurFilter blur(50.0);
process(img, blur);
```

אותה המרה למעלה עובדת עם מצביע חכם ייחודי (unique_ptr): `unique_ptr<Filter>` שמחזיק `BlurFilter`.

:::definition id=def-lsp title="עקרון ההחלפה של ליסקוב (Liskov Substitution Principle)" source="materials/lectures/Chapter 6 - Inheritance.pptx"
עקרון ההחלפה של ליסקוב: אובייקט נגזר חייב להיות שמיש בכל מקום שנדרש אובייקט של מחלקת הבסיס, בלי לשבור את שמורות הבסיס. זה משפט על התנהגות, לא על שיתוף שמות של שדות.
:::

דוגמת הנגד בהרצאה היא `SquareImage : Image` שה-`crop` שלו יכול לשנות את הרוחב ואת הגובה בנפרד, כך שהתוצאה כבר אינה ריבוע. override של `crop` כדי לסרב לשינוי הזה שובר את החוזה של הבסיס, שהבטיח חיתוך. הירושה היא הכלי הלא נכון. ריבוע אינו תמונה שמותר לחתוך בחופשיות.

### public, protected, private

אנקפסולציה (encapsulation) היא לתת גישה רק לקוד שצריך אותה. שלוש הרמות הן `public`, `protected` ו-`private`. ל-C++ יש גם שלושה סוגי ירושה. ל-Java יש רק את הסוג ה-public.

| ירושה | חבר public הופך ל- | חבר protected הופך ל- | חבר private |
| --- | --- | --- | --- |
| public | public | protected | לא נגיש |
| protected | protected | protected | לא נגיש |
| private | private | private | לא נגיש |

ירושה public היא is-a. ירושה private היא איות של has-a שההרצאה אומרת לא להשתמש בו בשביל מסנן שמוצמד לתמונה. הרכבה / קומפוזיציה (composition) היא ה-has-a שההרצאה רוצה: `Image` מחזיק `Filter*` וקורא ל-`filter->apply(*this)`. ירושת protected היא האמצע ה«מוגבל» שהשקף נוקב בשמו ואז לא משתמש בו.

### הצללה (shadowing) ופונקציות וירטואליות (virtual function)

פונקציה לא-virtual במחלקה הנגזרת מסתירה את פונקציית הבסיס בעלת אותו שם. הקריאה נקשרת לפי הטיפוס הסטטי (static type) של הביטוי. דרך `Filter*` מקבלים את `Filter::apply`, גם אם האובייקט הוא `BlurFilter`. גם שדות יכולים להסתיר: `_name` שני במחלקה הנגזרת הוא איבר אחר, ו-`_name` לא מצוין במתודה הנגזרת הוא זה של הנגזרת.

:::definition id=def-virtual title="פונקציה וירטואלית ו-vtable" source="materials/lectures/Chapter 6 - Inheritance.pptx"
פונקציה וירטואלית משתמשת בקשירה דינמית (dynamic binding), שנקראת גם קשירה מאוחרת (late binding). הקריאה הולכת ל-override של הטיפוס הדינמי (dynamic type). פונקציה לא-virtual משתמשת בקשירה סטטית (static binding), או קשירה מוקדמת (early binding).

מחלקה היא פולימורפית כשיש בה לפחות פונקציה וירטואלית אחת. זה פולימורפיזם (polymorphism). המהדר מוסיף אז, לכל אובייקט, מצביע חבוי `vptr` אל ה-vtable של המחלקה, שמחזיקה את הכתובות של הפונקציות הווירטואליות.

`override` בודק שבאמת דרסתם virtual של הבסיס. `final` על פונקציה אוסר דריסות נוספות. `final` על מחלקה אוסר גזירה נוספת.
:::

הקריאה, כפי שההרצאה מציירת אותה: טוענים את ה-`vptr` של האובייקט, מאנדקסים את הפונקציה ב-vtable, וקוראים לכתובת הזאת. `Filter*` שבאמת מצביע על `BlurFilter` עדיין מוצא את `BlurFilter::apply` אם `apply` הוא virtual.

```cpp
struct Filter {
    virtual void apply(Image& img) const { std::cout << "Apply Filter\n"; }
    virtual ~Filter() = default;
};
struct BlurFilter : Filter {
    void apply(Image& img) const override { std::cout << "Apply BlurFilter\n"; }
};
const Filter* p = new BlurFilter();
p->apply(img);     // prints "Apply BlurFilter"
```

![אובייקט BlurFilter מחזיק vptr. הקריאה עוקבת אחריו אל ה-vtable של המחלקה ומוצאת את BlurFilter::apply](../assets/figures/vtable-call.svg)

### המרה למטה (downcast) והדיסטרקטור (destructor) הווירטואלי

המרה למטה הופכת מצביע של הבסיס בחזרה למצביע נגזר. המרה בסגנון C מנסה יותר מדי המרות ותקבל גם שטות כמו `(BlurFilter*)3`. `static_cast` נבדק בזמן הידור ועדיין סומך עליכם בזמן ריצה. `dynamic_cast` מסתכל ב-vtable ומחזיר null (עבור מצביע) כשהאובייקט אינו מהטיפוס הנגזר הזה. הוא צריך טיפוס פולימורפי. `const_cast` מוסיף או מסיר `const`. `reinterpret_cast` מפרש מחדש את הביטים.

:::theorem id=thm-virtual-dtor title="דיסטרקטור וירטואלי" source="materials/lectures/Chapter 6 - Inheritance.pptx"
אם מחלקה פולימורפית, הדיסטרקטור שלה חייב להיות virtual. זה נשאר נכון גם כשהמחלקה הנגזרת לא מוסיפה שדות משלה. אחרת `delete` דרך מצביע של הבסיס הוא התנהגות לא מוגדרת (undefined behavior): ייתכן שהדיסטרקטור של הנגזרת לא ירוץ, והזיכרון עשוי להשתחרר בגודל הלא נכון.

:::proof
**אינטואיציה.** `delete p` חייב לדעת את האובייקט האמיתי, לא את הטיפוס שכתוב על המצביע. ה-vtable הוא איך כל קריאה וירטואלית אחרת יודעת. הדיסטרקטור הוא הקריאה הזאת לסוף חיי האובייקט.

**הוכחה.** `Filter* p = new BlurFilter(...); delete p;` מחפש את הדיסטרקטור באותה דרך שהוא מחפש את `apply`, אבל רק אם `~Filter` הוא virtual. אם הוא לא, הטיפוס הסטטי מנצח: `~Filter` רץ, `~BlurFilter` לא, ואיבר ש-`BlurFilter` הקצה דולף. ההרצאה גם מזהירה שהמקצה עשוי לשחרר רק `sizeof(Filter)` בתים. הכרזה `virtual ~Filter() = default;` שמה את הדיסטרקטור ב-vtable, כך ש-`delete p` מגיע ל-`~BlurFilter` ואז לבסיס.

**על מה ההוכחה נשענה.** קשירה דינמית, והעובדה שלמחלקה פולימורפית כבר יש vptr. למחלקה בלי פונקציות וירטואליות אין vtable לשים בו דיסטרקטור, ולכן הכלל מנוסח למחלקות פולימורפיות.
:::
:::

פונקציה וירטואלית טהורה (pure virtual) נכתבת `= 0` ואין לה גוף שחייבים לקרוא לו. מחלקה שיש בה אחת היא מופשטת (abstract): אי אפשר ליצור ממנה מופע. זו הצורה של C++ למתודה מופשטת של Java, שגם תרגול 3 מציין. בנאים לא יכולים להיות virtual. פונקציה וירטואלית לא יכולה להיות `static`. החתימה ב-override חייבת להתאים, אחרת הצללתם את פונקציית הבסיס במקום לדרוס אותה.

אובייקט של מחלקה נגזרת הוא בלוק אחד: קודם תת-האובייקט של הבסיס (subobject), ואז האיברים הנגזרים. הטבלה בהרצאה ל-`BlurFilter` על המחסנית (stack) מראה את `_str` ליד שדות הבסיס, הקצאה אחת, לא שני אובייקטים.

## מעקב אחרי קריאה

| ביטוי | טיפוס סטטי | הפונקציה שרצה אם `apply` הוא virtual | אם הוא לא |
| --- | --- | --- | --- |
| `filter.apply(img)` | `Filter` | `Filter::apply` | `Filter::apply` |
| `blur.apply(img)` | `BlurFilter` | `BlurFilter::apply` | `BlurFilter::apply` |
| `Filter* p = &blur; p->apply(img)` | `Filter` | `BlurFilter::apply` | `Filter::apply` |

:::problem id=worked-virtual-call title="קריאה וירטואלית" source="materials/lectures/Chapter 6 - Inheritance.pptx" kind=worked solution_origin=source
`apply` הוא virtual. איזו פונקציה רצה, ומה משתנה אם מסירים את `virtual`?

```cpp
Filter* filter = new BlurFilter();
filter->apply(img);
```

:::solution
עם `virtual`, הקריאה טוענת את ה-vptr של אובייקט ה-`BlurFilter` וקוראת ל-`BlurFilter::apply`. הפלט בשקף הוא «Apply BlurFilter».

```text
filter->apply(img)
    load the vptr from the BlurFilter object
    index apply in that vtable
    call BlurFilter::apply
```

בלי `virtual`, המהדר קושר את `Filter::apply` לפי טיפוס המצביע, והפלט הוא «Apply Filter». האובייקט לא השתנה. הקשירה כן.
:::
:::

:::check id=chk-virtual-dtor
אתם הולכים לבצע `delete` ל-`BlurFilter` דרך `Filter*`. מה חייב להיות נכון לגבי `~Filter`?

- [ ] הוא חייב להיות וירטואלי טהור ובלי גוף
- [x] הוא חייב להיות virtual
- [ ] הוא חייב להיות private

הדיסטרקטור של הנגזרת חייב לרוץ. רק דיסטרקטור וירטואלי משוגר דרך ה-vptr.
:::

:::trap
הצללה אינה override. `apply` נגזר שלא סומן virtual, על בסיס שאינו virtual, לא משנה קריאות דרך מצביע של הבסיס. `override` הופך את הטעות הזאת לשגיאת הידור.
:::

:::trap
ירושה public של טיפוס שהפעולות שלו שוברות את השמורה שלכם אינה ניצלת על ידי override הדוק יותר. ה-`crop` של תמונת הריבוע הוא הדוגמה של ההרצאה.
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
