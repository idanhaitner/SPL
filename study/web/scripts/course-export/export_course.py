#!/usr/bin/env python3
"""Print the course as JSON for the Next.js study app."""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import studylib


def lecture_blurb(sources: dict, meta: dict) -> str:
    if str(meta.get("blurb") or "").strip():
        return str(meta["blurb"]).strip()
    for path in meta.get("sources") or []:
        src = sources.get(studylib.norm_rel(path))
        if src and src.get("type") == "lecture" and str(src.get("note") or "").strip():
            return str(src["note"]).strip()
    return ""


def practice_ids(blocks) -> list[str]:
    ids = []
    for _parent, block in studylib.walk_directives(blocks):
        if block["name"] != "problem":
            continue
        kind = block["attrs"].get("kind")
        if kind in {"exercise", "exam"}:
            ids.append(str(block["attrs"].get("id") or ""))
    return [item for item in ids if item]


EXCERPT_CHARS = 160
HEBREW_TERM = re.compile(r"[֐-׿]+(?:[ \-־'\"׳״]+[֐-׿]+)*")
BOLD_TERM = re.compile(r"\*\*(.+?)\*\*")


def visible_text(blocks):
    """Every string a student can read in these blocks, with its markup. Notes that never render are left out."""
    for block in blocks:
        kind = block["type"]
        if kind == "directive":
            if block["name"] == "examnote":
                continue
            yield str(block["attrs"].get("title") or "")
            yield from visible_text(block["children"])
        elif kind == "list":
            for item in block["items"]:
                yield item["text"]
                yield from visible_text(item["children"])
        elif kind == "table":
            yield from block["header"]
            for row in block["rows"]:
                yield from row
        else:
            yield block.get("text", "")


def excerpt(text: str) -> str:
    text = " ".join(text.split())
    return text if len(text) <= EXCERPT_CHARS else text[:EXCERPT_CHARS].rsplit(" ", 1)[0]


def section_excerpts(blocks) -> list[str]:
    """The start of the prose in each `##` section. Practice has search hits of its own, so it is skipped."""
    sections = [[]]
    for block in blocks:
        if block["type"] == "heading" and block.get("level") == 2:
            sections.append([])
        elif block["type"] in {"paragraph", "quote", "list", "table"}:
            sections[-1].append(block)
    return [excerpt(studylib.blocks_plain(section)) for section in sections if section]


def chapter_terms(blocks) -> list[str]:
    """Hebrew terms, headings, definitions, and bold terms from the whole chapter, however deep they sit."""
    terms = {}
    for text in visible_text(blocks):
        for term in HEBREW_TERM.findall(text):
            terms[term] = True
        for term in BOLD_TERM.findall(text):
            terms[studylib.inline_plain(term).strip(" :.,")] = True
    for block in blocks:
        if block["type"] == "heading":
            terms[studylib.inline_plain(block["text"])] = True
    for _parent, block in studylib.walk_directives(blocks):
        if block["name"] == "definition" and block["attrs"].get("title"):
            terms[str(block["attrs"]["title"])] = True
    return [term for term in terms if term]


def chapter_text(blurb: str, blocks) -> str:
    return " ".join(part for part in [blurb, *section_excerpts(blocks), *chapter_terms(blocks)] if part)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True)
    args = parser.parse_args()
    model = studylib.load_course(Path(args.root))
    course = model["course"]
    sources = {}
    for src in course.get("sources") or []:
        if isinstance(src, dict) and src.get("path"):
            sources[studylib.norm_rel(src["path"])] = src

    topics = []
    search = []
    for topic in model["topics"]:
        entry = topic["entry"] if isinstance(topic["entry"], dict) else {}
        meta = topic["meta"] if isinstance(topic["meta"], dict) else {}
        slug = str(entry.get("id") or "")
        title = str(entry.get("title") or slug)
        blurb = lecture_blurb(sources, meta)
        topics.append({
            "id": slug,
            "title": title,
            "blurb": blurb,
            "practiceIds": practice_ids(topic["blocks"]),
            "blocks": topic["blocks"],
        })
        search.append({
            "kind": "Chapter",
            "title": title,
            "text": chapter_text(blurb, topic["blocks"]),
            "href": f"/topics/{slug}",
        })
        for _parent, block in studylib.walk_directives(topic["blocks"]):
            if block["name"] != "problem":
                continue
            statement, _hints, _solutions = studylib.problem_parts(block)
            text = studylib.blocks_plain(statement)
            search.append({
                "kind": "Practice",
                "title": text[:90] or str(block["attrs"].get("id") or "Practice"),
                "text": text[:240],
                "href": f"/topics/{slug}#{block['attrs'].get('id')}",
            })

    glossary = []
    used = set()
    titles = {topic["id"]: topic["title"] for topic in topics}
    for entry in course.get("glossary") or []:
        if not isinstance(entry, dict):
            continue
        term = str(entry.get("term") or "")
        anchor = studylib.slugify(term)
        base = anchor
        number = 2
        while anchor in used:
            anchor = f"{base}-{number}"
            number += 1
        used.add(anchor)
        topic_id = str(entry.get("topic") or "")
        glossary.append({
            "term": term,
            "topic": topic_id,
            "topicTitle": titles.get(topic_id, topic_id),
            "definition": str(entry.get("definition") or ""),
            "anchor": anchor,
        })
        search.append({
            "kind": "Glossary",
            "title": term,
            "text": str(entry.get("definition") or "")[:240],
            "href": f"/glossary#{anchor}",
        })

    exercises, harness = studylib.load_exercises(Path(args.root))
    known = {topic["id"] for topic in topics}
    for chapter in exercises:
        if chapter not in known:
            raise studylib.StudyError(f"An exercise names a chapter that does not exist: {chapter}")
    for topic in topics:
        topic["exercises"] = exercises.get(topic["id"], [])

    json.dump(
        {
            "id": course.get("id"),
            "title": course.get("title") or "Course",
            "lang": course.get("lang") or "en",
            "dir": course.get("dir") or "ltr",
            "summary": str(course.get("summary") or "").strip(),
            "topics": topics,
            "glossary": glossary,
            "search": search,
            "harness": harness,
        },
        sys.stdout,
        ensure_ascii=False,
    )


if __name__ == "__main__":
    try:
        main()
    except studylib.StudyError as exc:
        print(str(exc), file=sys.stderr)
        sys.exit(1)
