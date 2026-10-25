#!/usr/bin/env python3
"""Print the course as JSON for the Next.js study app."""

from __future__ import annotations

import argparse
import json
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
            "text": blurb,
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
