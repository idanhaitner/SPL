---
id: serialization
title: סיריאליזציה
sources:
  - "Classes/Chapter 12 - Serialization.pptx"
---

שרת התמונות ב-Reactor דיבר פרוטוקול פרטי: שם קובץ נכנס, בתי הקובץ יוצאים. השרת הבא שולח אובייקטים. אובייקט אינו מערך בתים עד שמשהו עובר על השדות (field) שלו וכותב אותם. ההליכה הזו היא סיריאליזציה (serialization).

## מה נכתב

:::definition id=def-serialization title="סיריאליזציה" source="Classes/Chapter 12 - Serialization.pptx"
סיריאליזציה היא ייצוג של אובייקט כרצף של בתים. היא כוללת את טיפוס האובייקט, את צורת השדות שלו, ואת ערכי השדות. דה-סיריאליזציה (deserialization) בונה אובייקט מחדש מהרצף הזה.

הזוג שומר שדות פרימיטיביים ושדות אובייקט. הוא יכול להעביר ערך בין מכונות ובין JVM-ים, והבתים יכולים לנוע בקובץ או על שקע (socket). מה שהוא אינו שומר הוא הזהות של אובייקט הערימה (heap) המקורי. תוצאת קריאת הבתים היא אובייקט חדש עם אותם ערכי שדות.
:::

`Serializable` הוא ממשק סימון (marker interface). אין לו מתודות. הוא דגל שה-JVM בודק. `ObjectOutputStream` ו-`ObjectInputStream` מסרבים לאובייקט שהמחלקה שלו אינה מממשת אותו.

```java
public final class Pet implements Serializable {
    public enum Type { DOG, CAT }
    public final String name;
    public final Type type;
    public final int age;
    public Pet(String name, Type type, int age) {
        this.name = name; this.type = type; this.age = age;
    }
}

Pet pet = new Pet(name, type, age);
try (var fileOut = Files.newOutputStream(path);
     var out = new ObjectOutputStream(fileOut)) {
    out.writeObject(pet);
}
try (var in = new ObjectInputStream(Files.newInputStream(path))) {
    Pet copy = (Pet) in.readObject();
}
```

קבוע ה-enum נכתב בשמו, ה-`String` בתווים שלו, ה-`int` בביטים שלו. בדרך חזרה, `readObject` מקצה `Pet` חדש. `copy == pet` הוא false. `copy.name.equals(pet.name)` הוא true.

![writeObject שומר את name ואת age ומדלג על ה-hash שהוא transient. readObject בונה Pet אחר שה-hash שלו מתחיל ב-null](../assets/figures/serialize-object.svg)

### מה מדלגים עליו

שדות סטטיים שייכים למחלקה, לא לאובייקט, ולכן אינם נכתבים. גם שדה שמסומן `transient` אינו נכתב. הדוגמה בהרצאה היא hash שמור במטמון:

```java
private transient Integer hash;
@Override public int hashCode() {
    if (hash == null) hash = compute();
    return hash;
}
```

אחרי דה-סיריאליזציה `hash` הוא null, וה-`hashCode` הבא מחשב אותו מחדש. זו הנקודה של `transient`: השדה הוא מטמון, או חוט (thread), או שקע, משהו שאין לו משמעות ב-JVM אחר. שכחה של `transient` על `Thread` או על `OutputStream` גורמת ל-`writeObject` לזרוק, כי האובייקטים האלה אינם `Serializable`.

### גרסאות

שינוי מחלקה שכבר `Serializable` הוא בעיית תאימות. כתבתם קובץ, אחר כך שיניתם את המחלקה, ואז ניסיתם לקרוא את הקובץ. `serialVersionUID` הוא מספר הגרסה שאתם מקצים כדי שה-JVM יוכל להבדיל בין המחלקות האלה. כלל האצבע של ההרצאה: זרם ישן קריא למחלקה החדשה רק כשהשינוי נמצא ברשימת התואמים.

תואם: הוספת שדה (הוא חוזר כברירת המחדל, `null` או `0` או `false`), שינוי `public` / `protected` / `private`, הוספת שדה `static` או `transient`, שינוי סדר השדות.

לא תואם: הסרה או שינוי הטיפוס של שדה שאינו `transient`, שינוי המחלקה בהיררכיה בדרכים שההרצאה מונה כשוברות. אי-התאמה של `serialVersionUID` מכשילה את הקריאה גם אם השדות היו מתאימים.

:::problem id=worked-transient-hash title="שדה transient" source="Classes/Chapter 12 - Serialization.pptx" kind=worked solution_origin=source
`pet` עבר סיריאליזציה אחרי ש-`hashCode` כבר מילא את המטמון. מה `hash` מכיל באובייקט ש-`readObject` מחזיר, ומה `name` מכיל?

```java
public final class Pet implements Serializable {
    public final String name = "A";
    private transient Integer hash;
}
```

:::solution
`name` הוא `"A"`, כי שדה אובייקט רגיל הוא חלק מהזרם. `hash` הוא null, כי שדות `transient` אינם נכתבים והאובייקט החדש מתחיל מברירת המחדל. ה-`hashCode` הראשון על העותק מחשב את המטמון מחדש. שני ה-`Pet` הם אובייקטים שונים.
:::
:::

:::check id=chk-marker
למה `class Pet` בלי `implements Serializable` נכשל ב-`writeObject`?

- [ ] כי ל-`Pet` אין מתודת `writeObject` משלו
- [x] כי `Serializable` הוא ממשק הסימון שהזרם בודק, והוא אינו מצהיר על מתודות
- [ ] כי מחלקות `final` אינן ניתנות לסיריאליזציה

ההרצאה קוראת ל-`Serializable` ממשק סימון: אין מתודות, והזרמים מסרבים לאובייקט בלעדיו.
:::

:::trap
שדה שמצביע על אובייקט שאינו ניתן לסיריאליזציה מכשיל את כל ה-`writeObject`, גם אם לא התכוונתם לשלוח את השדה הזה. סמנו אותו `transient` ושחזרו אותו אחרי הקריאה, או אל תצביעו עליו מאובייקט שניתן לסיריאליזציה.
:::

:::trap
הסתמכות על `serialVersionUID` המחושב אומרת שעריכה שנראית תמימה משנה את המזהה וקבצים ישנים מפסיקים להיטען. ההרצאה רוצה מזהה מפורש כשהמחלקה היא חלק מפרוטוקול.
:::

פרוטוקול Reactor יכול להעביר `MessageEncoderDecoder<Serializable>` סביב הבתים האלה. המקודד הוא `ObjectOutputStream` בדרך החוצה ו-`ObjectInputStream` בדרך פנימה, ממוסגר כך שהמפענח יודע מתי נתח זרם נגמר. [אחסון](topic:persistence) הוא הדרך האחרת לשמור אובייקט, וההרצאה נפתחת באמירה למה אוסף של קבצים שעברו סיריאליזציה הוא בסיס נתונים גרוע: אי אפשר לחפש שדה אחד בלי לקרוא כל אובייקט, עדכון כותב מחדש את כל הגרף, וטרנזקציות הן הבעיה שלכם.
