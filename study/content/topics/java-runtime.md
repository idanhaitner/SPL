---
id: java-runtime
title: חזרה ל-Java
sources:
  - "materials/lectures/Chapter 7 - Back to Java.pptx"
  - "materials/notes/lecture-notes.docx.pdf"
  - "materials/sessions/SPL_PS5.pptx"
---

שפת Java רצה מעל מכונה וירטואלית (JVM), המאפשרת להריץ את אותו קוד בייטקוד (`.class`) על גבי מערכות הפעלה שונות.

## תהליך התרגול ב-Java

1. **קומפילציה לא מקוונת:** הקומפיילר (`javac`) מתרגם את קוד המקור (`.java`) לקובץ בייטקוד (`.class`). בשלב זה מבוצעות בדיקות טיפוסים, בקרת גישה ווידוא חריגות.
2. **הרצה בזמן ריצה:** ה-JVM טוען את קובצי ה-`.class` ומתרגם את הבייטקוד לקוד מכונה פיזי באמצעות מהדר JIT (Just-In-Time Compiler).

בניגוד ל-C++, ב-Java כל המתודות של אובייקטים הן וירטואליות כברירת מחדל (Dynamic Binding).

## מודל האחסון ב-Java

- **מחסנית (Stack):** מחזיקה משתנים מקומיים מטיפוסים פרימיטיביים (`int`, `boolean` וכו') ורפרנסים לאובייקטים.
- **ערימה (Heap):** מחזיקה את כל האובייקטים והמערכים, כולל השדות שלהם.

מערך ב-Java הוא אובייקט השמור בערימה ומחזיק את אורכו (`length`). מערך של אובייקטים מחזיק בערימה רפרנסים לאובייקטים אחרים.

![מערך int הוא בלוק אחד של int-ים בערימה. מערך String הוא בלוק של רפרנסים בערימה, וכל מחרוזת היא אובייקט נוסף](../assets/figures/java-array.svg)

## מנגנון החריגות (Exceptions)

:::definition id=def-exception title="סיווג חריגות ב-Java" source="materials/lectures/Chapter 7 - Back to Java.pptx"

- **חריגות בדוקות (Checked Exceptions):** יורשות מ-`java.lang.Exception` (למעט `RuntimeException`). מייצגות שגיאות צפויות (כגון קובץ לא נמצא). הקומפיילר מחייב לתפוס אותן (`try-catch`) או להצהיר עליהן בחתימת המתודה (`throws`).
- **חריגות שאינן בדוקות (Unchecked Exceptions):** יורשות מ-`RuntimeException`. מייצגות באגים בתוכנה (כגון `NullPointerException`, `IndexOutOfBoundsException`). אין חובה להצהיר עליהן.
- **שגיאות מערכת (Errors):** יורשות מ-`java.lang.Error`. מייצגות כשלים חמורים ב-JVM (כגון `OutOfMemoryError`). אין לתפוס אותן בקוד רגיל.
:::

בלוק `finally` מורץ תמיד בעת היציאה מבלוק `try`, בין אם נזרקה חריגה ובין אם לא. מנגנון `try-with-resources` מבטיח סגירה אוטומטית של משאבים המממשים את הממשק `AutoCloseable`.

:::problem id=worked-array-layout title="מערך על הערימה" source="materials/lectures/Chapter 7 - Back to Java.pptx" kind=worked solution_origin=source
מה על המחסנית, ומה על הערימה?

```java
int[] a = new int[10];
String[] b = new String[10];
b[0] = new String("Avi");
```

:::solution
`a` ו-`b` הם רפרנסים במסגרת של `main`. `a` מצביע על אובייקט מערך אחד בערימה ששומר כותרת, את האורך 10, ועשרה `int`. `b` מצביע על מערך אחד בערימה של עשרה רפרנסים. הרפרנסים האלה מתחילים ב-null. `b[0] = new String("Avi")` שומר אובייקט ערימה נוסף אחד בתא הראשון. עשר המחרוזות אינן בתוך הבלוק של `b`, ותשעת התאים האחרים נשארים null.
:::
:::

:::check id=chk-checked
מתודה קוראת ל-API שזורק `java.io.FileNotFoundException`, חריגה בדוקה. מה הקומפיילר דורש?

- [ ] כלום, כי רק `Error` הוא חובה
- [x] `try/catch` לחריגה הזאת, או פסקת `throws`
- [ ] בלוק `finally` ובלי `catch`

חריגות בדוקות הן חלק מטיפוס המתודה. חריגות לא-בדוקות ו-`Error` נשארות מחוץ לטיפוס.
:::

## תרגול

:::problem id=ps5-checked-exception title="חריגה בדוקה" source="materials/sessions/SPL_PS5.pptx" kind=exercise solution_origin=source
`FileNotFoundException` בדוקה. `ArithmeticException` אינה בדוקה. לכל אחת, אמור אם התוכנית מתקמפלת כשהקורא מתעלם ממנה, ולאן חריגה שנזרקה הולכת אם אף מסגרת אינה מטפלת בה.

:::hint
הטבלה של התרגול: חריגה לא-בדוקה מתקמפלת גם כשמתעלמים ממנה. חריגה בדוקה אינה מתקמפלת כשמתעלמים ממנה.
:::
:::hint
טיפול בחריגה בדוקה הוא `try/catch` או `throws` על המתודה.
:::
:::hint
תמונת מחסנית הקריאות נגמרת ב-JVM כשל-`main` אין מטפל.
:::
:::solution
התעלמות מ-`ArithmeticException` עדיין מתקמפלת. הטיפול בה אופציונלי, ובדרך כלל שגוי אם הכוונה לבאג שצריך לתקן. התעלמות מ-`FileNotFoundException` אינה מתקמפלת. המתודה חייבת לתפוס אותה או להצהיר `throws FileNotFoundException`, והקורא ניצב אז בפני אותה בחירה.

אם החריגה נזרקת ולאף מסגרת מאתר הזריקה ועד `main` אין `catch` מתאים, ה-JVM מסיים את התוכנית ומדווח את החריגה. בלוקי `finally` לאורך ההליכה הזאת עדיין רצים. try-with-resources סוגר את המשאב במסלול הזה; כישלון שני מ-`close` מדוכא ואינו מחליף את החריגה הראשונה.
:::
:::

הכלל שכל מתודת מופע ב-Java היא וירטואלית הוא הכלל ש[ירושה](topic:inheritance) נאלץ לבקש עם מילת המפתח `virtual`. בהמשך, [מקביליות](topic:concurrency) היא מה שקורה כשיותר מאחת מהמתודות האלה רצה בבת אחת.
