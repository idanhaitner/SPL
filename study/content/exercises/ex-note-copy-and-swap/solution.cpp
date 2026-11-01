#include <cstring>
#include <utility>

class Note {
  public:
    Note(const char* text) : _text(new char[std::strlen(text) + 1]) {
        std::strcpy(_text, text);
    }

    ~Note() {
        delete[] _text;
    }

    Note(const Note& other) : Note(other._text) {
    }

    void swap(Note& other) {
        std::swap(_text, other._text);
    }

    Note& operator=(const Note& other) {
        Note temp(other);
        swap(temp);
        return *this;
    }

    const char* text() const {
        return _text;
    }

  private:
    char* _text;
};
