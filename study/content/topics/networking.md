---
id: networking
title: תקשורת
sources:
  - "materials/lectures/Chapter 10 - Networking.pptx"
  - "materials/sessions/PS9 2026.pptx"
  - "materials/sessions/SPL_PS10.pptx"
  - "materials/exams/15-b.pdf"
  - "materials/exams/15-b-solution.pdf"
  - "materials/exams/16-a.pdf"
  - "materials/exams/16-a-solution.pdf"
  - "materials/exams/17-b.pdf"
  - "materials/exams/17-b-solution.pdf"
  - "materials/exams/20-b.pdf"
  - "materials/exams/20-b-solution.pdf"
---

תהליך (process) אינו יכול לקרוא את הזיכרון של תהליך אחר. פרק 10 בתקשורת (networking) יוצא מהבידוד הזה, כולל המקרה של שני מחשבים, ובונה את הערוץ (channel) ששאר הקורס יתכנת מולו: פורט, שקע (socket), ובחירה בין TCP ל-UDP.

## שכבות

ההרצאה משתמשת במחסנית OSI מקוצרת של ארבע שכבות. כל שכבה מציעה שירות לזו שמעליה, מסתירה את המימוש שלה, ומדברת בפרוטוקול מוגדר.

| שכבה | תפקיד | יחידה |
| --- | --- | --- |
| גישה | ביטים על הכבל, תזמון, כרטיס הרשת והדרייבר שלו | מסגרת |
| אינטרנט | כתובות וניתוב | חבילה |
| תעבורה | מתהליך לתהליך | מקטע או דטגרם |
| אפליקציה | מה ההודעה אומרת | הודעה |

![ארבע השכבות שההרצאה משאירה: אפליקציה למעלה, אחר כך תעבורה, אינטרנט, וגישה](../assets/figures/network-layers.svg)

שכבת הגישה אינה יודעת מי האפליקציה. שכבת האינטרנט, IP, שמה על כל חבילה כתובת מקור וכתובת יעד. הכותרת נושאת אורכים, זיהוי, דגלים, ו-TTL (time to live) שהנתבים מורידים כדי שחבילה לא תסתובב בלולאה לנצח. נתב מחפש את הקפיצה הבאה בטבלה מקומית ומוסר את החבילה לשכבת הגישה. IP אינו מבטיח שהחבילה תגיע, או שתגיע לפי הסדר. DNS הופך שם לכתובת IP. NAT נותן לרשת פרטית לשתף כתובת ציבורית אחת.

הקורס אחר כך מתעלם מהתחתית ומתכנת את שתי השכבות העליונות.

:::definition id=def-host-port title="מארח, כתובת IP, פורט" source="materials/lectures/Chapter 10 - Networking.pptx"
מארח (host) הוא מחשב ברשת שמריץ תהליכים ושולח ומקבל תעבורה. כתובת IP מזהה את המארח לצורך ניתוב, לא את התהליך. פורט הוא המספר שמזהה את התהליך, או את השירות, על המארח הזה. האנלוגיה בהרצאה היא מספר דירה בבניין. הפורטים 1 עד 1023 שמורים, ואת זה מוסיף מפגש 9.
:::

כתובות IPv4 הן 32 ביט, ונכתבות `132.72.43.254`. כתובות IPv6 הן 128 ביט. `0.0.0.0` שמורה. `127.0.0.1` ו-`::1` הן loopback: שיחת TCP או UDP שאינה יוצאת מהמחשב ומדלגת על הקישור הפיזי.

ארבעה צירים מתארים ערוץ, בטבלה של ההרצאה:

- בלי חיבור, או מכוון חיבור. ל-UDP אין session ואין handshake. TCP דורש handshake ואז יש session.
- בלי אגירה, או עם אגירה. שליחה מיידית, או איסוף בתים ושליחת גוש.
- סינכרוני או אסינכרוני, והשקף גם מיישר את זה עם חסימה (blocking) ועם היעדר חסימה. קריאה חוסמת ממתינה. קריאה שאינה חוסמת חוזרת, כדי שהחוט (thread) יוכל לשאול על המצב אחר כך.
- אמין או לא אמין. TCP מאשר ושולח מחדש, שומר על הסדר, ואינו מציף את המקבל. UDP הוא מאמץ מיטבי (best effort): דטגרם יכול להיעלם או להגיע שלא לפי הסדר, ומה שמגיע הוא הדטגרם כולו או כלום.

### TCP ו-UDP ב-Java

```java
// TCP server
ServerSocket ss = new ServerSocket(80);
Socket s = ss.accept();
Scanner in = new Scanner(s.getInputStream());
PrintWriter out = new PrintWriter(s.getOutputStream(), true);

// UDP server
DatagramSocket ds = new DatagramSocket(5000);
byte[] buf = new byte[256];
DatagramPacket p = new DatagramPacket(buf, buf.length);
ds.receive(p);

// UDP client
DatagramSocket ds = new DatagramSocket();
byte[] msg = "hi from udp client".getBytes();
InetAddress ip = InetAddress.getByName("127.0.0.1");
DatagramPacket p = new DatagramPacket(msg, msg.length, ip, 5000);
ds.send(p);
```

`accept` נחסם עד שלקוח מתחבר, וכל `Socket` שהתקבל הוא חיבור אחר. הרבה לקוחות יכולים לחלוק את הפורט של השרת. מחסנית הרשת (stack) מזהה את החיבור לפי כתובת הלקוח והפורט שלו, וגם לפי אלה של השרת. שרת ההד של מפגש 9 הוא הלולאה הזו: קוראים שורה, כותבים אותה בחזרה, עם `InputStreamReader` ו-`OutputStreamWriter` שנעולים על UTF-8. בתים אינם תווים. הטבלה במפגש מראה אות עברית כשני בתי UTF-8 `d7 90`. אם שני הקצוות חלוקים על ה-charset, התווים יוצאים שגויים. רק נקודות הקוד 0 עד 127 בטוחות בין הקידודים שהמפגש מזכיר.

פרוטוקול, במילים של המפגש, הוא כללי השיחה: איך הודעה ממוסגרת, ממוענת, ומפורשת. פרוטוקול ההד הוא "שורה נכנסת, אותה שורה יוצאת." HTTP, על פורט 80, הוא דוגמה מאוחרת יותר שהמפגש כותב ביד על `Socket`.

### ערוצים אחרים, בקצרה

ההרצאה מקדישה את המחצית השנייה של המצגת למנגנונים שאינם כולם פרוטוקולי רשת. טבלת ההשוואה בסוף היא זו שכדאי לזכור.

| מנגנון | כיוון | חוצה מכונות | אמין |
| --- | --- | --- | --- |
| צינור (pipe) אנונימי | כיוון אחד | לא | כן |
| צינור עם שם | כיוון אחד, יושב על שם קובץ | לא | כן |
| שקע TCP | שני הכיוונים | כן | כן |
| שקע UDP | דטגרמים | כן | לא |
| תור הודעות | הודעות | לא, אלא אם מוצר מרחיב אותו | כן |
| קובץ ממופה לזיכרון וזיכרון משותף | שני הצדדים רואים בתים | לא | הזיכרון הוא פשוט זיכרון |
| signals, mutex, semaphore, משתנה תנאי, נעילת קובץ | סנכרון, לא זרם בתים | לא | לא שירות מסירה |

צינור אנונימי מת עם התהליך. צינור עם שם אינו נעלם כשסוגרים את המתאר. זיכרון משותף הוא המהיר ביותר והקל ביותר לטעות בו, ולכן קיים פרק המקביליות. השרתים בקורס משתמשים בשקעי TCP.

חוטי C++ מופיעים במפגש 10 כי הלקוח של מטלה 3 כתוב ב-C++. `std::thread` מריץ פונקציה. חובה `join` או `detach` לפני שאובייקט ה-`std::thread` נהרס. `std::mutex` הוא ה-mutex. `std::lock_guard` נועל בבנאי ומשחרר בהורס, גרסת ה-RAII של `synchronized`. אין `Runnable`; מעבירים מצביע לפונקציה או lambda.

STOMP, גם הוא מפגש 10, הוא פרוטוקול האפליקציה מעל זרם אמין. מסגרת היא פקודה, כותרות `name:value`, שורה ריקה, גוף, ותו null `'\0'`. סדר הכותרות אינו משנה. `CONNECT` נושא `accept-version` ו-`host`, ורשות גם `login` ו-`passcode`. השרת עונה `CONNECTED`. `SUBSCRIBE` צריך `id` ו-`destination`. `SEND` צריך `destination`. `DISCONNECT` רשאי לשאת `receipt`, והשרת אז עונה `RECEIPT`. `ERROR` נושא כותרת `message`. נוסח המטלה גובר על השקפים כשהם חלוקים; המפגש אומר זאת על השקף.

:::problem id=worked-tcp-accept title="accept אחד" source="materials/lectures/Chapter 10 - Networking.pptx" kind=worked solution_origin=source
לקוח שני מתחבר בזמן שהשרת הזה חסום בתוך `read`. מה קורה, ומה משתנה אם השרת חוזר בלולאה אל `accept`?

```java
ServerSocket ss = new ServerSocket(80);
Socket first = ss.accept();          // client 1
InputStream in = first.getInputStream();
in.read(buf);                         // blocked here
// client 2 connects during the read
```

:::solution
החיבור השני יושב ב-backlog של ה-listen עד שמישהו קורא ל-`accept`. החוט החסום ב-`read` אינו בתוך `accept`, ולכן הלקוח השני אינו מקבל שירות.

```java
while (true) {
    Socket client = ss.accept();
    handle(client);    // returns only when this client is done
}
```

לולאה שקוראת ל-`accept`, מטפלת בלקוח אחד עד הסוף, ואז קוראת שוב ל-`accept`, משרתת את הלקוח השני רק אחרי שהשיחה הראשונה נגמרת. זה שרת חוט אחד (single threaded server). לשרת את שניהם יחד צריך חוט נוסף, או את הלולאה ללא חסימה בפרק Reactor.
:::
:::

:::check id=chk-tcp-udp
איזה פרוטוקול בטבלה של ההרצאה שומר על הסדר ושולח מחדש מקטע שאבד?

- [ ] UDP
- [x] TCP
- [ ] IP

IP אינו מבטיח מסירה או סדר. UDP שומר על גבול הדטגרם ועדיין אינו מבטיח מסירה. TCP הוא השורה שמסומנת אמינה, לפי הסדר, ומכוונת session.
:::

:::trap
`read` על שקע TCP מחזיר מספר בתים, לא הודעה. שורה לוגית יכולה להגיע בשתי קריאות, או שתי שורות יכולות להגיע באחת. המקודד-מפענח, לא השקע, מוצא את גבול ההודעה. UDP שומר על הגבול ועלול להשליך את הדטגרם.
:::

:::trap
כתיבת תווים דרך `OutputStream` עם ה-charset שברירת המחדל של הפלטפורמה, וקריאתם כ-UTF-8, היא שקף "הפענוח הרע" של המפגש. בונים את הקורא ואת הכותב עם אותו שם charset.
:::

## תרגול

:::problem id=ps9-tcp-udp title="TCP או UDP" source="materials/sessions/PS9 2026.pptx" kind=exercise solution_origin=source
לבקשת בדיקת איות של מילה אחת ותשובה אחת, תנו סיבה אחת לבחור ב-UDP וסיבה אחת לבחור ב-TCP.

:::hint
UDP מדלג על ה-handshake. TCP אינו מאבד את התשובה בשקט.
:::
:::hint
הודעת בדיקת איות נכנסת בדטגרם אחד. העברת קובץ אינה רוצה את ההימור הזה.
:::
:::hint
תנו שם ל-handshake ולשליחה מחדש, לא רק "UDP מהיר יותר".
:::
:::solution
UDP אינו צריך handshake ואינו צריך מצב חיבור, ולכן בקשה אחת ותשובה אחת הן שני דטגרמים. זו הסיבה לבחור בו לשאילתה זעירה. המחיר הוא שכל אחד מהדטגרמים יכול להיעלם, והלקוח אינו יכול להבדיל בין תשובה שאבדה לבין שרת איטי אלא אם הוא מוסיף timeout וניסיון חוזר משלו.

TCP מקים session, שולח מחדש מקטעים שאבדו, ומוסר בתים לפי הסדר. התשובה מגיעה, או שהחיבור נכשל באופן גלוי. המחיר הוא ה-handshake ומסגור הזרם: צריך להחליט איפה התשובה נגמרת. לכל דבר שהמשתמש ינסה שוב ביד, TCP הוא ברירת המחדל של המפגש. למדידה שאפשר להשמיט ממנה דגימה, UDP מתאים לשורת "המאמץ המיטבי" של ההרצאה.
:::
:::

:::problem id=ps9-encoding title="קידוד בין הקצוות" source="materials/sessions/PS9 2026.pptx" kind=exercise solution_origin=source
אות עברית מקודדת ב-UTF-8 כבתים `D7 90`. השרת כותב את הבתים האלה. הלקוח בונה `InputStreamReader` עם ה-charset של הפלטפורמה, שאינו UTF-8. מה הלקוח נכשל לעשות, ואיזה בנאי מתקן את זה?

:::hint
השקע נושא בתים. תווים הם הסכמה מעל זה.
:::
:::hint
`InputStreamReader` הוא המחלקה שמפעילה charset. `BufferedReader` רק מפצל שורות.
:::
:::hint
הלקוח הטוב של המפגש מעביר `"UTF-8"` גם לקורא וגם לכותב.
:::
:::solution
הלקוח מפענח את `D7 90` תחת charset שגוי, ולכן האות אינה האות שהשרת שלח. התיקון הוא הזוג שעל השקף:

```java
bufferIn = new BufferedReader(
    new InputStreamReader(clientSocket.getInputStream(), "UTF-8"));
writerOut = new PrintWriter(
    new OutputStreamWriter(clientSocket.getOutputStream(), "UTF-8"), true);
```

שני הכיוונים נוקבים ב-UTF-8. `BufferedReader` אחר כך מפצל שורות. הוא אינו בוחר את ה-charset.
:::
:::

:::problem id=ps10-lock-guard title="מנעול ב-C++" source="materials/sessions/SPL_PS10.pptx" kind=exercise solution_origin=source
תרגמו את הבלוק הזה ל-C++. כללו את השקת החוט ואת ההמתנה, ונסחו את הכלל להשמדת `std::thread`.

```java
synchronized (mutex) {
    System.out.println(taskId);
}
Thread worker = new Thread(task);
worker.start();
worker.join();
```

:::hint
`std::lock_guard` נבנה עם ה-mutex ונהרס בסוף הטווח.
:::
:::hint
`std::thread th(&Task::run, &task)` מריץ את המתודה. `join` ממתין.
:::
:::hint
הכלל הוא join או detach, לפני ההורס.
:::
:::solution
```cpp
std::mutex mutex;
Task task1(1, mutex);
std::thread th1(&Task::run, &task1);
th1.join();
```

בתוך `Task::run`, `std::lock_guard<std::mutex> guard(mutex);` נועל בבנייה ומשחרר כש-`guard` יוצא מהטווח, כולל ב-return. זה התחליף של המפגש ב-RAII ל-`synchronized`. אם ההורס של `th1` רץ בזמן שהחוט עדיין ניתן ל-join, התוכנית קוראת ל-`std::terminate`. כל `std::thread` עובר join או detach קודם.
:::
:::

:::problem id=ps10-stomp title="מסגרות STOMP" source="materials/sessions/SPL_PS10.pptx" kind=exercise solution_origin=source
לקוח רוצה לקבל הודעות עבור `/topic/a`. פרטו את מסגרות ה-STOMP שהוא שולח, לפי הסדר, ואת המסגרת שהוא מקבל אם השרת אינו יכול לרשום אותו. אמרו מה מסיים מסגרת.

:::hint
מסגרת הלקוח הראשונה במפגש היא `CONNECT` או `STOMP`, לא `SUBSCRIBE`.
:::
:::hint
ל-`SUBSCRIBE` שתי כותרות חובה, `id` ו-`destination`.
:::
:::hint
מסגרת נגמרת בבית null, אחרי הגוף.
:::
:::solution
הלקוח שולח `CONNECT` עם `accept-version` ו-`host`, וקורא `CONNECTED` (כותרת ה-`version` היא הגרסה שה-session ישתמש בה). אחר כך הוא שולח

```
SUBSCRIBE
id:sub-1
destination:/topic/a

\0
```

אם השרת אינו יכול ליצור את המינוי הוא שולח `ERROR`, עם כותרת `message`, לא מסגרת `MESSAGE`. מינוי שהצליח מוסר אחר כך מסגרות `MESSAGE` שה-`destination` שלהן הוא `/topic/a`. כל מסגרת נגמרת בתו ה-null `'\0'`. סדר הכותרות אינו משנה. `DISCONNECT`, עם `receipt` אם רוצים, הוא הדרך שבה הלקוח עוזב לפני סגירת השקע; השרת עונה `RECEIPT` כשכותרת ה-receipt הייתה נוכחת.
:::
:::


:::examnote
השאלה מחליפה תו מפריד בקידומת אורך, מגבילה את מספר הלקוחות, או מבקשת פרוטוקול פקודות קטן על השרת הקיים. המלכודת היא להתייחס לקריאה מ-TCP כאל הודעה שלמה, או לשכוח של-UDP אין `accept`.
:::

:::problem id=exam-15b-q3 title="שרת איות" source="materials/exams/15-b.pdf" kind=exam solution_origin=source
שרת ההודעות מהנספח הוא שרת חוט-לכל-לקוח (thread-per-client): חוט לכל שקע שהתקבל.

א. להריץ לכל היותר 10 חוטים.
ב. `MessageLengthBasedTokenizer` ממסגר הודעה כאורך ואחריו כמספר הזה של בתים, לא כתו מפריד.
ג. `SpellMessageEncoder` הופך `SpellMessage` לבתים ובחזרה.
ד. שרת איות משתמש ב-`SpellMessage`, בממסגר לפי אורך, וב-`LexiconBasedSpellChecker` בטוח לחוטים עם בנאי ריק.
ה. עדכנו את `SpellChecker` כך שהשרת בשאלה יתקמפל.
ו. סיימו את `main` של הלקוח.

:::hint
מאגר קבוע של 10 הוא התקרה. יצירת `Thread` לכל `accept` בלי מאגר אינה מגבילה דבר.
:::
:::hint
קוראים את האורך קודם, ואז קוראים בדיוק כמספר הזה של בתים. `hasMessage` הוא false עד שהבתים האלה נוכחים.
:::
:::hint
הפתרון הרשמי מגיש כל חיבור אל `Executors.newFixedThreadPool(10)` במקום `new Thread(...).start()` בלי חסם.
:::
:::solution
א. הפתרון הרשמי בונה `ExecutorService executor = Executors.newFixedThreadPool(10)` ו-`executor.execute(connectionHandler)` לכל שקע שהתקבל. לולאת ה-accept עצמה נשארת על החוט הראשי. לכל היותר 10 מטפלים רצים. חיבורים נוספים ממתינים בתור של המאגר, או שאפשר לסרב להם כשהתור הוא מה שנחשב "יותר מ-10".

ב. הממסגר צובר בתים עד שיש לו את אורך המספר השלם ואז כמספר הזה של בתי מטען. רק אז `nextMessage` חוזר. תו מפריד אינו נבדק.

ג. המקודד כותב את סוג הבקשה, את השפה, ואת המילה בסדר מוסכם, עם קידומת האורך שהממסגר מצפה לה, ו-`fromBytes` בונה מחדש `SpellMessage`.

ד. המטפל נבנה עם `new SpellMessageEncoder()`, `new MessageLengthBasedTokenizer()`, ופרוטוקול שקורא ל-`LexiconBasedSpellChecker.check` או ל-`getCorrections` לפי `SpellMessage.getRequest()`.

ה. `SpellChecker` נשאר הממשק שבשאלה. המימוש כבר בטוח לחוטים, ולכן המטפלים רשאים לחלוק מופע אחד.

ו. הלקוח פותח `Socket` אל המארח והפורט, שולח `SpellMessage` מקודד אחד, וקורא תשובה ממוסגרת אחת.
:::
:::

:::problem id=exam-16a-q3 title="פרוטוקול מדפסת" source="materials/exams/16-a.pdf" kind=exam solution_origin=derived
שירות מדפסת היה ממשק RMI בשם `Printer.print(String)`. סטודנט החליף את ה-stub ואת ה-skeleton שנוצרו בשרת פרוטוקול.

א. לכל היותר עשרה חוטי מטפל.
ב. מסגור לפי אורך, לא לפי תו מפריד. האורך נכנס ב-`int` של Java.
ג. לדבר UDP במקום TCP.
ד. כתבו stub ו-skeleton, באותו סגנון, עבור `Math` עם המתודות שבשאלה.
ה. שרתו את לקוחות המדפסת עם Reactor במקום חוט לכל לקוח.

:::hint
התקרה היא אותו מאגר כמו בשרת ההודעות. חלק ה-Reactor הוא לולאת שרת אחרת, לא מאגר גדול יותר.
:::
:::hint
ל-UDP אין `accept`. כל דטגרם נושא את כתובת השולח, והתשובה משתמשת בכתובת הזו.
:::
:::hint
stub מממש את `Math` על ידי שליחת שם מתודה וארגומנטים. skeleton קורא את ההודעה הזו וקורא לאובייקט האמיתי.
:::
:::solution
א. `Executors.newFixedThreadPool(10)` סביב מטפל החיבור, כמו בפתרון הרשמי של שרת ההודעות.

ב. ארבעת הבתים הראשונים הם האורך. הבתים שאחריהם הם הגוף. `Integer.MAX_VALUE` הוא רק גבול הטיפוס; עדיין מסרבים לאורך שלא ייכנס בחוצץ שבחרתם.

ג. מחליפים את `ServerSocket` / `Socket` ב-`DatagramSocket`. אין חיבור. `receive` מחזיר את השולח. `send` משתמש ב-`SocketAddress` הזה. קידומת אורך היא רשות ב-UDP אם דטגרם אחד הוא הודעה אחת; השאלה עדיין רוצה את האורך כי הסטודנט השאיר את ממסגר הזרם. דטגרם אחד חייב אז להחזיק את כל המסגרת.

ד. `Math_Stub` מממש את `Math`. כל מתודה כותבת מחרוזת פקודה כמו `add 2 3` דרך השקע וקוראת את שורת התשובה. `Math_Skel` מממש את מפעל הפרוטוקול, מנתח את הפקודה, קורא ל-`Math` האמיתי, ומחזיר את התוצאה העשרונית. חריגות בשרת הופכות לשורת שגיאה שה-stub הופך ל-`RemoteException`.

ה. רושמים `ServerSocketChannel` אצל ה-Reactor מהכיתה, עם פרוטוקול המדפסת כמפעל הפרוטוקול וממסגר האורך כמפעל הממסגר. חוט ה-selector מחליף את לולאת ה-accept. המטפלים מפסיקים להיות חוט אחד כל אחד.
:::
:::

:::problem id=exam-17b-q3 title="פקודות בנק" source="materials/exams/17-b.pdf" kind=exam solution_origin=derived
שרת בנק משתמש בפרוטוקול הפעלת הפקודות מהכיתה. שלוש פקודות מגיעות כשורות: `LOGIN name` (השרת עונה `ack` וזוכר את הלקוח), `DEPOSIT money` (מוסיפים ליתרה של הלקוח הזה, עונים `ack`), ופקודה שלישית שהשאלה משתמשת בה כדי לקרוא את היתרה. ממשו את הפקודות ואת `main` של השרת שמארח אותן. כתבו את הפקודות, ואחר כך את ה-main של השרת.

:::hint
כל פקודה היא אובייקט עם `execute` על הבנק, לא ערימת משפטי `if` בקוד השקע.
:::
:::hint
`LOGIN` חייב לקרות לפני `DEPOSIT`, אחרת ל-`DEPOSIT` אין חשבון. זה תנאי מקדים.
:::
:::hint
ה-main של השרת בונה בנק אחד ו-Reactor או לולאת חוט-לכל-לקוח שהופכת שורה לפקודה.
:::
:::solution
`LoginCommand`, `DepositCommand`, ו-`BalanceCommand` מממשים `Command<Bank>`. `execute` על login שומר את שם החיבור ב-session של הפרוטוקול ומחזיר `"ack"`. `execute` על deposit מנתח את הסכום, מוסיף אותו לחשבון של ה-session הזה, ומחזיר `"ack"`. deposit לפני login מחזיר מחרוזת שגיאה במקום לזרוק אל חוט ה-selector.

`Bank` הוא מיפוי משם ליתרה, והמשנים שלו מסונכרנים. ה-`main` של השרת בונה `Bank` אחד, מפעל פרוטוקול שסוגר עליו, ואת שרת ה-Reactor או חוט-לכל-לקוח מהנספח על הפורט של השאלה. כל חיבור מקבל אובייקט פרוטוקול משלו, ולכן שם ה-session אינו משותף בין לקוחות. הבנק משותף, והמנעול הוא מה שגורם לשתי הפקדות לאותו חשבון לחבר את שני הסכומים.
:::
:::

:::problem id=exam-20b-q3 title="מחירי חנויות" source="materials/exams/20-b.pdf" kind=exam solution_origin=derived
`Stores` ממפה שם חנות למחירי מוצרים. פקודות מגיעות דרך פרוטוקול הפעלת הפקודות ורצות על אובייקט `Stores` משותף אחד בתוך Reactor על פורט 7777.

א. ממשו את `GetProductPrices`, שמקבל שם מוצר ומחזיר את המיפוי משם חנות למחיר.
ב. חברו את `PriceServer.main` כך שה-Reactor מפעיל את הפקודות האלה על `StoresImpl` האחד.

:::hint
`execute` מקבל את אובייקט ה-`Stores`. הוא אינו פותח שקע.
:::
:::hint
התשובה צריכה להיות מחרוזת או חוצץ בתים שהפרוטוקול כבר יודע לכתוב. קודדו את המיפוי כשורות.
:::
:::hint
`StoresImpl` אחד נבנה ב-`main` ונתפס על ידי כל פקודה. אל תבנו חנות לכל חיבור.
:::
:::solution
```java
class GetProductPrices implements Command<Stores> {
    private final String product;
    public GetProductPrices(String product) { this.product = product; }
    public String execute(Stores stores) {
        StringBuilder out = new StringBuilder();
        for (String store : stores.getStores()) {
            Integer price = stores.getProductsOfStore(store).get(product);
            if (price != null) out.append(store).append('=').append(price).append('\n');
        }
        return out.toString();
    }
}
```

`main` יוצר `Stores stores = new StoresImpl()` פעם אחת, ואז `new Reactor(7777, 10, () -> new CommandProtocol(stores), tokenizerFactory)`. הפרוטוקול מנתח שורה ל-`Command<Stores>` וקורא ל-`execute(stores)`. המתודות של `StoresImpl` מסונכרנות, או שהמיפוי הוא מיפוי מקבילי, כי ה-Reactor מריץ כמה פקודות בבת אחת על האובייקט האחד הזה.
:::
:::

השקע הוא הקריאה החוסמת ששרת נאיבי נתקע בתוכה. [Reactor](topic:reactor) הוא הדרך להמתין להרבה שקעים בלי חוט לכל אחד.
