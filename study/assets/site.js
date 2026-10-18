(function () {
  var course = window.STUDY;
  if (!course || !course.id) return;

  var storageKey = "study:" + course.id;
  var strings = course.strings || {};

  function text(key, fallback) {
    return strings[key] || fallback;
  }

  function fmt(key, fallback, vars) {
    return text(key, fallback).replace(/\{(\w+)\}/g, function (_match, name) {
      return vars[name];
    });
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch (error) {
      return {};
    }
  }

  function save(state) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
      return;
    }
  }

  function problemState(state, id) {
    return (state.problems && state.problems[id]) || "";
  }

  function withDepth(href) {
    return (document.body.getAttribute("data-depth") || "") + href;
  }

  function escapeText(value) {
    return String(value).replace(/[&<>"]/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char];
    });
  }

  function setProblem(id, value) {
    var state = load();
    state.problems = state.problems || {};
    if (state.problems[id] === "solved" && value === "attempted") {
      paint();
      return;
    }
    state.problems[id] = value;
    save(state);
    paint();
  }

  function paint() {
    var state = load();
    document.querySelectorAll(".problem").forEach(function (card) {
      var id = card.getAttribute("data-id");
      var status = problemState(state, id);
      if (status) card.setAttribute("data-state", status);
      else card.removeAttribute("data-state");
      card.querySelectorAll("[data-action='attempted'], [data-action='solved']").forEach(function (button) {
        button.setAttribute("aria-pressed", button.getAttribute("data-action") === status ? "true" : "false");
      });
      syncDisclosure(card);
    });
    document.querySelectorAll("[data-explain]").forEach(function (box) {
      box.checked = !!(state.explain && state.explain[box.getAttribute("data-explain")]);
    });
    var solved = 0;
    var total = 0;
    (course.topics || []).forEach(function (topic) {
      var ids = topic.problems || [];
      var done = 0;
      ids.forEach(function (id) {
        total += 1;
        if (problemState(state, id) === "solved") {
          done += 1;
          solved += 1;
        }
      });
      var link = document.querySelector('[data-topic-link="' + topic.id + '"]');
      if (!link) return;
      var mark = ids.length && done === ids.length ? "done" : done > 0 ? "partial" : "";
      if (mark) link.setAttribute("data-state", mark);
      else link.removeAttribute("data-state");
    });
    var count = document.getElementById("progress-count");
    if (count && total) count.textContent = fmt("solvedCount", "{solved} / {total} solved", { solved: solved, total: total });
    paintContinue(state);
  }

  function paintContinue(state) {
    var box = document.getElementById("continue");
    if (!box) return;
    var link = document.getElementById("continue-link");
    var note = document.getElementById("continue-note");
    var next = null;
    var reason = "";
    (course.topics || []).some(function (topic) {
      var unsolved = (topic.problems || []).some(function (id) {
        return problemState(state, id) !== "solved";
      });
      if (unsolved) {
        next = topic;
        reason = text("unsolved", "Unsolved practice remains on this topic.");
        return true;
      }
      if (!(state.explain && state.explain[topic.id])) {
        next = topic;
        reason = text("unexplained", "You have not yet marked that you can explain this.");
        return true;
      }
      return false;
    });
    box.hidden = false;
    if (!next) {
      link.textContent = text("done", "You have marked the whole course solved and explained.");
      link.removeAttribute("href");
      note.textContent = "";
      return;
    }
    link.href = withDepth(next.href);
    link.textContent = next.title;
    note.textContent = reason;
  }

  function syncDisclosure(card) {
    var solution = card.querySelector(".solution");
    var solutionButton = card.querySelector("[data-action='solution']");
    if (solutionButton) {
      var open = !!(solution && !solution.hasAttribute("hidden"));
      solutionButton.setAttribute("aria-expanded", open ? "true" : "false");
    }
    var hintButton = card.querySelector("[data-action='hint']");
    if (hintButton) {
      var shown = card.querySelectorAll(".hint:not([hidden])").length;
      hintButton.setAttribute("aria-expanded", shown > 0 ? "true" : "false");
    }
  }

  function resetPractice(card) {
    if (card.getAttribute("data-kind") === "worked") return;
    card.querySelectorAll(".hint, .solution").forEach(function (node) {
      node.hidden = true;
    });
    var hints = card.querySelectorAll(".hint");
    var hintButton = card.querySelector("[data-action='hint']");
    if (hintButton && hints.length) {
      hintButton.hidden = false;
      hintButton.textContent = fmt("hint", "Show hint ({n} of {total})", { n: 1, total: hints.length });
    }
    var solutionButton = card.querySelector("[data-action='solution']");
    if (solutionButton) solutionButton.textContent = text("showSolution", "Show solution");
  }

  document.body.addEventListener("click", function (event) {
    var button = event.target.closest("[data-action]");
    if (!button) return;
    var action = button.getAttribute("data-action");
    var card = button.closest(".problem");

    if (action === "hint" && card) {
      var next = card.querySelector(".hint[hidden]");
      if (next) next.hidden = false;
      var remaining = card.querySelector(".hint[hidden]");
      if (!remaining) button.hidden = true;
      else {
        var shown = card.querySelectorAll(".hint:not([hidden])").length;
        var totalHints = card.querySelectorAll(".hint").length;
        button.textContent = fmt("nextHint", "Next hint ({n} of {total})", { n: shown + 1, total: totalHints });
      }
      syncDisclosure(card);
      if (card.getAttribute("data-track") === "yes") setProblem(card.getAttribute("data-id"), "attempted");
      return;
    }

    if (action === "solution" && card) {
      var solution = card.querySelector(".solution");
      if (!solution) return;
      var opening = solution.hasAttribute("hidden");
      solution.hidden = !opening;
      button.textContent = opening ? text("hideSolution", "Hide solution") : text("showSolution", "Show solution");
      syncDisclosure(card);
      if (opening && card.getAttribute("data-track") === "yes") {
        setProblem(card.getAttribute("data-id"), "attempted");
      }
      return;
    }

    if ((action === "attempted" || action === "solved") && card) {
      setProblem(card.getAttribute("data-id"), action);
      return;
    }

    if (action === "grade") {
      grade(button.closest(".check"));
      return;
    }

    if (action === "show-all") {
      var open = document.body.classList.toggle("solutions-open");
      button.setAttribute("aria-pressed", open ? "true" : "false");
      document.querySelectorAll(".problem").forEach(function (problem) {
        if (!open) {
          resetPractice(problem);
        } else {
          problem.querySelectorAll(".hint, .solution").forEach(function (node) {
            node.hidden = false;
          });
          var hintButton = problem.querySelector("[data-action='hint']");
          if (hintButton) hintButton.hidden = true;
          var solutionButton = problem.querySelector("[data-action='solution']");
          if (solutionButton) solutionButton.textContent = text("hideSolution", "Hide solution");
        }
        syncDisclosure(problem);
      });
      button.textContent = open ? text("hideAll", "Hide solutions") : text("showAll", "Show all solutions");
      return;
    }
  });

  function grade(card) {
    if (!card) return;
    var chosen = card.querySelector("input[type=radio]:checked");
    var why = card.querySelector(".check-why");
    var result = card.querySelector(".check-result");
    result.hidden = false;
    if (!chosen) {
      result.textContent = text("choose", "Choose an answer first.");
      result.removeAttribute("data-ok");
      return;
    }
    var ok = chosen.getAttribute("data-correct") === "true";
    result.textContent = ok ? text("yes", "Yes. That is the one.") : text("no", "Not this one. The reason is below.");
    result.setAttribute("data-ok", ok ? "yes" : "no");
    if (why) why.hidden = false;
  }

  document.body.addEventListener("change", function (event) {
    var box = event.target;
    if (!box.matches || !box.matches("[data-explain]")) return;
    var state = load();
    state.explain = state.explain || {};
    state.explain[box.getAttribute("data-explain")] = box.checked;
    save(state);
    paint();
  });

  var input = document.getElementById("q");
  var results = document.getElementById("search-results");
  if (input && results) {
    input.addEventListener("input", function () {
      var query = input.value.trim().toLowerCase();
      if (!query) {
        results.hidden = true;
        results.innerHTML = "";
        return;
      }
      var hits = [];
      (window.STUDY_INDEX || []).some(function (item) {
        var haystack = (item.title + " " + item.text).toLowerCase();
        if (haystack.indexOf(query) !== -1) hits.push(item);
        return hits.length >= 12;
      });
      results.hidden = false;
      if (!hits.length) {
        results.innerHTML = '<p class="search-empty">' + escapeText(text("nothing", "Nothing matches.")) + "</p>";
        return;
      }
      results.innerHTML = hits.map(function (item) {
        return '<a href="' + escapeText(withDepth(item.href)) + '"><span class="kicker">' +
          escapeText(item.kind) + "</span> " + escapeText(item.title) + "</a>";
      }).join("");
    });
    input.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        input.value = "";
        results.hidden = true;
      }
    });
    document.addEventListener("click", function (event) {
      if (!event.target.closest(".search")) results.hidden = true;
    });
  }

  var yearFilter = document.getElementById("filter-year");
  var topicFilter = document.getElementById("filter-topic");

  function applyFilters() {
    if (!yearFilter || !topicFilter) return;
    var year = yearFilter.value;
    var topic = topicFilter.value;
    var shown = 0;
    document.querySelectorAll("#drill-list .exam-year").forEach(function (section) {
      var any = false;
      section.querySelectorAll(".problem").forEach(function (card) {
        var ok = (year === "all" || card.getAttribute("data-year") === year) &&
          (topic === "all" || card.getAttribute("data-topic") === topic);
        card.hidden = !ok;
        if (ok) {
          any = true;
          shown += 1;
        }
      });
      section.hidden = !any;
    });
    var empty = document.getElementById("drill-empty");
    if (empty) empty.hidden = shown !== 0;
  }

  if (yearFilter) yearFilter.addEventListener("change", applyFilters);
  if (topicFilter) topicFilter.addEventListener("change", applyFilters);

  function renderMath(root) {
    if (!window.renderMathInElement) return;
    window.renderMathInElement(root || document.body, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false
    });
  }

  var topics = document.querySelector(".nav-topics");
  if (topics && !window.matchMedia("(min-width: 1100px)").matches) topics.open = false;

  paint();
  renderMath(document.body);
})();
