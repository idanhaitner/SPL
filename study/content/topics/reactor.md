---
id: reactor
title: Reactor
sources:
  - "materials/lectures/Chapter 11 - Reactor.pptx"
  - "materials/sessions/SPL_PS10.pptx"
  - "materials/sessions/SPL_PS11.pptx"
  - "materials/exams/15-a.pdf"
  - "materials/exams/15-a-solution.pdf"
  - "materials/exams/16-b.pdf"
  - "materials/exams/16-b-solution.pdf"
  - "materials/exams/17-a.pdf"
  - "materials/exams/17-a-solution.pdf"
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
  - "materials/exams/24-a.pdf"
  - "materials/exams/24-a-solution.pdf"
  - "materials/exams/24-b.pdf"
  - "materials/exams/24-b-solution.pdf"
  - "materials/exams/24-c.pdf"
  - "materials/exams/24-c-solution.pdf"
---

תבנית העיצוב Reactor מיועדת למימוש שרתים סקלאביליים המטפלים במספר רב של חיבורים מקביליים, באמצעות קלט/פלט ללא חסימה (Non-blocking I/O) מבוסס אירועים.

## השוואת ארכיטקטורות שרתים

1. **חוט-לכל-לקוח (Thread-per-Client):** מנהל חוט נפרד לכל חיבור. אינו סקלאבילי עבור אלפי חיבורים בשל צריכת זיכרון גבוהה למחסניות ועלויות context switch.
2. **Reactor Pattern:** חוט יחיד (Selector Thread) ממתין לאירועי רשת מרובים (`OP_ACCEPT`, `OP_READ`, `OP_WRITE`). עבודת עיבוד הפרוטוקול הכבדה מועברת למאגר חוטי עבודה (Worker Thread Pool).

:::definition id=def-reactor title="רכיבי Java NIO ב-Reactor" source="materials/lectures/Chapter 11 - Reactor.pptx"

- **`Selector`:** רכיב הממתין באופן יעיל לאירועי קלט/פלט מרובים על גבי ערוצים רשומים.
- **`ServerSocketChannel` / `SocketChannel`:** ערוצי תקשורת הניתנים להגדרה במצב ללא חסימה (`configureBlocking(false)`).
- **`SelectionKey`:** מייצג את הרישום של ערוץ מול ה-Selector והאירועים שמוכנים לטיפול (`readyOps()`).
- **`ByteBuffer`:** חוצץ זיכרון לקריאה וכתיבה.
:::

![לולאת ה-Reactor: חוט selector אחד, מפתחות מוכנים, ומאגר רק לעבודת הפרוטוקול](../assets/figures/reactor-loop.svg)

## שימוש נכון ב-ByteBuffer

המחלקה `ByteBuffer` מנהלת שלושה מצביעים: `position`, `limit`, ו-`capacity`.

```java
ByteBuffer buf = ByteBuffer.allocate(1024);
channel.read(buf);   // Read bytes from channel into buffer (position advances)
buf.flip();          // Prepare for reading from buffer: limit = position, position = 0
channel.write(buf);  // Write bytes from buffer to channel
buf.clear();         // Reset buffer for writing: position = 0, limit = capacity

```

![לפני flip החלון הקריא ריק כי position כבר בסוף הנתונים. flip מחזיר את limit לאותו סוף ואת position ל-0](../assets/figures/buffer-flip.svg)

:::trap
השארת דגל `OP_WRITE` דלוק ב-`SelectionKey` כאשר אין נתונים מוכנים למשלוח תגרום ל-`select()` לחזור מיד בלולאה אינסופית (Busy Waiting). יש להדליק את `OP_WRITE` רק כאשר קיימים נתונים בתור הכתיבה, ולכבותו בגמר המשלוח.
:::

:::problem id=worked-flip title="היפוך חוצץ" source="materials/sessions/SPL_PS10.pptx" kind=worked solution_origin=source
רוצים לכתוב את 5 הבתים שזה עתה נקראו. מה `flip` משנה?

```java
ByteBuffer buf = ByteBuffer.allocate(16);
channel.read(buf);    // position == 5, limit == 16
buf.flip();
channel.write(buf);
```

:::solution
`flip` קובע את limit ל-5 ואת position ל-0. `channel.write(buf)` שאחריו כותב את חמשת הבתים. ה-capacity עדיין 16. שכחת `flip` כותבת מ-position 5 עד limit 16, שזה הזנב הריק, ואינה שולחת דבר מועיל. קריאה ל-`flip` פעמיים קובעת את limit ל-0.
:::
:::

:::check id=chk-write-interest
תור הכתיבה של ערוץ ריק, ו-`OP_WRITE` עדיין דלוק. מה חוט ה-selector עושה?

- [ ] הוא נחסם ב-`select` עד שהלקוח שולח בית
- [x] הוא מסתובב, כי הערוץ כבר מוכן לכתיבה
- [ ] הוא סוגר את הערוץ

ערוץ שיש מקום בחוצץ השליחה שלו הוא מוכן לכתיבה. `select` חוזר מיד. ההרצאה קוראת לזה סיבוב עסוק. נקו את `OP_WRITE` עד שקריאה מאוחרת יותר תעמיד תשובה בתור.
:::

## תרגול

:::problem id=ps10-flip title="position אחרי flip" source="materials/sessions/SPL_PS10.pptx" kind=exercise solution_origin=source
חוצץ עבר `clear` בקיבולת 8, ואז `put` של שלושה בתים. תנו position ו-limit לפני `flip` ואחרי `flip`. אחר כך אמרו איזה טווח `write` לערוץ ישלח.

:::hint
`clear` קובע position ל-0 ו-limit שווה ל-capacity.
:::
:::hint
`put` מקדם את position ואינו מזיז את limit.
:::
:::hint
`flip` הוא מה שהופך חוצץ מ"כתבתי" ל"קרא את מה שכתבתי".
:::
:::solution
אחרי `clear`: position 0, limit 8, capacity 8. אחרי שלושה `put`: position 3, limit 8, capacity 8. אחרי `flip`: position 0, limit 3, capacity 8. `channel.write` שולח את הבתים ב-`[position, limit)`, כלומר את שלושת הבתים. החמישה האחרים מחוץ ל-limit ואינם נשלחים.
:::
:::

:::problem id=ps11-actor-order title="סדר משימות" source="materials/sessions/SPL_PS11.pptx" kind=exercise solution_origin=source
לקוח שולח הודעה M1 ואחר כך M2. השרת יוצר משימות R1 ו-R2. למה מאגר חוטים רגיל יכול להריץ את R2 לפני R1, ומה מאגר ה-actors משנה?

:::hint
למאגר יש הרבה עובדים. שתי משימות שהוגשו יכולות להתחיל על שני עובדים.
:::
:::hint
התמונה במפגש היא תור אחד לכל לקוח, לא תור אחד לכל השרת.
:::
:::hint
התכונה שרוצים היא סדר ללקוח אחד, לא שרת חוט אחד.
:::
:::solution
`execute(R1)` ו-`execute(R2)` הן שתי משימות. מאגר עם שני עובדים פנויים יכול להתחיל את R2 קודם. שום דבר במאגר רגיל אינו זוכר ששתי המשימות שייכות לערוץ אחד.

מאגר actors שומר תור ללקוח הזה ולא יתחיל את R2 בזמן ש-R1 עדיין רץ לאותו actor. לקוחות שונים עדיין רצים במקביל, על חוטי המאגר. חוט ה-selector רק מכניס לתור. לכן מפגש 11 אומר שמאגר רגיל אינו מספיק לפרוטוקול שמניח הודעות לפי הסדר.
:::
:::

:::problem id=ps11-write-interest title="עניין כתיבה" source="materials/sessions/SPL_PS11.pptx" kind=exercise solution_origin=source
אלה ארבע טעויות של Reactor. בחרו את זו ששורפת ליבה בזמן שאף לקוח אינו שולח, ואמרו את שינוי ה-`interestOps` שעוצר אותה.

1. `OP_WRITE` נשאר דלוק כשתור הכתיבה ריק.
2. קריאה בלי חסם, כך שהחוצצים גדלים בלי גבול.
3. עבודה כבדה או חוסמת על חוט ה-selector.
4. קריאה ל-`interestOps` מחוט שאינו חוט ה-selector.

:::hint
`select` חוזר מיד כשעניין רשום כלשהו כבר אמיתי.
:::
:::hint
שקע שאינכם כותבים אליו כרגע עדיין מוכן לכתיבה אם לחלון ה-TCP יש מקום.
:::
:::hint
הדגל שצריך לנקות הוא `OP_WRITE`, לא `OP_READ`.
:::
:::solution
השארת `OP_WRITE` על ערוץ מובטל היא הסיבוב העסוק. הערוץ מוכן לכתיבה, ולכן `select` לעולם אינו נחסם. אחרי שנכתב הבית האחרון שבתור, החזירו את העניין ל-`OP_READ` בלבד:

```java
key.interestOps(SelectionKey.OP_READ);
```

הדליקו את `OP_WRITE` שוב רק כשתשובת פרוטוקול הועמדה בתור ו-`write` לא קיבל כל בית. את הקריאה הזו ל-`interestOps` עושים על חוט ה-selector. ההרצאה מונה `interestOps` מחוט אחר כבאג נפרד.
:::
:::

:::examnote
השאלה עורכת את ה-Reactor מהנספח: מזיזה את המיסגור מה-selector, מגבילה עבודה לכל לקוח, מוסיפה יומן, או משרתת שאילתת בסיס נתונים בלי לחסום את `select`. המלכודת היא לעשות את הקריאה הכבדה על חוט ה-selector, או להעיר את `select` לנצח על ידי השארת `OP_WRITE` דלוק.
:::

:::problem id=exam-15a-q3 title="Reactor על UDP" source="materials/exams/15-a.pdf" kind=exam solution_origin=source
השאירו את ה-Reactor, אבל דברו עם כל לקוח דרך `DatagramSocketChannel` אחד במקום `SocketChannel` של TCP לכל לקוח. `send` ו-`receive` הם ללא חסימה וחוזרים מיד. `receive` מחזיר את כתובת השולח, או null אם לא הגיע דבר.

א. אמרו אילו מתודות אתם משנים. אל תכתבו מחדש מתודות שאתם משאירים.
ב. נקבו ביתרון אחד ובחיסרון אחד של UDP כאן. האם `DatagramSocketChannel` אחד יכול להחליף את הערוצים שלכל לקוח? האם ערוץ לכל לקוח עוזר?

:::hint
אין חיבור שצריך לקבל. ל-`ConnectionAcceptor` אין מה לעשות.
:::
:::hint
את התשובה צריך לשלוח לכתובת ש-`receive` החזיר. שמרו את הכתובת הזו עם החוצץ היוצא.
:::
:::hint
הפתרון הרשמי מוחק את ערוץ שקע השרת ואת ה-acceptor, ורושם את ערוץ הדטגרם לקריאה ולכתיבה.
:::
:::solution
א. כמו בפתרון הרשמי: מסירים את `ServerSocketChannel` ואת `SocketChannel`, יוצרים `DatagramSocketChannel` אחד ללא חסימה שקשור לפורט, ורושמים אותו ל-`OP_READ | OP_WRITE`. מוחקים את `ConnectionAcceptor`. `ConnectionHandler` אחד קורא ל-`receive` ללא חסימה לתוך `ByteBuffer` ולומד את ה-`SocketAddress`. משימות הפרוטוקול חייבות לשאת את הכתובת הזו, ו-`write` שולח דרך ערוץ הדטגרם אל הכתובת השמורה. תור הפלט מחזיק זוגות `(address, buffer)`, לא חוצצים עירומים.

ב. UDP נמנע מה-handshake ומשקע לכל לקוח, והוא יכול לאבד דטגרמים או לשנות את סדרם. ערוץ אחד הוא מה שהעיצוב משתמש בו, כי ל-UDP אין חיבור שאפשר לפצל עם `accept`; הכתובת המרוחקת היא מפתח הפיצול. ערוץ לכל לקוח מוסיף מצב שהפרוטוקול אינו צריך ואינו עושה את המסירה לאמינה.
:::
:::

:::problem id=exam-16b-q3 title="הוגנות של executor" source="materials/exams/16-b.pdf" kind=exam solution_origin=derived
ה-executor של ה-Reactor בוחר משימה בלי להתחשב בכמה בתים הלקוח הזה כבר העביר, ובלי להתחשב בכמה בקשות של הלקוח הזה כבר קיבלו שירות. לקוח עסוק יכול להיבחר לנצח.

א. תנו תרחיש קצר אחד לכל אי-הוגנות.
ב. ממשו שתי מדיניות: להעדיף את הלקוח עם הכי מעט בתים עד כה, ולהעדיף את הלקוח עם הכי מעט בקשות עד כה. מותר להכניס `PriorityBlockingQueue` שהסדר שלו הוא `compareTo` בזמן `enqueue`. אל תעתיקו את כל ה-Reactor.

:::hint
חוט ה-selector אינו המקום לסרוק כל לקוח בכל אירוע. התור של ה-executor הוא המקום.
:::
:::hint
עדיפות שמחושבת רק ב-enqueue מתיישנת. אמרו זאת אם אתם עדיין משתמשים בתור הזה.
:::
:::hint
כל מדיניות היא מפתח השוואה שנשמר על המשימה: בתים, או מספר בקשות.
:::
:::solution
א. לקוח A שלח העלאה ענקית אחת ולקוח B שלח כמה בתים. אם ה-executor תמיד מעדיף את A, אז B ממתין מאחורי לקוח שכבר צרך את רוב רוחב הפס. בנפרד, ללקוח A היו אלף בקשות וללקוח B הייתה אחת. אם התור הוא FIFO בין משימות מוכנות, A נשאר מקדים פשוט כי הוא מגיע לעתים קרובות יותר, ומספר הבקשות של B נשאר הקטן בזמן ש-A מקבל שירות שוב.

ב. שמים משימות בתור שמסודר לפי ספירת הבתים של הלקוח, בסדר עולה, למדיניות הראשונה, ולפי ספירת הבקשות שקיבלו שירות למדיניות השנייה. העובד לוקח את המינימום. מעדכנים את המונים של הלקוח כשמשימה מסתיימת, ומכניסים לתור את המשימה הבאה של הלקוח הזה עם המפתח החדש. `PriorityBlockingQueue` שמקפיא את `compareTo` בהכנסה לא יזיז משימה כשהמונה משתנה אחר כך; או שמכניסים מחדש, או שמתעדים שהמפתח הוא הספירה בזמן ההכנסה, וזה עדיין מונע מלקוח כבד חדש לגמרי לקפוץ לפני לקוח שהמתין עם ספירה נמוכה. חוט ה-selector רק מכניס לתור. הוא אינו מריץ את הפרוטוקול.
:::
:::

:::problem id=exam-17a-q3 title="מי ממסגר" source="materials/exams/17-a.pdf" kind=exam solution_origin=derived
היום חוט ה-selector קורא `ByteBuffer` וחוט מאגר ממסגר ומריץ את ההודעה. סטודנט רוצה שגם חוט ה-selector ימסגר, ויגיש `Runnable` אחד לכל הודעה.

א. החילו את השינוי.
ב. הראו ריצה שבה השינוי מזיק.
ג. ממשו `ioThroughput` ו-`compThroughput` לשני השלבים.

:::hint
מיסגור על חוט ה-selector הוא בדיוק טעות "עבודה כבדה על חוט ה-I/O" כשההודעה גדולה.
:::
:::hint
הנזק הוא ש-`accept` וקריאות של לקוחות אחרים ממתינים מאחורי מיסגור של חוצץ ענק אחד.
:::
:::hint
תפוקה היא בתים, או הודעות, לשנייה בכל שלב. סופרים אותם במקום שבו השלב רץ.
:::
:::solution
א. במסלול הקריאה, אחרי `channel.read`, מריצים את לולאת הממסגר על חוט ה-selector. כל הודעה שלמה הופכת ל-`Runnable` שמוגש ל-executor. המאגר כבר אינו רואה בתים גולמיים.

ב. לקוח אחד שולח חוצץ גדול שמתמסגר להרבה הודעות, או ממסגר שסורק מגה-בית. חוט ה-selector עושה את הסריקה הזו לפני שהוא חוזר ל-`select`. `accept` ו-`read` של לקוחות אחרים ממתינים. תחת הפיצול הישן, ה-selector חזר ל-`select` אחרי ההעתקה, והמאגר עשה את הסריקה.

ג. `ioThroughput` הוא בתים שנקראו ועוד בתים שנכתבו על חוט ה-selector, מחולקים בזמן שחלף, עם מונים שעולים ליד `read` ו-`write`. `compThroughput` הוא הודעות ש-`process` של הפרוטוקול שלהן חזר, מחולקות בזמן שחלף, והמונה עולה במשימת המאגר. הם שלבים שונים, ולכן פרוטוקול איטי מוריד את `compThroughput` בזמן ש-`ioThroughput` נשאר גבוה, וזה הפיצול שהשאלה רוצה שיהיה גלוי.
:::
:::

:::problem id=exam-18a-q3 title="selector רווי" source="materials/exams/18-a.pdf" kind=exam solution_origin=derived
חוט ה-selector רווי.

א. שרגא אומר: הוסיפו עובדים למאגר ה-actors, והעבירו את השרת למכונה עם יותר מעבדים, כדי להוריד עומס מה-selector. האם זה עובד?
ב. הצוות של נחום מוסיף במקום זה יכולת ל-Reactor. נמקו את התיקון בצד ה-selector.

:::hint
לולאת ה-selector היא חוט אחד לפי התכנון. עוד חוטי מאגר אינם מריצים את `select`.
:::
:::hint
מעבד שני אינו מפצל חוט אחד.
:::
:::hint
הדרך החוקית להקל על ה-selector היא להוציא ממנו עבודה, וזה ההפך מהניחוש של שרגא אם העבודה כבר במאגר.
:::
:::solution
א. לא. `select`, `accept`, `read`, ו-`write` רצים על חוט ה-selector האחד. חוטי actor נוספים מריצים משימות פרוטוקול. אם המעבד נמצא בתוך `select` וההעתקות, החוטים האלה יושבים בטלים. מכונה גדולה יותר אינה מפצלת חוט אחד מעצמה. השינוי של שרגא עוזר רק כשהמאגר הוא החלק הרווי. השאלה אומרת שה-selector הוא החלק הרווי.

ב. השאירו את לולאת ה-selector למוכנות ולהעתקות בתים. הוציאו ממנה את המיסגור וכל כתיבת יומן. אם חוט אחד עדיין אינו יכול להעתיק בתים מהר מספיק, פצלו ערוצים בין כמה Reactors, לכל אחד selector משלו ופורט משלו או תת-קבוצה משלו של ערוצים. אל תיקחו את מנעול ה-selector על חוטי המאגר.
:::
:::

:::problem id=exam-18b-q3 title="מדידה מטעה" source="materials/exams/18-b.pdf" kind=exam solution_origin=derived
שרגא מודד שרת חוט-לכל-לקוח ו-Reactor על ידי שליחת כמה בקשות מהמחשב הנייד שלו. שרת חוט-לכל-לקוח עונה מהר יותר, ולכן הוא אומר לחברה לעבור. נחום אומר שהמסקנה שגויה. הסבירו את נחום, כולל מה המדידה לא לחצה.

:::hint
קומץ לקוחות לעולם אינו עושה את יצירת החוטים או את המחסניות החסומות לצוואר הבקבוק.
:::
:::hint
היתרון של Reactor מופיע כשהרבה חיבורים מובטלים ומעטים פעילים.
:::
:::hint
השהיה של לקוח אחד ותפוקה תחת הרבה לקוחות הן מדידות שונות.
:::
:::solution
מספר הלקוחות של שרגא קטן מדי כדי לשלם על חוט לכל חיבור, והבקשות שלו סדרתיות מספיק כדי שעיצוב הקבלה-וחסימה לעולם לא יחזיק אלף מחסניות שחונות ב-`read`. חוט אחד לכל לקוח אפילו יכול להיות מהיר יותר שם, כי הפרוטוקול רץ על החוט של החיבור בלי מסירה למאגר. Reactor משלם על `select`, על חוצצים, ועל התור.

נחום צודק שהמסקנה אינה עוברת לעומס של החברה. תחת הרבה חיבורים שרובם מובטלים, שרת חוט-לכל-לקוח נגמר לו הזיכרון על מחסניות, ותחת פרץ הוא יוצר חוטים בלי תקרה. Reactor שומר חוט selector אחד ומאגר חסום. מדידה הוגנת מחזיקה אלפי חיבורים פתוחים ומודדת כמה בקשות לשנייה שורדות, לא את ההשהיה של חמש בקשות ממחשב נייד.
:::
:::

:::problem id=exam-19a-q3 title="הבטחות של מאגר actors" source="materials/exams/19-a.pdf" kind=exam solution_origin=derived
מאגר ה-actors מבטיח שני דברים לכל חיבור: לכל היותר בקשה אחת רצה בכל רגע, ואם בקשה 1 הגיעה לפני בקשה 2 אז תשובה 1 נשלחת לפני תשובה 2.

א. הסבירו איך המאגר עושה זאת, ונקבו בתור.
ב. שינוי שפוגע בביצועים.
ג. שינוי שבאמת הייתם רוצים.

:::hint
משימה פעילה אחת לכל לקוח היא ההבטחה הראשונה. תור לכל לקוח הוא השנייה.
:::
:::hint
ה-selector חייב להכניס לתור לפי סדר ההגעה ואסור לו להתחיל את המשימה בעצמו.
:::
:::hint
התשובה נכתבת על חוט ה-selector מתוך תור, ולכן סדר הסיום של המשימות הוא סדר השליחה רק אם המשימות התחילו לפי הסדר וכל אחת מעמידה את תשובתה בתור לפני שהמשימה הבאה רצה.
:::
:::solution
לכל לקוח יש תור בקשות ודגל או שרשרת שמשמעותם "משימה ללקוח הזה כבר נמצאת במאגר". ה-selector מכניס הגעה לתור ומגיש משימת מאגר רק כשהשרשרת הייתה מובטלת. המשימה מריצה את הפרוטוקול עבור בקשת הראש, מעמידה את בתי התשובה בתור כדי שה-selector יכתוב אותם, ואז מתחילה את הבקשה הבאה של אותו לקוח אם התור אינו ריק. שתי בקשות של לקוח אחד לכן לעולם אינן רצות יחד, והן רצות לפי סדר ההגעה, ולכן התשובות מועמדות בתור לפי הסדר הזה. ה-selector כותב אותן לפי סדר התור.

שינוי שפוגע: הגשת כל בקשה למאגר משותף בלי שרשרת לכל לקוח. תפוקת המאגר עולה והבטחת הסדר מתה. שינוי שכדאי לעשות: להשאיר את השרשרת, ולא להקצות `Runnable` חדש לכל הודעה אם אותו עובד יכול למשוך את הבקשה הבאה בעצמו. זו העריכה שבה אותו עובד מושך את הבקשה הבאה, והיא שומרת על שתי ההבטחות.
:::
:::

:::problem id=exam-19b-q3 title="הבקשה הבאה על אותו עובד" source="materials/exams/19-b.pdf" kind=exam solution_origin=derived
שנו את `execute` ואת `complete` כך שכשעובד מסיים בקשה הוא מריץ את הבקשה הממתינה הבאה של אותו לקוח על אותו עובד, בלי `Runnable` חדש, עד שתור הלקוח הזה ריק. שמרו על הפיצול של Reactor: ה-selector עושה קלט-פלט, העובדים עושים פרוטוקול.

:::hint
הלולאה שייכת לעובד, אחרי `process`, לא בתוך `select`.
:::
:::hint
התור לכל לקוח הוא מה ש-`complete` היה מתזמן. משכו ממנו ישירות.
:::
:::hint
אל תחזיקו מנעול לקוח בזמן קריאה לפרוטוקול אם הפרוטוקול יכול לחזור אל Reactor.
:::
:::solution
`execute` עדיין מגיש משימה אחת כשהלקוח היה מובטל. ה-`run` של המשימה הזו הוא לולאה: קחו את ההודעה הבאה תחת מנעול הלקוח, שחררו את המנעול, קראו ל-`protocol.process`, העמידו את התשובה בתור, ואז נסו שוב. כשהתור ריק, נקו את דגל "רץ". אם הודעה חדשה הגיעה אחרי שהדגל נוקה, ה-selector מגיש משימה חדשה אחת, כמו קודם. לא מוקצה `Runnable` שני להודעה שכבר הייתה בתור בזמן שהעובד היה חי. תשובות עדיין יוצאות דרך תור הכתיבה, ולכן חוט ה-selector נשאר החוט היחיד שנוגע ב-`interestOps` ובערוץ.
:::
:::

:::problem id=exam-20a-q3 title="יומן שלא חוסם" source="materials/exams/20-a.pdf" kind=exam solution_origin=derived
הוסיפו תיעוד של פעולות השרת ל-Reactor. `Logger` עוטף `OutputStream`. אמרו לאן כל קריאת יומן הולכת כדי שחוט ה-selector לא ייחסם על הדיסק, וכדי ששני עובדים לא יקרעו שורת יומן.

:::hint
שורת יומן היא חוצץ, כמו תשובת לקוח. אפשר להעמיד אותה בתור.
:::
:::hint
`synchronized` על ה-logger, או חוט logger אחד, עושים את השורות אטומיות.
:::
:::hint
אל תקראו ל-`OutputStream.write` בתוך `select`.
:::
:::solution
עובדים וה-selector מעמידים שורה גמורה, `byte[]`, על `BlockingQueue` שבבעלות ה-logger. חוט logger יחיד עושה `take` וכותב לזרם. השורות נשארות שלמות כי חוט אחד כותב אותן. ה-selector לעולם אינו נחסם על הדיסק. אם התור חסום, תור מלא משליך שורות יומן או סופר אותן; הוא אינו עושה `put` מחוט ה-selector, כי זה היה עוצר את `select`. מתודות `Logger` שעובדים קוראים להן רק מעמידות בתור. הן אינן מעצבות וכותבות תחת מנעול שמוחזק לאורך דיסק איטי.
:::
:::

:::problem id=exam-24a-q3 title="חוטי תקשורת" source="materials/exams/24-a.pdf" kind=exam solution_origin=derived
סטודנט משנה את `Reactor.handleReadWrite` כך שימסור את המפתח המוכן אל `Executors.newFixedThreadPool(2)` בשם `communicationThreads`.

הסבירו למה שני חוטי תקשורת שקוראים ל-`handleReadWrite` על המפתחות של אותו selector אינם בטוחים, ואיזו עבודה, אם בכלל, מותר להעביר למאגר הזה. השאלה ממשיכה לבסיס נתונים; שמרו קודם על תקינות ה-selector.

:::hint
`SelectionKey` ו-`Selector` מתועדים לשימוש של חוט אחד. `interestOps` משני חוטים הוא מרוץ.
:::
:::hint
`selectedKeys` אינו אוסף מקבילי.
:::
:::hint
המאגר יכול להריץ את הפרוטוקול. אסור לו להריץ את `select` או את `interestOps`.
:::
:::solution
`selector.selectedKeys()`, `key.interestOps`, ו-`channel.read` שנרשמו על ה-selector הזה הם העבודה של חוט ה-selector. שני חוטי מאגר שמושכים מפתחות רצים על קבוצת המפתחות ויכולים לשנות עניין בזמן ש-`select` משתמש בה. ה-selector יכול לזרוק או לפספס אירוע. כתיבה וקריאה על אותו ערוץ משני חוטים גם קורעות את ה-`ByteBuffer` שהמטפל מחזיק.

השאירו את `select`, את `accept`, את `read`, את `write`, ואת `interestOps` על חוט אחד. המאגר של שניים, אם רוצים אותו, מקבל הודעה שכבר הועתקה ומריץ את הפרוטוקול, ואז מעמיד בתי תשובה בתור. זה מאגר ה-actors שכבר יש. להפנות את `handleReadWrite` עצמו אל מאגר של שניים זה השינוי שצריך לדחות. שאילתת בסיס נתונים שייכת למשימת הפרוטוקול הזו, לא ל-`handleReadWrite`, כדי ששאילתה איטית לא תעצור את `select`.
:::
:::

:::problem id=exam-24b-q3 title="שרת מחסן" source="materials/exams/24-b.pdf" kind=exam solution_origin=derived
מחסן לוגיסטי שומר מתנדבים, משפחות מפונות, ומנות מזון. `DB` בטוח לחוטים, יש לו בנאי ריק, ו-`executeQuery` מחזיר את הרשומות (record/row) או זורק `SQLException`.

בנו את `DBServer`: Reactor עם עשרה חוטי עבודה. לקוח שולח מחרוזת שאילתה. השרת מריץ אותה על ה-`DB` האחד ועונה ברשומה הראשונה, או ב-`"Result No"` כשאין רשומות, או בטקסט השגיאה כשהשאילתה זורקת. אל תבנו `DB` לכל חיבור.

:::hint
`DB` אחד נוצר ב-`main` ונתפס על ידי הפרוטוקול.
:::
:::hint
`executeQuery` היא הקריאה האיטית. היא רצה על חוט מאגר.
:::
:::hint
התשובה היא מחרוזת אחת. ה-selector כותב אותה. הפרוטוקול אינו נוגע בערוץ.
:::
:::solution
```java
public class DBServer {
    public static void main(String[] args) throws Exception {
        DB db = new DB();
        new Reactor(Integer.parseInt(args[0]), 10,
            () -> new DBProtocol(db),
            () -> new LineTokenizer()).serve();
    }
}
```

`DBProtocol.process` קורא ל-`db.executeQuery(msg)` בתוך try. על רשימה לא ריקה הוא מחזיר `rows.get(0)`. על רשימה ריקה הוא מחזיר `"Result No"`. על `SQLException` הוא מחזיר `e.getMessage()`. ה-Reactor מהכיתה מגיש את `process` למאגר של 10, ולכן שאילתה איטית אינה רצה על חוט ה-selector. `DB` בטוח לחוטים, ולכן עשרה עובדים רשאים לקרוא לו. בנייה שלו בתוך מפעל הפרוטוקול הייתה בונה בסיס נתונים אחד לכל חיבור, והשאלה אוסרת זאת כי ההתנעה כבדה.
:::
:::

:::problem id=exam-24c-q3 title="תשובה מטיפוס אחר" source="materials/exams/24-c.pdf" kind=exam solution_origin=derived

א. שנו את תבנית השרת כך שלקוח שולח הודעה מטיפוס A ומקבל תשובה מטיפוס B. נקבו במקומות שאתם עורכים. אל תכתבו מחדש מחלקות שלמות.
ב. השלימו את `Command` ואת `RemoteCommandInvocationProtocol`.
ג. `DB.executeQuery` מחזיר `ArrayList<String>` ובטוח לחוטים. `DBServer` משתמש ב-`BaseServer` עם מאגר של 11 וב-`ObjectEncoderDecoder` שכבר קיים. `DB` אחד משרת כל לקוח.

:::hint
המקודד-מפענח גנרי. טיפוס הקלט של הפרוטוקול וטיפוס הפלט אינם חייבים להתאים.
:::
:::hint
אובייקט פקודה הוא מה שהמפענח מייצר. `execute` הוא מה שהפרוטוקול קורא לו.
:::
:::hint
אחת-עשרה הוא גודל המאגר שמועבר לשרת, לא אחד-עשר חוטי selector.
:::
:::solution
א. משנים את `MessagingProtocol<T>` ל-`MessagingProtocol<T, R>`, ו-`process` מחזיר `R`. מטפל החיבור קורא עם `MessageEncoderDecoder<T>` וכותב עם `MessageEncoderDecoder<R>`, או מפענח אחד שמבין את שניהם אם המחלקה בשאלה היא `MessageEncoderDecoder` יחיד. ארגומנטי הטיפוס של Reactor הולכים בעקבות זה. לולאת ה-selector אינה משתנה.

ב. `Command` הוא `R execute(Context ctx)`. `RemoteCommandInvocationProtocol` מחזיק את ההקשר המשותף, מפענח הודעה ל-`Command`, קורא ל-`execute`, ומחזיר את התוצאה כהודעת התשובה.

ג. `main` בונה `DB` אחד ו-`BaseServer` אחד עם גודל מאגר 11, מפעל פרוטוקול `() -> new RemoteCommandInvocationProtocol(db)`, ומפעל מקודד `ObjectEncoderDecoder::new`. `execute` של פקודת שאילתה קורא ל-`db.executeQuery`. הרשימה שחוזרת היא אובייקט התשובה. המקודד כותב אותה. חוט ה-selector לעולם אינו קורא ל-`executeQuery`.
:::
:::

Reactor מזיז בתים. [סיריאליזציה](topic:serialization) היא הדרך שבה הבתים האלה הופכים לאובייקט, ו[אחסון](topic:persistence) הוא בסיס הנתונים שמשימות הפרוטוקול האלה קוראות לו.
