// A pocket reference for the coding steps: C++17 functions found by what they do, in plain words.
// It runs in the page with no server, so it only knows the entries below: the library a first C++ course reaches for.

export type CppFunction = {
  name: string;
  header: string;
  signature: string;
  does: string;
  example: string;
  // Words a student might use for this job, beyond the ones in `does`.
  words: string[];
};

export const CPP_REFERENCE: CppFunction[] = [
  // C strings
  { name: "std::strlen", header: "<cstring>", signature: "size_t strlen(const char* s)", does: "Counts the characters of a C string, not counting the closing '\\0'.", example: 'std::strlen("cat") // 3', words: ["length", "size", "count", "characters", "long", "char*", "c string"] },
  { name: "std::strcpy", header: "<cstring>", signature: "char* strcpy(char* dest, const char* src)", does: "Copies a C string, with its '\\0', into a buffer that must already be big enough.", example: "char* copy = new char[std::strlen(src) + 1];\nstd::strcpy(copy, src);", words: ["copy", "duplicate", "clone", "char*", "c string", "buffer"] },
  { name: "std::strncpy", header: "<cstring>", signature: "char* strncpy(char* dest, const char* src, size_t n)", does: "Copies at most n characters of a C string. It does not add '\\0' if src is that long.", example: "std::strncpy(name, src, 15);\nname[15] = '\\0';", words: ["copy", "limit", "bounded", "first n", "char*"] },
  { name: "std::strcmp", header: "<cstring>", signature: "int strcmp(const char* a, const char* b)", does: "Compares two C strings: 0 if equal, negative if a comes first, positive if b does.", example: 'if (std::strcmp(a, "quit") == 0) { ... }', words: ["compare", "equal", "same", "order", "sort", "char*", "c string"] },
  { name: "std::strcat", header: "<cstring>", signature: "char* strcat(char* dest, const char* src)", does: "Appends a C string to the end of another, in a buffer big enough for both.", example: 'std::strcat(path, ".txt");', words: ["append", "join", "concatenate", "add", "glue", "char*"] },
  { name: "std::strchr", header: "<cstring>", signature: "const char* strchr(const char* s, int c)", does: "Finds the first place a character appears in a C string, or nullptr.", example: "const char* dot = std::strchr(name, '.');", words: ["find", "search", "character", "position", "contains", "char*"] },
  { name: "std::strstr", header: "<cstring>", signature: "const char* strstr(const char* s, const char* part)", does: "Finds where one C string first appears inside another, or nullptr.", example: 'if (std::strstr(line, "error")) { ... }', words: ["find", "search", "substring", "contains", "inside", "char*"] },

  // std::string
  { name: "std::string (copy)", header: "<string>", signature: "std::string copy = other;", does: "Copies a std::string. The copy owns its own characters, so changing one leaves the other alone.", example: 'std::string a = "hi";\nstd::string b = a; // b is its own copy', words: ["copy", "duplicate", "clone", "assign", "string"] },
  { name: "std::string::size", header: "<string>", signature: "size_t size() const", does: "The number of characters in a std::string. length() is the same.", example: "for (size_t i = 0; i < s.size(); ++i) { ... }", words: ["length", "size", "count", "characters", "long", "string"] },
  { name: "std::string::empty", header: "<string>", signature: "bool empty() const", does: "True when the string has no characters.", example: "if (name.empty()) { ... }", words: ["empty", "blank", "no characters", "string"] },
  { name: "std::string::substr", header: "<string>", signature: "std::string substr(size_t pos, size_t count = npos) const", does: "A new string with count characters starting at pos.", example: 'std::string("hello").substr(1, 3) // "ell"', words: ["substring", "part", "slice", "cut", "piece", "string"] },
  { name: "std::string::find", header: "<string>", signature: "size_t find(const std::string& part, size_t from = 0) const", does: "Where part first appears, or std::string::npos if it does not.", example: "if (s.find(\"x\") != std::string::npos) { ... }", words: ["find", "search", "position", "index", "contains", "substring", "string"] },
  { name: "std::string::append", header: "<string>", signature: "std::string& operator+=(const std::string& more)", does: "Adds characters to the end of a string. + makes a new string from two.", example: 's += ", world";\nstd::string full = first + " " + last;', words: ["append", "join", "concatenate", "add", "plus", "glue", "string"] },
  { name: "std::string::compare (==)", header: "<string>", signature: "bool operator==(const std::string& a, const std::string& b)", does: "Compares two strings by their characters with ==, !=, and <.", example: 'if (command == "quit") { ... }', words: ["compare", "equal", "same", "order", "string"] },
  { name: "std::string::c_str", header: "<string>", signature: "const char* c_str() const", does: "The string's characters as a C string, for functions that take const char*.", example: "std::strlen(s.c_str())", words: ["convert", "char*", "c string", "pointer"] },
  { name: "std::string::push_back", header: "<string>", signature: "void push_back(char c)", does: "Adds one character to the end of a string.", example: "s.push_back('!');", words: ["append", "add", "character", "end", "string"] },
  { name: "std::to_string", header: "<string>", signature: "std::string to_string(int value)", does: "Turns a number into its text, also for long and double.", example: 'std::string label = "#" + std::to_string(id);', words: ["convert", "number", "int", "text", "string", "format"] },
  { name: "std::stoi", header: "<string>", signature: "int stoi(const std::string& s)", does: "Reads an int from the start of a string. std::stod reads a double.", example: 'int n = std::stoi("42"); // 42', words: ["convert", "parse", "number", "int", "text", "read"] },
  { name: "std::getline", header: "<string>", signature: "std::istream& getline(std::istream& in, std::string& line)", does: "Reads one whole line of input, spaces and all, without the newline.", example: "std::string line;\nwhile (std::getline(std::cin, line)) { ... }", words: ["read", "input", "line", "stdin", "cin"] },

  // Characters
  { name: "std::isdigit", header: "<cctype>", signature: "int isdigit(int c)", does: "Nonzero if c is a digit from '0' to '9'.", example: "if (std::isdigit(c)) { value = value * 10 + (c - '0'); }", words: ["digit", "number", "check", "character", "numeric"] },
  { name: "std::isalpha", header: "<cctype>", signature: "int isalpha(int c)", does: "Nonzero if c is a letter.", example: "if (std::isalpha(c)) { ... }", words: ["letter", "alphabetic", "check", "character"] },
  { name: "std::isspace", header: "<cctype>", signature: "int isspace(int c)", does: "Nonzero for a space, tab, or newline.", example: "while (std::isspace(*p)) ++p;", words: ["space", "whitespace", "blank", "check", "character", "trim"] },
  { name: "std::toupper", header: "<cctype>", signature: "int toupper(int c)", does: "The capital form of a letter. std::tolower gives the small form.", example: "c = static_cast<char>(std::toupper(c));", words: ["uppercase", "capital", "lowercase", "convert", "case", "character"] },

  // Memory
  { name: "new", header: "built in", signature: "T* p = new T(args);", does: "Allocates one object on the heap and constructs it. Release it with delete.", example: "int* box = new int(7);\ndelete box;", words: ["allocate", "heap", "create", "object", "memory", "dynamic"] },
  { name: "new[]", header: "built in", signature: "T* p = new T[count];", does: "Allocates an array on the heap. new T[count]() also sets every cell to zero. Release it with delete[].", example: "int* values = new int[size]();\ndelete[] values;", words: ["allocate", "array", "heap", "buffer", "memory", "dynamic", "zero"] },
  { name: "delete / delete[]", header: "built in", signature: "delete p;  delete[] arr;", does: "Destroys and releases what new allocated: delete for one object, delete[] for an array.", example: "delete[] _values;\n_values = nullptr;", words: ["free", "release", "deallocate", "destroy", "heap", "memory", "destructor"] },
  { name: "std::memcpy", header: "<cstring>", signature: "void* memcpy(void* dest, const void* src, size_t bytes)", does: "Copies raw bytes between buffers that do not overlap. The count is in bytes.", example: "std::memcpy(dest, src, size * sizeof(int));", words: ["copy", "bytes", "buffer", "array", "memory", "raw"] },
  { name: "std::memset", header: "<cstring>", signature: "void* memset(void* dest, int byte, size_t bytes)", does: "Sets every byte of a buffer to one value, usually 0.", example: "std::memset(buffer, 0, sizeof(buffer));", words: ["fill", "zero", "clear", "bytes", "buffer", "memory", "reset"] },
  { name: "sizeof", header: "built in", signature: "sizeof(T)  sizeof expr", does: "The size in bytes of a type or object, worked out by the compiler.", example: "sizeof(int) // 4 on most machines", words: ["size", "bytes", "memory", "type"] },

  // Smart pointers
  { name: "std::make_unique", header: "<memory>", signature: "std::unique_ptr<T> make_unique<T>(args...)", does: "Allocates an object owned by one unique_ptr, which deletes it when it goes away.", example: "auto shape = std::make_unique<Circle>(2.0);", words: ["smart pointer", "unique", "own", "allocate", "heap", "raii", "automatic delete"] },
  { name: "std::make_shared", header: "<memory>", signature: "std::shared_ptr<T> make_shared<T>(args...)", does: "Allocates an object shared by shared_ptrs; the last one to go deletes it.", example: "auto a = std::make_shared<int>(5);\nauto b = a; // two owners", words: ["smart pointer", "shared", "reference count", "own", "allocate", "heap"] },
  { name: "std::unique_ptr::get", header: "<memory>", signature: "T* get() const", does: "The raw pointer inside a smart pointer, without giving up ownership.", example: "print(owner.get());", words: ["raw pointer", "smart pointer", "address"] },

  // Moving and swapping
  { name: "std::swap", header: "<utility>", signature: "void swap(T& a, T& b)", does: "Exchanges the values of two variables.", example: "std::swap(_values, other._values);", words: ["swap", "exchange", "switch", "trade", "copy and swap"] },
  { name: "std::move", header: "<utility>", signature: "T&& move(T& value)", does: "Lets a value be moved from instead of copied, so a move constructor or move assignment runs.", example: "Buffer b = std::move(a); // a is left empty", words: ["move", "rvalue", "transfer", "steal", "rule of five"] },
  { name: "std::exchange", header: "<utility>", signature: "T exchange(T& obj, U new_value)", does: "Sets obj to a new value and returns the old one, handy in move constructors.", example: "_data = std::exchange(other._data, nullptr);", words: ["move", "replace", "reset", "old value", "rule of five"] },

  // Containers
  { name: "std::vector::push_back", header: "<vector>", signature: "void push_back(const T& value)", does: "Adds an element to the end of a vector, which grows as needed.", example: "std::vector<int> v;\nv.push_back(3);", words: ["append", "add", "insert", "list", "array", "grow", "vector"] },
  { name: "std::vector::size", header: "<vector>", signature: "size_t size() const", does: "How many elements a vector holds.", example: "for (size_t i = 0; i < v.size(); ++i) { ... }", words: ["length", "size", "count", "how many", "vector", "list"] },
  { name: "std::vector::at", header: "<vector>", signature: "T& at(size_t index)", does: "The element at index, checked: a bad index throws std::out_of_range. v[i] is unchecked.", example: "int first = v.at(0);", words: ["index", "element", "access", "get", "bounds", "vector"] },
  { name: "std::vector::erase", header: "<vector>", signature: "iterator erase(iterator pos)", does: "Removes the element at an iterator and closes the gap.", example: "v.erase(v.begin() + 2);", words: ["remove", "delete", "erase", "element", "vector"] },
  { name: "std::vector::clear", header: "<vector>", signature: "void clear()", does: "Removes every element.", example: "v.clear(); // v.size() is 0", words: ["clear", "empty", "remove all", "reset", "vector"] },
  { name: "std::vector::resize", header: "<vector>", signature: "void resize(size_t count)", does: "Changes how many elements a vector holds, adding zeros or dropping the end.", example: "v.resize(10);", words: ["resize", "grow", "shrink", "length", "vector"] },

  // Algorithms
  { name: "std::sort", header: "<algorithm>", signature: "void sort(Iter first, Iter last)", does: "Sorts a range into ascending order.", example: "std::sort(v.begin(), v.end());", words: ["sort", "order", "ascending", "arrange", "vector", "array"] },
  { name: "std::find", header: "<algorithm>", signature: "Iter find(Iter first, Iter last, const T& value)", does: "The first element equal to value, or last if there is none.", example: "if (std::find(v.begin(), v.end(), 7) != v.end()) { ... }", words: ["find", "search", "contains", "element", "index", "vector", "array"] },
  { name: "std::copy", header: "<algorithm>", signature: "Out copy(In first, In last, Out dest)", does: "Copies a range of elements into another, element by element.", example: "std::copy(other._values, other._values + _size, _values);", words: ["copy", "array", "elements", "range", "deep copy", "duplicate"] },
  { name: "std::fill", header: "<algorithm>", signature: "void fill(Iter first, Iter last, const T& value)", does: "Sets every element of a range to one value.", example: "std::fill(values, values + size, 0);", words: ["fill", "set all", "zero", "initialize", "array", "reset"] },
  { name: "std::reverse", header: "<algorithm>", signature: "void reverse(Iter first, Iter last)", does: "Reverses the order of a range in place.", example: "std::reverse(s.begin(), s.end());", words: ["reverse", "backwards", "flip", "order"] },
  { name: "std::min / std::max", header: "<algorithm>", signature: "const T& min(const T& a, const T& b)", does: "The smaller or larger of two values.", example: "int best = std::max(best, score);", words: ["minimum", "maximum", "smaller", "larger", "biggest", "smallest", "compare"] },
  { name: "std::accumulate", header: "<numeric>", signature: "T accumulate(Iter first, Iter last, T start)", does: "Adds up a range, starting from start.", example: "int total = std::accumulate(v.begin(), v.end(), 0);", words: ["sum", "total", "add up", "running total", "accumulate", "vector", "array"] },

  // Numbers
  { name: "std::abs", header: "<cstdlib>", signature: "int abs(int n)", does: "The absolute value of a number.", example: "std::abs(-4) // 4", words: ["absolute", "positive", "distance", "number"] },
  { name: "std::sqrt / std::pow", header: "<cmath>", signature: "double sqrt(double x)  double pow(double base, double exp)", does: "Square root, and one number raised to a power.", example: "double area = M_PI * std::pow(r, 2);", words: ["square root", "power", "exponent", "math", "number"] },

  // Input and output
  { name: "std::cout", header: "<iostream>", signature: "std::ostream& operator<<(std::ostream& out, value)", does: "Prints values to standard output. std::endl or '\\n' ends the line.", example: 'std::cout << "total: " << total << "\\n";', words: ["print", "output", "write", "display", "show", "stdout", "console"] },
  { name: "std::cin", header: "<iostream>", signature: "std::istream& operator>>(std::istream& in, T& value)", does: "Reads a value from standard input, skipping spaces before it.", example: "int n;\nstd::cin >> n;", words: ["read", "input", "stdin", "scan", "keyboard"] },
  { name: "std::cerr", header: "<iostream>", signature: "std::ostream std::cerr", does: "Prints to standard error, for messages that are not the program's output.", example: 'std::cerr << "bad input\\n";', words: ["error", "print", "stderr", "debug", "message"] },
];

// Words that say nothing about the job.
const FILLER = new Set(["a", "an", "the", "of", "to", "in", "on", "for", "and", "or", "i", "how", "do", "can", "my", "is", "it", "with", "from", "into", "want", "need", "what", "c", "c++", "cpp", "function", "use", "get", "make", "two", "one"]);

// Plain words people use, folded onto the ones the entries are tagged with.
const SAME: Record<string, string> = {
  len: "length", long: "length", chars: "characters", char: "characters", letters: "characters",
  strings: "string", str: "string", text: "string", word: "string",
  duplicate: "copy", clone: "copy", copies: "copy", copying: "copy",
  concat: "concatenate", join: "concatenate", combine: "concatenate",
  equals: "equal", equality: "equal", same: "equal",
  free: "release", dealloc: "release", deallocate: "release",
  malloc: "allocate", alloc: "allocate", allocating: "allocate",
  list: "vector", lists: "vector", arrays: "array",
  sum: "total", biggest: "maximum", largest: "maximum", max: "maximum", smallest: "minimum", min: "minimum",
  search: "find", locate: "find", contains: "find",
  printing: "print", display: "print",
};

const normalize = (word: string) => SAME[word] ?? word;

// What a value is, rather than what to do with it: these alone should not pull up every string or vector entry.
const SUBJECTS = new Set(["string", "vector", "array", "characters"]);

function wordsOf(text: string) {
  return text.toLowerCase().split(/[^a-z0-9+*_:]+/).filter((word) => word && !FILLER.has(word)).map(normalize);
}

// Ranks entries by how many of the query's words they cover, weighting the name and tagged words over the description.
export function findFunctions(query: string, limit = 6): CppFunction[] {
  const wanted = wordsOf(query);
  if (wanted.length === 0) return [];
  const scored = CPP_REFERENCE.map((entry, order) => {
    const name = entry.name.toLowerCase();
    const tags = entry.words.flatMap((tag) => wordsOf(tag));
    const said = wordsOf(entry.does);
    let score = 0;
    let covered = 0;
    for (const word of wanted) {
      const tagged = tags.some((tag) => tag === word) ? 3 : tags.some((tag) => tag.length > 3 && word.length > 3 && (tag.startsWith(word) || word.startsWith(tag))) ? 1.5 : 0;
      // The name and the tags often say the same word, so the stronger of the two counts, not both.
      const strength = Math.max(name.includes(word) ? 4 : 0, tagged) + (said.includes(word) ? 1 : 0);
      const hit = SUBJECTS.has(word) ? Math.min(strength, 1.5) : strength;
      if (hit > 0) covered += 1;
      score += hit;
    }
    // An entry that covers every word beats one that matches a single word strongly.
    return { entry, score: score + covered * 2 + (covered === wanted.length ? 3 : 0), order };
  });
  return scored.filter((item) => item.score > 2).sort((a, b) => b.score - a.score || a.order - b.order).slice(0, limit).map((item) => item.entry);
}

export const SUGGESTIONS = ["copy a string", "length of a string", "compare two strings", "allocate an array", "swap two values", "print a number"];
