#!/usr/bin/env bash
# Compile and run every practice file, or the finished copies with:
#   ./check.sh solutions
set -u
cd "$(dirname "$0")"

mode="${1:-practice}"
if [[ "$mode" == "solutions" ]]; then
  dir="solutions"
else
  dir="."
fi

cxx=(g++ -std=c++17 -Wall -Wextra -Wno-unused-parameter -pthread)
fail=0

run_one() {
  local src="$1"
  local base
  base="$(basename "$src")"
  local stem="${base%.*}"
  echo
  echo "======== $base ========"
  case "$base" in
    *.cpp)
      local bin
      bin="$(mktemp)"
      if ! "${cxx[@]}" -o "$bin" "$src"; then
        echo "compile failed: $base"
        fail=1
        rm -f "$bin"
        return
      fi
      if ! "$bin"; then
        echo "run failed: $base"
        fail=1
      fi
      rm -f "$bin"
      ;;
    *.java)
      local out
      out="$(mktemp -d)"
      if ! javac -d "$out" "$src"; then
        echo "compile failed: $base"
        fail=1
        rm -rf "$out"
        return
      fi
      if ! java -cp "$out" "$stem"; then
        echo "run failed: $base"
        fail=1
      fi
      rm -rf "$out"
      ;;
    *.py)
      if ! python3 "$src"; then
        echo "run failed: $base"
        fail=1
      fi
      ;;
  esac
}

if [[ "$mode" == "solutions" ]]; then
  for src in solutions/*.cpp solutions/*.java solutions/*.py; do
    run_one "$src"
  done
else
  for src in *.cpp *.java *.py; do
    [[ "$src" == "check.sh" ]] && continue
    run_one "$src"
  done
fi

echo
if [[ "$fail" -eq 0 ]]; then
  echo "Finished the $mode run."
else
  echo "Some $mode files failed."
fi
exit "$fail"
