# Build the lessons from the c++ directory:
#   make run LESSON=01-program
#   make try LESSON=01-program
#   make test

CXX      ?= c++
CXXFLAGS ?= -std=c++17 -Wall -Wextra -Wpedantic -Wno-unused-parameter -I include
BUILD    := build

LESSONS := \
	01-program \
	02-types \
	03-expressions \
	04-control-flow \
	05-functions \
	06-arrays-and-text \
	07-references \
	08-pointers \
	09-memory \
	10-build \
	11-classes \
	12-rule-of-three \
	13-rule-of-five \
	14-inheritance \
	15-capstone

DEMOS      := $(addprefix $(BUILD)/, $(addsuffix -demo, $(LESSONS)))
EXERCISES  := $(addprefix $(BUILD)/, $(addsuffix -exercise, $(LESSONS)))
SOLUTIONS  := $(addprefix $(BUILD)/, $(addsuffix -solution, $(LESSONS)))

.PHONY: all demos exercises test test-asan run try clean

all: demos exercises

demos: $(DEMOS) $(BUILD)/10-build-split

exercises: $(EXERCISES)

test: $(SOLUTIONS)
	@fail=0; \
	for n in $(LESSONS); do \
		echo; echo "== $$n"; \
		./$(BUILD)/$$n-solution || fail=1; \
	done; \
	exit $$fail

test-asan:
	$(MAKE) clean
	$(MAKE) test CXXFLAGS="-std=c++17 -Wall -Wextra -Wpedantic -Wno-unused-parameter -I include -fsanitize=address -g"

run: $(BUILD)/$(LESSON)-demo
	./$(BUILD)/$(LESSON)-demo

try: $(BUILD)/$(LESSON)-exercise
	./$(BUILD)/$(LESSON)-exercise

clean:
	rm -rf $(BUILD)

$(BUILD):
	mkdir -p $(BUILD)

$(BUILD)/%-demo: %/demo.cpp | $(BUILD)
	$(CXX) $(CXXFLAGS) -o $@ $<

$(BUILD)/%-exercise: %/exercise.cpp | $(BUILD)
	$(CXX) $(CXXFLAGS) -o $@ $<

$(BUILD)/%-solution: %/solution.cpp | $(BUILD)
	$(CXX) $(CXXFLAGS) -o $@ $<

$(BUILD)/10-build-split: 10-build/split/main.cpp 10-build/split/mathx.cpp | $(BUILD)
	$(CXX) $(CXXFLAGS) -o $@ 10-build/split/main.cpp 10-build/split/mathx.cpp
