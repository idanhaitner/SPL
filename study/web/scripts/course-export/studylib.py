#!/usr/bin/env python3
"""Parse course content, check it, and render it to HTML.

Imported by build_site.py and check_coverage.py. The dialect is schema.md.
"""

from __future__ import annotations

import html
import re
from pathlib import Path


class StudyError(Exception):
    pass


COURSE_ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]*$")
KEY_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_-]*$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")

SOURCE_TYPES = {
    "lecture",
    "exercise",
    "solution",
    "exam",
    "exam_solution",
    "syllabus",
    "other",
}
SOURCE_STATUS = {"incorporated", "unreadable", "intentionally_excluded"}
PROBLEM_SOURCES = {"exercise", "exam", "solution", "exam_solution"}
TOPIC_ATTACHED = {"lecture", "exercise", "solution", "exam", "exam_solution"}
WEIGHTS = {"core", "tested", "taught"}
KINDS = {"worked", "exercise", "exam"}
ORIGINS = {"source", "derived"}
KNOWN_DIRECTIVES = {
    "definition",
    "theorem",
    "algorithm",
    "proof",
    "problem",
    "hint",
    "solution",
    "check",
    "trap",
    "examnote",
}
FORMAL = {"definition", "theorem", "algorithm"}

UI = {
    "en": {
        "search": "Search the course",
        "searchPlaceholder": "Search",
        "overview": "Overview",
        "drill": "Exam drill",
        "glossary": "Glossary",
        "topics": "Topics",
        "skip": "Skip to content",
        "onPage": "On this page",
        "continue": "Continue",
        "explain": "I can explain this without notes",
        "showAll": "Show all solutions",
        "hideAll": "Hide solutions",
        "hint": "Show hint ({n} of {total})",
        "nextHint": "Next hint ({n} of {total})",
        "showSolution": "Show solution",
        "hideSolution": "Hide solution",
        "attempted": "I tried this",
        "solved": "Solved",
        "check": "Check",
        "choose": "Choose an answer first.",
        "yes": "Yes. That is the one.",
        "no": "Not this one. The reason is below.",
        "unsolved": "Unsolved practice remains on this topic.",
        "unexplained": "You have not yet marked that you can explain this.",
        "done": "You have marked the whole course solved and explained.",
        "nothing": "Nothing matches.",
        "onExams": "On exams",
        "review": "Review first",
        "unlocks": "This unlocks",
        "sources": "Sources",
        "heat": "Where this shows up",
        "path": "Learn in this order",
        "after": "After",
        "gaps": "Could not read",
        "gapsOk": "Every file in the ledger was read.",
        "aside": "Set aside",
        "changelog": "Changelog",
        "files": "{count} files incorporated",
        "unreadableCount": "{count} unreadable",
        "excludedCount": "{count} set aside",
        "noExams": "No past exams are in the guide yet. When you add one, its questions show up here and inside the topic that teaches the idea.",
        "noExamsHeat": "No past exam is in the guide yet.",
        "drillLead": "Work the question before you open a hint. The third hint is only the first line of the solution.",
        "year": "Year",
        "topic": "Topic",
        "allYears": "All years",
        "allTopics": "All topics",
        "drillEmpty": "No question matches this filter.",
        "glossaryEmpty": "Terms appear here as they are written into the guide.",
        "solvedCount": "{solved} / {total} solved",
        "worked": "Worked example",
        "exercise": "Exercise",
        "exam": "Exam question",
        "example": "Example",
        "solution": "Solution",
        "hintLabel": "Hint {n} of {total}",
        "fromSource": "From the course solutions",
        "derived": "Written for this guide",
        "definition": "Definition",
        "theorem": "Theorem",
        "algorithm": "Algorithm",
        "proof": "Proof",
        "complexity": "Complexity",
        "invariant": "Invariant",
        "trap": "Trap",
        "core": "Repeats on exams",
        "tested": "On an exam",
        "taught": "In the course",
        "topicKind": "Topic",
        "glossaryKind": "Glossary",
    },
    "he": {
        "search": "חיפוש בקורס",
        "searchPlaceholder": "חיפוש",
        "overview": "סקירה",
        "drill": "תרגול מבחנים",
        "glossary": "מילון מונחים",
        "topics": "נושאים",
        "skip": "דילוג לתוכן",
        "onPage": "בעמוד הזה",
        "continue": "להמשיך",
        "explain": "אני יכול להסביר את זה בלי חומר",
        "showAll": "הצגת כל הפתרונות",
        "hideAll": "הסתרת פתרונות",
        "hint": "רמז ({n} מתוך {total})",
        "nextHint": "הרמז הבא ({n} מתוך {total})",
        "showSolution": "הצגת פתרון",
        "hideSolution": "הסתרת פתרון",
        "attempted": "ניסיתי",
        "solved": "פתרתי",
        "check": "בדיקה",
        "choose": "קודם בוחרים תשובה.",
        "yes": "נכון.",
        "no": "לא זו התשובה. הנימוק למטה.",
        "unsolved": "נשארו תרגילים פתוחים בנושא הזה.",
        "unexplained": "עוד לא סימנת שאפשר להסביר את הנושא.",
        "done": "סימנת את כל הקורס כפתור ומוסבר.",
        "nothing": "אין התאמה.",
        "onExams": "במבחנים",
        "review": "כדאי לחזור על",
        "unlocks": "מכאן ממשיכים אל",
        "sources": "מקורות",
        "heat": "איפה זה מופיע",
        "path": "ללמוד בסדר הזה",
        "after": "אחרי",
        "gaps": "לא הצלחתי לקרוא",
        "gapsOk": "כל הקבצים ברשימה נקראו.",
        "aside": "הושאר בצד",
        "changelog": "יומן עדכונים",
        "files": "{count} קבצים נכנסו למדריך",
        "unreadableCount": "{count} לא נקראו",
        "excludedCount": "{count} הושארו בצד",
        "noExams": "אין עדיין מבחנים במדריך. כשיוסיפו מבחן, השאלות יופיעו כאן ובנושא שמלמד את הרעיון.",
        "noExamsHeat": "עוד אין מבחן במדריך.",
        "drillLead": "קודם מנסים לבד, ורק אחר כך פותחים רמז. הרמז השלישי הוא רק השורה הראשונה של הפתרון.",
        "year": "שנה",
        "topic": "נושא",
        "allYears": "כל השנים",
        "allTopics": "כל הנושאים",
        "drillEmpty": "אין שאלה שמתאימה לסינון.",
        "glossaryEmpty": "מונחים יופיעו כאן כשייכתבו למדריך.",
        "solvedCount": "{solved} / {total} נפתרו",
        "worked": "דוגמה פתורה",
        "exercise": "תרגיל",
        "exam": "שאלת מבחן",
        "example": "דוגמה",
        "solution": "פתרון",
        "hintLabel": "רמז {n} מתוך {total}",
        "fromSource": "מתוך פתרונות הקורס",
        "derived": "נכתב עבור המדריך",
        "definition": "הגדרה",
        "theorem": "משפט",
        "algorithm": "אלגוריתם",
        "proof": "הוכחה",
        "complexity": "סיבוכיות",
        "invariant": "אינווריאנטה",
        "trap": "מלכודת",
        "core": "חוזר במבחנים",
        "tested": "הופיע במבחן",
        "taught": "בחומר",
        "topicKind": "נושא",
        "glossaryKind": "מונח",
    },
}


def ui(lang: str) -> dict:
    base = dict(UI["en"])
    base.update(UI.get(lang or "en", {}))
    return base

UL_RE = re.compile(r"^(\s*)- (.*)$")
OL_RE = re.compile(r"^(\s*)(\d+)\. (.*)$")
TOKEN_RE = re.compile(r"(`+)([^`]*)\1|\$\$([^$\n]+)\$\$|\$([^$\n]+)\$")
SEP_CELL_RE = re.compile(r":?-{3,}:?")


def norm_rel(path) -> str:
    text = str(path).strip().replace("\\", "/")
    if text.startswith("./"):
        text = text[2:]
    return text


def _indent(raw: str, lineno: int) -> int:
    prefix = raw[: len(raw) - len(raw.lstrip(" \t"))]
    if "\t" in prefix:
        raise StudyError(f"line {lineno}: tabs are not allowed in YAML indentation")
    return len(prefix)


def _prepare_yaml_lines(text: str, line_offset: int) -> list[tuple[int, str]]:
    lines = []
    for number, raw in enumerate(text.splitlines(), 1):
        lineno = number + line_offset
        if raw.strip() == "" or raw.lstrip().startswith("#"):
            continue
        _indent(raw, lineno)
        lines.append((lineno, raw.rstrip()))
    return lines


def split_key(content: str, lineno: int) -> tuple[str, str]:
    in_quote = False
    escape = False
    for index, char in enumerate(content):
        if escape:
            escape = False
            continue
        if char == "\\":
            escape = True
            continue
        if char == '"':
            in_quote = not in_quote
            continue
        if char == ":" and not in_quote:
            rest = content[index + 1 :]
            if rest == "" or rest.startswith(" "):
                return content[:index].strip(), rest.strip()
    raise StudyError(f"line {lineno}: expected 'key: value'")


def _looks_like_key(content: str, lineno: int) -> tuple[str, str] | None:
    try:
        key, rest = split_key(content, lineno)
    except StudyError:
        return None
    if KEY_RE.match(key):
        return key, rest
    return None


def parse_scalar(text: str):
    text = text.strip()
    if text == "[]":
        return []
    if text.startswith("[") and text.endswith("]"):
        return _parse_flow(text[1:-1])
    if len(text) >= 2 and text[0] == text[-1] and text[0] in {'"', "'"}:
        return _unquote(text)
    if re.fullmatch(r"-?\d+", text):
        return int(text)
    if text in {"null", "~"}:
        return None
    return text


def _unquote(text: str) -> str:
    body = text[1:-1]
    if text[0] == "'":
        return body.replace("''", "'")
    out = []
    index = 0
    while index < len(body):
        if body[index] == "\\" and index + 1 < len(body):
            out.append(body[index + 1])
            index += 2
            continue
        out.append(body[index])
        index += 1
    return "".join(out)


def _parse_flow(inner: str) -> list:
    if inner.strip() == "":
        return []
    items = []
    buf: list[str] = []
    in_quote = False
    escape = False
    for char in inner:
        if escape:
            buf.append(char)
            escape = False
            continue
        if char == "\\":
            buf.append(char)
            escape = True
            continue
        if char == '"':
            in_quote = not in_quote
            buf.append(char)
            continue
        if char == "," and not in_quote:
            items.append(parse_scalar("".join(buf)))
            buf = []
            continue
        buf.append(char)
    tail = "".join(buf).strip()
    if tail:
        items.append(parse_scalar(tail))
    return items


def parse_block_scalar(lines, index, key_indent, style):
    chunks = []
    while index < len(lines):
        lineno, raw = lines[index]
        if _indent(raw, lineno) <= key_indent:
            break
        chunks.append(raw.strip())
        index += 1
    if style == ">":
        return " ".join(chunks).strip(), index
    return "\n".join(chunks).strip(), index


def parse_mapping(lines, index, indent):
    result = {}
    while index < len(lines):
        lineno, raw = lines[index]
        current = _indent(raw, lineno)
        if current < indent:
            break
        if current > indent:
            raise StudyError(f"line {lineno}: unexpected indent")
        content = raw.strip()
        if content.startswith("- "):
            raise StudyError(f"line {lineno}: expected a key, found a list item")
        key, rest = split_key(content, lineno)
        if not KEY_RE.match(key):
            raise StudyError(f"line {lineno}: invalid key {key!r}")
        if key in result:
            raise StudyError(f"line {lineno}: duplicate key {key}")
        if rest in {">", "|"}:
            result[key], index = parse_block_scalar(lines, index + 1, indent, rest)
            continue
        if rest == "":
            if index + 1 >= len(lines) or _indent(lines[index + 1][1], lines[index + 1][0]) <= indent:
                result[key] = None
                index += 1
                continue
            next_indent = _indent(lines[index + 1][1], lines[index + 1][0])
            if lines[index + 1][1].strip().startswith("- "):
                result[key], index = parse_list(lines, index + 1, next_indent)
            else:
                result[key], index = parse_mapping(lines, index + 1, next_indent)
            continue
        result[key] = parse_scalar(rest)
        index += 1
    return result, index


def parse_list(lines, index, indent):
    items = []
    while index < len(lines):
        lineno, raw = lines[index]
        current = _indent(raw, lineno)
        if current < indent:
            break
        if current > indent:
            raise StudyError(f"line {lineno}: unexpected indent in a list")
        content = raw.strip()
        if not content.startswith("- "):
            break
        rest = content[2:].strip()
        if rest == "":
            raise StudyError(f"line {lineno}: empty list item")
        keyed = _looks_like_key(rest, lineno)
        if not keyed:
            items.append(parse_scalar(rest))
            index += 1
            continue
        key, val = keyed
        item = {}
        key_indent = current + 2
        if val in {">", "|"}:
            item[key], index = parse_block_scalar(lines, index + 1, key_indent, val)
        elif val == "":
            index += 1
            if index < len(lines) and _indent(lines[index][1], lines[index][0]) > key_indent:
                nested = _indent(lines[index][1], lines[index][0])
                if lines[index][1].strip().startswith("- "):
                    item[key], index = parse_list(lines, index, nested)
                else:
                    item[key], index = parse_mapping(lines, index, nested)
            else:
                item[key] = None
        else:
            item[key] = parse_scalar(val)
            index += 1
        if index < len(lines):
            sibling = _indent(lines[index][1], lines[index][0])
            if sibling == key_indent and not lines[index][1].strip().startswith("- "):
                extra, index = parse_mapping(lines, index, sibling)
                for extra_key, extra_value in extra.items():
                    if extra_key in item:
                        raise StudyError(f"duplicate key {extra_key} in a list item")
                    item[extra_key] = extra_value
        items.append(item)
    return items, index


def parse_yaml(text: str, line_offset: int = 0):
    lines = _prepare_yaml_lines(text.lstrip("\ufeff"), line_offset)
    if not lines:
        return {}
    first_indent = _indent(lines[0][1], lines[0][0])
    if lines[0][1].strip().startswith("- "):
        value, index = parse_list(lines, 0, first_indent)
    else:
        value, index = parse_mapping(lines, 0, first_indent)
    if index != len(lines):
        raise StudyError(f"line {lines[index][0]}: unexpected content")
    return value


def split_frontmatter(text: str):
    text = text.lstrip("\ufeff")
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        raise StudyError("topic file must start with --- frontmatter")
    end = None
    for index in range(1, len(lines)):
        if lines[index].strip() == "---":
            end = index
            break
    if end is None:
        raise StudyError("unclosed frontmatter")
    meta = parse_yaml("\n".join(lines[1:end]), line_offset=1)
    body = "\n".join(lines[end + 1 :])
    return meta, body, end + 2


def parse_attrs(rest: str, lineno: int) -> dict:
    attrs = {}
    index = 0
    length = len(rest)
    while index < length:
        while index < length and rest[index].isspace():
            index += 1
        if index >= length:
            break
        start = index
        while index < length and (rest[index].isalnum() or rest[index] in "_-"):
            index += 1
        if start == index or index >= length or rest[index] != "=":
            raise StudyError(f"line {lineno}: bad attribute near {rest[start:start + 24]!r}")
        key = rest[start:index]
        index += 1
        if key in attrs:
            raise StudyError(f"line {lineno}: duplicate attribute {key}")
        if index < length and rest[index] == '"':
            index += 1
            chars = []
            closed = False
            while index < length:
                if rest[index] == "\\" and index + 1 < length:
                    chars.append(rest[index + 1])
                    index += 2
                    continue
                if rest[index] == '"':
                    index += 1
                    closed = True
                    break
                chars.append(rest[index])
                index += 1
            if not closed:
                raise StudyError(f"line {lineno}: unclosed quote")
            attrs[key] = "".join(chars)
        else:
            start_val = index
            while index < length and not rest[index].isspace():
                index += 1
            if start_val == index:
                raise StudyError(f"line {lineno}: missing value for {key}")
            attrs[key] = rest[start_val:index]
    return attrs


def parse_open(stripped: str, lineno: int):
    match = re.match(r"^:::([A-Za-z][A-Za-z0-9_-]*)\s*(.*)$", stripped)
    if not match:
        raise StudyError(f"line {lineno}: bad directive")
    name = match.group(1)
    if name not in KNOWN_DIRECTIVES:
        raise StudyError(f"line {lineno}: unknown directive {name}")
    return name, parse_attrs(match.group(2), lineno)


def _list_match(raw: str):
    match = UL_RE.match(raw)
    if match:
        return len(match.group(1)), False, match.group(2)
    match = OL_RE.match(raw)
    if match:
        return len(match.group(1)), True, match.group(3)
    return None


def _is_separator(raw: str) -> bool:
    if "|" not in raw:
        return False
    cells = _split_row(raw)
    return bool(cells) and all(SEP_CELL_RE.fullmatch(cell) for cell in cells)


def _looks_like_table(lines, index) -> bool:
    if index + 1 >= len(lines):
        return False
    if "|" not in lines[index][1]:
        return False
    return _is_separator(lines[index + 1][1])


def _split_row(raw: str) -> list[str]:
    text = raw.strip()
    if text.startswith("|"):
        text = text[1:]
    if text.endswith("|"):
        text = text[:-1]
    return [cell.strip() for cell in text.split("|")]


def _is_special(lines, index) -> bool:
    raw = lines[index][1]
    stripped = raw.strip()
    if stripped == "":
        return True
    if stripped.startswith(("#", ":::", "```", ">", "$$")):
        return True
    if _list_match(raw):
        return True
    if _looks_like_table(lines, index):
        return True
    return False


def parse_list_block(lines, index):
    base, ordered, _text = _list_match(lines[index][1])
    items = []
    while index < len(lines):
        raw = lines[index][1]
        if raw.strip() == "":
            break
        matched = _list_match(raw)
        if not matched or matched[0] != base or matched[1] != ordered:
            break
        parts = [matched[2]]
        item_line = lines[index][0]
        index += 1
        children = []
        while index < len(lines):
            nxt = lines[index][1]
            if nxt.strip() == "":
                break
            indent = len(nxt) - len(nxt.lstrip(" "))
            if "\t" in nxt[: len(nxt) - len(nxt.lstrip(" \t"))]:
                raise StudyError(f"line {lines[index][0]}: tabs are not allowed in list indentation")
            if indent <= base:
                break
            nested = _list_match(nxt)
            if nested and nested[0] > base:
                child, index = parse_list_block(lines, index)
                children.append(child)
                continue
            parts.append(nxt.strip())
            index += 1
        items.append({"text": " ".join(part for part in parts if part), "children": children, "line": item_line})
    block = {"type": "list", "ordered": ordered, "items": items, "line": items[0]["line"] if items else lines[index][0]}
    return block, index


def parse_blocks(lines, index, closer):
    blocks = []
    while index < len(lines):
        lineno, raw = lines[index]
        stripped = raw.strip()
        if stripped == "":
            index += 1
            continue
        if stripped == ":::":
            if closer:
                return blocks, index + 1
            raise StudyError(f"line {lineno}: unexpected :::")
        if stripped.startswith(":::"):
            name, attrs = parse_open(stripped, lineno)
            children, index = parse_blocks(lines, index + 1, name)
            blocks.append({
                "type": "directive",
                "name": name,
                "attrs": attrs,
                "children": children,
                "line": lineno,
            })
            continue
        if stripped.startswith("```"):
            lang = stripped[3:].strip()
            index += 1
            code = []
            closed = False
            while index < len(lines):
                if lines[index][1].strip().startswith("```") and lines[index][1].strip().strip("`") == "":
                    index += 1
                    closed = True
                    break
                code.append(lines[index][1])
                index += 1
            if not closed:
                raise StudyError(f"line {lineno}: unclosed code fence")
            blocks.append({"type": "code", "lang": lang, "text": "\n".join(code), "line": lineno})
            continue
        if stripped == "$$":
            index += 1
            math_lines = []
            closed = False
            while index < len(lines):
                if lines[index][1].strip() == "$$":
                    index += 1
                    closed = True
                    break
                math_lines.append(lines[index][1])
                index += 1
            if not closed:
                raise StudyError(f"line {lineno}: unclosed $$")
            blocks.append({"type": "math", "text": "\n".join(math_lines).strip(), "line": lineno})
            continue
        if stripped.startswith("$$") and stripped.endswith("$$") and len(stripped) > 4:
            blocks.append({"type": "math", "text": stripped[2:-2].strip(), "line": lineno})
            index += 1
            continue
        if stripped.startswith("#"):
            match = re.match(r"^(#{1,6})\s+(.*?)\s*$", stripped)
            if not match:
                raise StudyError(f"line {lineno}: empty heading")
            level = len(match.group(1))
            if level > 4:
                raise StudyError(f"line {lineno}: use headings from # through ####")
            blocks.append({"type": "heading", "level": level, "text": match.group(2), "line": lineno})
            index += 1
            continue
        if _looks_like_table(lines, index):
            header = _split_row(raw)
            index += 2
            rows = []
            while index < len(lines) and "|" in lines[index][1] and lines[index][1].strip():
                row = _split_row(lines[index][1])
                if len(row) != len(header):
                    raise StudyError(f"line {lines[index][0]}: table row has {len(row)} cells, header has {len(header)}")
                rows.append(row)
                index += 1
            blocks.append({"type": "table", "header": header, "rows": rows, "line": lineno})
            continue
        if stripped.startswith(">"):
            quote = []
            while index < len(lines) and lines[index][1].strip().startswith(">"):
                piece = lines[index][1].strip()[1:]
                if piece.startswith(" "):
                    piece = piece[1:]
                quote.append(piece)
                index += 1
            blocks.append({"type": "quote", "text": " ".join(quote), "line": lineno})
            continue
        if _list_match(raw):
            block, index = parse_list_block(lines, index)
            blocks.append(block)
            continue
        paragraph = [stripped]
        index += 1
        while index < len(lines) and not _is_special(lines, index):
            paragraph.append(lines[index][1].strip())
            index += 1
        blocks.append({"type": "paragraph", "text": " ".join(paragraph), "line": lineno})
    if closer:
        raise StudyError(f"unclosed :::{closer}")
    return blocks, index


def parse_topic(text: str):
    meta, body, body_start = split_frontmatter(text)
    lines = [(body_start + number, raw) for number, raw in enumerate(body.splitlines())]
    blocks, _index = parse_blocks(lines, 0, None)
    return meta, blocks


def make_href(page: str):
    """page is 'top' (study/*.html) or 'topic' (study/topics/*.html)."""

    def href_for(url: str) -> str:
        if url.startswith("topic:"):
            slug = url[6:]
            if page == "topic":
                return f"{slug}.html"
            return f"topics/{slug}.html"
        if url.startswith("study:"):
            name = url[6:]
            prefix = "../" if page == "topic" else ""
            return f"{prefix}{name}.html"
        if url.startswith("repo:"):
            prefix = "../../" if page == "topic" else "../"
            return prefix + url[5:]
        return url

    return href_for


def _emphasis(text: str) -> str:
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"(?<!\*)\*(?!\s)([^*]+?)(?<!\s)\*(?!\*)", r"<em>\1</em>", text)
    return text


def render_inline(text: str, href_for) -> str:
    if text is None:
        return ""
    stored = []

    def repl(match):
        if match.group(1) is not None and match.group(1).startswith("`"):
            stored.append(("code", match.group(2)))
        elif match.group(3) is not None:
            stored.append(("display", match.group(3)))
        else:
            stored.append(("math", match.group(4) or ""))
        return f"\u0000{len(stored) - 1}\u0000"

    protected = TOKEN_RE.sub(repl, str(text))
    escaped = _emphasis(html.escape(protected))

    def image(match):
        alt = match.group(1)
        src = href_for(html.unescape(match.group(2)))
        return f'<img src="{html.escape(src, quote=True)}" alt="{alt}">'

    def link(match):
        label = match.group(1)
        href = href_for(html.unescape(match.group(2)))
        return f'<a href="{html.escape(href, quote=True)}">{label}</a>'

    escaped = re.sub(r"!\[([^\]]*)\]\(([^)]+)\)", image, escaped)
    escaped = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", link, escaped)

    def restore(match):
        kind, payload = stored[int(match.group(1))]
        safe = html.escape(payload)
        if kind == "code":
            return f"<code>{safe}</code>"
        if kind == "display":
            return f'<span class="math-display" dir="ltr">$${safe}$$</span>'
        return f'<span class="math-inline" dir="ltr">${safe}$</span>'

    return re.sub(r"\u0000(\d+)\u0000", restore, escaped)


def inline_plain(text: str) -> str:
    if not text:
        return ""
    text = re.sub(r"`([^`]*)`", r"\1", str(text))
    text = re.sub(r"\$\$([^$]+)\$\$", r"\1", text)
    text = re.sub(r"\$([^$]+)\$", r"\1", text)
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", "", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    text = text.replace("**", "").replace("*", "")
    return " ".join(text.split())


def slugify(text: str) -> str:
    plain = inline_plain(text).lower()
    plain = re.sub(r"[^\w\s-]", "", plain, flags=re.UNICODE)
    plain = re.sub(r"\s+", "-", plain.strip())
    return plain or "section"


def blocks_plain(blocks) -> str:
    parts = []
    for block in blocks:
        kind = block["type"]
        if kind == "directive" and block["name"] in {"hint", "solution"}:
            continue
        if kind == "heading":
            parts.append(inline_plain(block["text"]))
        elif kind in {"paragraph", "quote"}:
            parts.append(inline_plain(block["text"]))
        elif kind == "math":
            parts.append(block["text"])
        elif kind == "code":
            parts.append(block["text"])
        elif kind == "list":
            for item in block["items"]:
                parts.append(inline_plain(item["text"]))
                parts.append(blocks_plain(item["children"]))
        elif kind == "table":
            parts.extend(inline_plain(cell) for cell in block["header"])
            for row in block["rows"]:
                parts.extend(inline_plain(cell) for cell in row)
        elif kind == "directive":
            title = block["attrs"].get("title", "")
            if title:
                parts.append(title)
            parts.append(blocks_plain(block["children"]))
    return " ".join(part for part in parts if part)


class RenderCtx:
    def __init__(self, href_for, topic_id: str = "", year_of=None, strings=None):
        self.href_for = href_for
        self.topic_id = topic_id
        self.year_of = year_of or {}
        self.strings = strings or UI["en"]
        self.toc = []
        self.ids = set()

    def t(self, key: str) -> str:
        return self.strings.get(key, UI["en"].get(key, key))

    def tf(self, key: str, **kwargs) -> str:
        return self.t(key).format(**kwargs)

    def claim(self, wanted: str) -> str:
        base = wanted or "section"
        if base not in self.ids:
            self.ids.add(base)
            return base
        number = 2
        while f"{base}-{number}" in self.ids:
            number += 1
        chosen = f"{base}-{number}"
        self.ids.add(chosen)
        return chosen


def _seed_ids(blocks, ctx: RenderCtx):
    for block in blocks:
        if block["type"] != "directive":
            continue
        explicit = block["attrs"].get("id")
        if explicit:
            ctx.ids.add(explicit)
        _seed_ids(block["children"], ctx)


def render_blocks(blocks, ctx: RenderCtx) -> str:
    return "".join(render_block(block, ctx) for block in blocks)


def render_block(block, ctx: RenderCtx) -> str:
    kind = block["type"]
    if kind == "heading":
        plain = inline_plain(block["text"])
        anchor = ctx.claim(slugify(plain))
        if block["level"] in {2, 3}:
            ctx.toc.append({"level": block["level"], "id": anchor, "text": plain})
        inner = render_inline(block["text"], ctx.href_for)
        return f"<h{block['level']} id=\"{html.escape(anchor)}\">{inner}</h{block['level']}>"
    if kind == "paragraph":
        return f"<p>{render_inline(block['text'], ctx.href_for)}</p>"
    if kind == "quote":
        return f"<blockquote><p>{render_inline(block['text'], ctx.href_for)}</p></blockquote>"
    if kind == "math":
        return f'<div class="math-display" dir="ltr">$${html.escape(block["text"])}$$</div>'
    if kind == "code":
        lang = f' class="language-{html.escape(block["lang"], quote=True)}"' if block["lang"] else ""
        return f"<pre><code{lang}>{html.escape(block['text'])}</code></pre>"
    if kind == "list":
        return _render_list(block, ctx)
    if kind == "table":
        return _render_table(block, ctx)
    if kind == "directive":
        return _render_directive(block, ctx)
    raise StudyError(f"cannot render block {kind}")


def _render_list(block, ctx: RenderCtx) -> str:
    tag = "ol" if block["ordered"] else "ul"
    items = []
    for item in block["items"]:
        body = render_inline(item["text"], ctx.href_for)
        nested = "".join(render_block(child, ctx) for child in item["children"])
        items.append(f"<li>{body}{nested}</li>")
    return f"<{tag}>{''.join(items)}</{tag}>"


def _render_table(block, ctx: RenderCtx) -> str:
    head = "".join(f"<th>{render_inline(cell, ctx.href_for)}</th>" for cell in block["header"])
    rows = []
    for row in block["rows"]:
        cells = "".join(f"<td>{render_inline(cell, ctx.href_for)}</td>" for cell in row)
        rows.append(f"<tr>{cells}</tr>")
    return f"<div class=\"table-wrap\"><table><thead><tr>{head}</tr></thead><tbody>{''.join(rows)}</tbody></table></div>"


def _render_directive(block, ctx: RenderCtx) -> str:
    name = block["name"]
    if name in FORMAL:
        return _render_formal(block, ctx)
    if name == "proof":
        return f'<div class="proof"><p class="kicker">{html.escape(ctx.t("proof"))}</p>{render_blocks(block["children"], ctx)}</div>'
    if name in {"trap", "examnote"}:
        label = ctx.t("trap") if name == "trap" else ctx.t("onExams")
        return (
            f'<aside class="callout callout-{name}"><p class="kicker">{label}</p>'
            f'{render_blocks(block["children"], ctx)}</aside>'
        )
    if name == "problem":
        return _render_problem(block, ctx)
    if name == "check":
        return _render_check(block, ctx)
    if name in {"hint", "solution"}:
        raise StudyError(f"line {block['line']}: {name} appeared outside a problem")
    raise StudyError(f"line {block['line']}: cannot render {name}")


def _render_formal(block, ctx: RenderCtx) -> str:
    attrs = block["attrs"]
    anchor = attrs.get("id") or ctx.claim(slugify(attrs.get("title", block["name"])))
    title = attrs.get("title", "")
    ctx.toc.append({"level": 2, "id": anchor, "text": title or block["name"]})
    body_blocks = []
    proofs = []
    for child in block["children"]:
        if child["type"] == "directive" and child["name"] == "proof":
            proofs.append(child)
        else:
            body_blocks.append(child)
    label = ctx.t(block["name"])
    extra = ""
    if block["name"] == "algorithm":
        extra = (
            f'<p class="complexity"><span class="kicker">{html.escape(ctx.t("complexity"))}</span> {render_inline(attrs.get("complexity", ""), ctx.href_for)}</p>'
            f'<p class="invariant"><span class="kicker">{html.escape(ctx.t("invariant"))}</span> {render_inline(attrs.get("invariant", ""), ctx.href_for)}</p>'
        )
    proof_html = "".join(_render_directive(proof, ctx) for proof in proofs)
    source = attrs.get("source", "")
    cite = f'<p class="cite">{html.escape(source)}</p>' if source else ""
    return (
        f'<section class="formal {block["name"]}" id="{html.escape(anchor)}">'
        f'<header><p class="kicker">{label}</p><h3>{render_inline(title, ctx.href_for)}</h3>{extra}{cite}</header>'
        f'<div class="statement">{render_blocks(body_blocks, ctx)}</div>{proof_html}</section>'
    )


def problem_parts(block):
    statement, hints, solutions = [], [], []
    for child in block["children"]:
        if child["type"] == "directive" and child["name"] == "hint":
            hints.append(child)
        elif child["type"] == "directive" and child["name"] == "solution":
            solutions.append(child)
        else:
            statement.append(child)
    return statement, hints, solutions


def _render_problem(block, ctx: RenderCtx) -> str:
    attrs = block["attrs"]
    statement, hints, solutions = problem_parts(block)
    kind = attrs.get("kind", "")
    origin = attrs.get("solution_origin", "")
    problem_id = attrs.get("id", "")
    year = ctx.year_of.get(problem_id, "")
    tracked = "yes" if kind in {"exercise", "exam"} else "no"
    labels = {"worked": ctx.t("worked"), "exercise": ctx.t("exercise"), "exam": ctx.t("exam")}
    origin_label = ctx.t("fromSource") if origin == "source" else ctx.t("derived")
    hint_html = []
    for number, hint in enumerate(hints, 1):
        hint_html.append(
            f'<div class="hint" hidden><p class="kicker">{html.escape(ctx.tf("hintLabel", n=number, total=len(hints)))}</p>'
            f'{render_blocks(hint["children"], ctx)}</div>'
        )
    solution_hidden = "" if kind == "worked" else " hidden"
    solution_html = ""
    if solutions:
        solution_html = (
            f'<div class="solution"{solution_hidden}><p class="kicker">{html.escape(ctx.t("solution"))}</p>'
            f'{render_blocks(solutions[0]["children"], ctx)}</div>'
        )
    actions = []
    if kind != "worked" and hints:
        actions.append(
            f'<button type="button" data-action="hint" aria-expanded="false">{html.escape(ctx.tf("hint", n=1, total=len(hints)))}</button>'
        )
    if kind != "worked" and solutions:
        actions.append(f'<button type="button" data-action="solution" aria-expanded="false">{html.escape(ctx.t("showSolution"))}</button>')
    if tracked == "yes":
        actions.append(f'<button type="button" data-action="attempted">{html.escape(ctx.t("attempted"))}</button>')
        actions.append(f'<button type="button" data-action="solved">{html.escape(ctx.t("solved"))}</button>')
    action_html = f'<div class="actions">{"".join(actions)}</div>' if actions else ""
    year_html = f'<span class="badge">{html.escape(str(year))}</span>' if year != "" else ""
    return (
        f'<article class="problem" id="{html.escape(problem_id)}" data-id="{html.escape(problem_id)}"'
        f' data-kind="{html.escape(kind)}" data-track="{tracked}" data-topic="{html.escape(ctx.topic_id)}"'
        f' data-year="{html.escape(str(year))}">'
        f'<header class="problem-head"><p class="kicker">{labels.get(kind, "Problem")}</p>'
        f'{year_html}<p class="cite">{html.escape(attrs.get("source", ""))} · {origin_label}</p></header>'
        f'<div class="problem-body">{render_blocks(statement, ctx)}</div>'
        f'{"".join(hint_html)}{action_html}{solution_html}</article>'
    )


def _check_choices(block):
    list_index = None
    for index, child in enumerate(block["children"]):
        if child["type"] == "list":
            list_index = index
            break
    if list_index is None:
        raise StudyError(f"line {block['line']}: check needs a list of choices")
    question = block["children"][:list_index]
    why = block["children"][list_index + 1 :]
    choices = []
    for item in block["children"][list_index]["items"]:
        if item["children"]:
            raise StudyError(f"line {item['line']}: a check choice cannot contain a nested list")
        text = item["text"].strip()
        correct = False
        if text.startswith("[x]") or text.startswith("[X]"):
            correct = True
            text = text[3:].strip()
        elif text.startswith("[ ]"):
            text = text[3:].strip()
        else:
            raise StudyError(f"line {item['line']}: a choice must start with [x] or [ ]")
        choices.append((correct, text))
    return question, choices, why


def _render_check(block, ctx: RenderCtx) -> str:
    question, choices, why = _check_choices(block)
    check_id = block["attrs"].get("id", "")
    options = []
    for index, (correct, text) in enumerate(choices):
        flag = ' data-correct="true"' if correct else ""
        options.append(
            f'<label><input type="radio" name="check-{html.escape(check_id)}" value="{index}"{flag}> '
            f'<span>{render_inline(text, ctx.href_for)}</span></label>'
        )
    return (
        f'<div class="check" id="{html.escape(check_id)}">'
        f'<div class="check-q">{render_blocks(question, ctx)}</div>'
        f'<div class="choices">{"".join(options)}</div>'
        f'<button type="button" data-action="grade">{html.escape(ctx.t("check"))}</button>'
        f'<p class="check-result" hidden></p>'
        f'<div class="check-why" hidden>{render_blocks(why, ctx)}</div></div>'
    )


def walk_directives(blocks, parent=None):
    for block in blocks:
        if block["type"] != "directive":
            continue
        yield parent, block
        yield from walk_directives(block["children"], block["name"])


def load_course(root: Path) -> dict:
    root = root.resolve()
    content = root / "study" / "content"
    course_path = content / "course.yml"
    if not course_path.exists():
        raise StudyError(f"missing {course_path}. Write study/content/course.yml as described in schema.md.")
    try:
        course = parse_yaml(course_path.read_text(encoding="utf-8"))
    except StudyError as exc:
        raise StudyError(f"study/content/course.yml: {exc}") from exc
    if not isinstance(course, dict):
        raise StudyError("study/content/course.yml must be a mapping")
    topics = []
    for entry in course.get("topics") or []:
        if not isinstance(entry, dict) or "file" not in entry:
            topics.append({"entry": entry, "meta": {}, "blocks": [], "rel": "", "missing": True})
            continue
        rel = norm_rel(entry["file"])
        path = content / rel
        if not path.exists():
            topics.append({"entry": entry, "meta": {}, "blocks": [], "rel": rel, "missing": True})
            continue
        try:
            meta, blocks = parse_topic(path.read_text(encoding="utf-8"))
        except StudyError as exc:
            raise StudyError(f"study/content/{rel}: {exc}") from exc
        topics.append({"entry": entry, "meta": meta, "blocks": blocks, "rel": rel, "missing": False})
    return {"root": root, "content": content, "course": course, "topics": topics}


def _as_list(value, label, errors):
    if value is None:
        return []
    if not isinstance(value, list):
        errors.append(f"{label} must be a list")
        return []
    return value


def _require(mapping, key, label, errors):
    if not isinstance(mapping, dict) or key not in mapping or mapping[key] in (None, ""):
        errors.append(f"{label} is missing {key}")
        return None
    return mapping[key]


def validate_content(model) -> list[str]:
    errors = []
    course = model["course"]
    if not isinstance(course, dict):
        return ["course.yml must be a mapping"]
    for key in ("id", "title", "lang", "dir", "summary", "changelog", "sources", "topics", "glossary", "exams"):
        if key not in course:
            errors.append(f"course.yml is missing {key}")
    course_id = str(course.get("id") or "")
    if course_id and not COURSE_ID_RE.match(course_id):
        errors.append(f"course id {course_id!r} must be a lowercase hyphen slug")
    if course.get("dir") not in {None, "ltr", "rtl"}:
        errors.append("dir must be ltr or rtl")
    if "summary" in course and not str(course.get("summary") or "").strip():
        errors.append("summary is empty")

    sources = _as_list(course.get("sources"), "sources", errors)
    ledger = {}
    listed_problems = {}
    for index, source in enumerate(sources):
        label = f"sources[{index}]"
        if not isinstance(source, dict):
            errors.append(f"{label} must be a mapping")
            continue
        path = norm_rel(source.get("path") or "")
        label = path or label
        if not path or path.startswith("/") or ".." in Path(path).parts or path.startswith("study/"):
            errors.append(f"{label}: path must be a repo-relative file outside study/")
        kind = source.get("type")
        status = source.get("status")
        if kind not in SOURCE_TYPES:
            errors.append(f"{label}: type must be one of {', '.join(sorted(SOURCE_TYPES))}")
        if status not in SOURCE_STATUS:
            errors.append(f"{label}: status must be incorporated, unreadable, or intentionally_excluded")
        note = source.get("note")
        if not isinstance(note, str) or not note.strip():
            errors.append(f"{label}: note is required")
        problems = source.get("problems") or []
        if problems and status != "incorporated":
            errors.append(f"{label}: only incorporated sources list problems")
        if not isinstance(problems, list):
            errors.append(f"{label}: problems must be a list")
            problems = []
        if status == "incorporated" and kind in PROBLEM_SOURCES and not problems:
            errors.append(f"{label}: incorporated {kind} files list every problem id")
        for problem_id in problems:
            problem_id = str(problem_id)
            if not ID_RE.match(problem_id):
                errors.append(f"{label}: invalid problem id {problem_id}")
            listed_problems.setdefault(problem_id, []).append(path)
        if path in ledger:
            errors.append(f"{label}: duplicate ledger path")
        ledger[path] = source

    for entry in _as_list(course.get("changelog"), "changelog", errors):
        if not isinstance(entry, dict) or not DATE_RE.match(str(entry.get("date") or "")):
            errors.append("each changelog entry needs a YYYY-MM-DD date")
        elif not str(entry.get("note") or "").strip():
            errors.append(f"changelog {entry.get('date')} is missing a note")

    topic_ids = []
    topic_by_id = {}
    problems = {}
    for topic in model["topics"]:
        entry = topic["entry"]
        if not isinstance(entry, dict):
            errors.append("a topic entry must be a mapping")
            continue
        topic_id = str(entry.get("id") or "")
        rel = topic.get("rel") or str(entry.get("file") or "")
        label = f"topic {topic_id or rel}"
        if not COURSE_ID_RE.match(topic_id):
            errors.append(f"{label}: id must be a lowercase hyphen slug")
        if topic_id in topic_by_id:
            errors.append(f"duplicate topic id {topic_id}")
        topic_ids.append(topic_id)
        topic_by_id[topic_id] = topic
        weight = entry.get("exam_weight")
        if weight not in WEIGHTS:
            errors.append(f"{label}: exam_weight must be core, tested, or taught")
        shape = str(entry.get("exam_shape") or "").strip()
        if weight in {"core", "tested"} and not shape:
            errors.append(f"{label}: {weight} topics need exam_shape")
        if not str(entry.get("title") or "").strip():
            errors.append(f"{label}: title is required")
        if topic.get("missing"):
            errors.append(f"{label}: missing file study/content/{rel}")
            continue
        meta = topic["meta"] if isinstance(topic["meta"], dict) else {}
        if str(meta.get("id") or "") != topic_id:
            errors.append(f"{rel}: frontmatter id must match course.yml ({topic_id})")
        if str(meta.get("title") or "") != str(entry.get("title") or ""):
            errors.append(f"{rel}: frontmatter title must match course.yml")
        front_sources = meta.get("sources")
        if not isinstance(front_sources, list) or not front_sources:
            errors.append(f"{rel}: sources must be a non-empty list")
            front_sources = []
        for source_path in front_sources:
            source_path = norm_rel(source_path)
            if source_path not in ledger:
                errors.append(f"{rel}: source {source_path} is not in the ledger")
            elif ledger[source_path].get("status") != "incorporated":
                errors.append(f"{rel}: source {source_path} is not incorporated")
        _validate_directives(topic["blocks"], rel, topic_id, problems, errors)

    known_topics = set(topic_ids)
    for topic in model["topics"]:
        entry = topic["entry"] if isinstance(topic["entry"], dict) else {}
        for field in ("prerequisites", "unlocks"):
            for ref in _as_list(entry.get(field), f"{entry.get('id')} {field}", errors):
                if str(ref) not in known_topics:
                    errors.append(f"topic {entry.get('id')}: {field} names unknown topic {ref}")
    order = {topic_id: index for index, topic_id in enumerate(topic_ids)}
    for topic in model["topics"]:
        entry = topic["entry"] if isinstance(topic["entry"], dict) else {}
        topic_id = str(entry.get("id") or "")
        for ref in _as_list(entry.get("prerequisites"), f"{topic_id} prerequisites", errors):
            ref_id = str(ref)
            if ref_id in order and order[ref_id] > order.get(topic_id, -1):
                errors.append(
                    f"topic {topic_id}: prerequisite {ref_id} is later in the course. "
                    "List topics in syllabus order."
                )

    attached = set()
    for topic in model["topics"]:
        meta = topic["meta"] if isinstance(topic["meta"], dict) else {}
        for source_path in meta.get("sources") or []:
            attached.add(norm_rel(source_path))
    for path, source in ledger.items():
        if source.get("status") == "incorporated" and source.get("type") in TOPIC_ATTACHED and path not in attached:
            errors.append(f"{path}: incorporated {source.get('type')} is not listed in any topic")

    for problem_id, info in problems.items():
        if problem_id not in listed_problems:
            errors.append(f"{info['where']}: problem {problem_id} is missing from every source problems list")
        source_path = info["source"]
        if source_path not in ledger:
            errors.append(f"{info['where']}: problem {problem_id} cites {source_path}, which is not in the ledger")
        elif ledger[source_path].get("status") != "incorporated":
            errors.append(f"{info['where']}: problem {problem_id} cites {source_path}, which is not incorporated")
    for problem_id, paths in listed_problems.items():
        if problem_id not in problems:
            errors.append(f"{paths[0]}: lists {problem_id}, and no topic contains that problem")

    exams = _as_list(course.get("exams"), "exams", errors)
    exam_sources = set()
    listed_exams = {}
    for exam in exams:
        if not isinstance(exam, dict):
            errors.append("each exam entry must be a mapping")
            continue
        source = norm_rel(exam.get("source") or "")
        year = exam.get("year")
        if source in exam_sources:
            errors.append(f"{source}: listed in exams more than once")
        exam_sources.add(source)
        if source not in ledger or ledger[source].get("type") != "exam":
            errors.append(f"{source or exam}: exams.source must be a ledger path of type exam")
        if not str(exam.get("pattern") or "").strip():
            errors.append(f"{source}: exams.pattern is required")
        for question in _as_list(exam.get("questions"), f"{source} questions", errors):
            if not isinstance(question, dict):
                errors.append(f"{source}: a question must be a mapping")
                continue
            question_id = str(question.get("id") or "")
            topic_id = str(question.get("topic") or "")
            if question_id in listed_exams:
                errors.append(f"{question_id}: listed under exams more than once")
            listed_exams[question_id] = {"topic": topic_id, "source": source, "year": year}
            info = problems.get(question_id)
            if info is None:
                errors.append(f"{source}: exam question {question_id} is not in a topic")
                continue
            if info["kind"] != "exam":
                errors.append(f"{question_id}: listed under exams but its kind is {info['kind']}")
            if info["topic_id"] != topic_id:
                errors.append(f"{question_id}: lives in topic {info['topic_id']}, exams says {topic_id}")
            if info["source"] != source:
                errors.append(f"{question_id}: cites {info['source']}, exams says {source}")

    for problem_id, info in problems.items():
        if info["kind"] == "exam" and problem_id not in listed_exams:
            errors.append(f"{info['where']}: exam problem {problem_id} is not listed under exams")
    for path, source in ledger.items():
        if source.get("status") == "incorporated" and source.get("type") == "exam" and path not in exam_sources:
            errors.append(f"{path}: incorporated exam file has no exams entry")

    for entry in _as_list(course.get("glossary"), "glossary", errors):
        if not isinstance(entry, dict):
            errors.append("a glossary entry must be a mapping")
            continue
        term = str(entry.get("term") or "").strip()
        if not term:
            errors.append("a glossary entry is missing term")
        if str(entry.get("topic") or "") not in known_topics:
            errors.append(f"glossary term {term or '?'} points at an unknown topic")
        if not str(entry.get("definition") or "").strip():
            errors.append(f"glossary term {term or '?'} is missing a definition")
    return errors


def _validate_directives(blocks, rel, topic_id, problems, errors):
    for parent, block in walk_directives(blocks):
        name = block["name"]
        attrs = block["attrs"]
        line = f"{rel}:{block['line']}"
        if name == "proof" and parent not in {"theorem", "algorithm"}:
            errors.append(f"{line}: proof belongs inside a theorem or an algorithm")
        if name in {"hint", "solution"} and parent != "problem":
            errors.append(f"{line}: {name} belongs inside a problem")
        if name in FORMAL:
            for key in ("id", "title", "source"):
                if not str(attrs.get(key) or "").strip():
                    errors.append(f"{line}: {name} needs {key}")
            if attrs.get("id") and not ID_RE.match(str(attrs["id"])):
                errors.append(f"{line}: invalid id {attrs['id']}")
        if name == "algorithm":
            for key in ("complexity", "invariant"):
                if not str(attrs.get(key) or "").strip():
                    errors.append(f"{line}: algorithm needs {key}")
        if name == "check":
            if not str(attrs.get("id") or "").strip() or not ID_RE.match(str(attrs.get("id") or "")):
                errors.append(f"{line}: check needs an id")
            try:
                _question, choices, why = _check_choices(block)
            except StudyError as exc:
                errors.append(f"{rel}: {exc}")
                choices, why = [], []
            correct = [flag for flag, _text in choices].count(True)
            if choices and correct != 1:
                errors.append(f"{line}: a check needs exactly one [x] choice")
            if choices and len(choices) < 2:
                errors.append(f"{line}: a check needs at least two choices")
            if choices and not why:
                errors.append(f"{line}: a check needs the reason after the choices")
        if name != "problem":
            continue
        problem_id = str(attrs.get("id") or "")
        kind = attrs.get("kind")
        origin = attrs.get("solution_origin")
        source = norm_rel(attrs.get("source") or "")
        if not ID_RE.match(problem_id):
            errors.append(f"{line}: problem needs an id")
        if kind not in KINDS:
            errors.append(f"{line}: kind must be worked, exercise, or exam")
        if origin not in ORIGINS:
            errors.append(f"{line}: solution_origin must be source or derived")
        if not source:
            errors.append(f"{line}: problem needs source")
        statement, hints, solutions = problem_parts(block)
        if kind in {"exercise", "exam"} and len(hints) != 3:
            errors.append(f"{line}: {kind} {problem_id or ''} needs 3 hints, found {len(hints)}")
        if kind == "worked" and hints:
            errors.append(f"{line}: a worked example has a visible solution and no hints")
        if len(solutions) != 1:
            errors.append(f"{line}: {problem_id or name} needs one solution, found {len(solutions)}")
        spilled = False
        seen_ladder = False
        for child in block["children"]:
            child_name = child["name"] if child["type"] == "directive" else ""
            if child_name in {"hint", "solution"}:
                seen_ladder = True
            elif seen_ladder:
                spilled = True
        if spilled:
            errors.append(f"{line}: keep the statement before the hints and the solution")
        if problem_id:
            if problem_id in problems:
                errors.append(f"{line}: duplicate problem id {problem_id}")
            problems[problem_id] = {
                "topic_id": topic_id,
                "kind": kind,
                "source": source,
                "where": line,
                "statement": blocks_plain(statement),
            }


def repo_files(root: Path) -> list[str]:
    skip_dirs = {".git", "study", "__pycache__", "node_modules"}
    found = []
    for dirpath, dirnames, filenames in os_walk(root):
        dirnames[:] = sorted(name for name in dirnames if name not in skip_dirs and not name.startswith("."))
        for name in sorted(filenames):
            if name.startswith("."):
                continue
            found.append((Path(dirpath) / name).relative_to(root).as_posix())
    return found


def os_walk(root: Path):
    import os
    return os.walk(root)


def coverage_errors(model) -> list[str]:
    errors = list(validate_content(model))
    root = model["root"]
    on_disk = set(repo_files(root))
    sources = model["course"].get("sources") if isinstance(model["course"], dict) else []
    ledger = {}
    if isinstance(sources, list):
        for source in sources:
            if isinstance(source, dict) and source.get("path"):
                ledger[norm_rel(source["path"])] = source
    for path in sorted(on_disk - set(ledger)):
        errors.append(f"missing from ledger: {path}")
    for path in sorted(set(ledger) - on_disk):
        errors.append(f"ledger path not found: {path}")
    return errors
