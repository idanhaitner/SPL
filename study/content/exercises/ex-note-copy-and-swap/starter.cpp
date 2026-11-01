#include <cstring>
#include <utility>

class Note {
  public:
    Note(const char* text) {
    }

    ~Note() {
    }

    Note(const Note& other) {
    }

    void swap(Note& other) {
    }

    Note& operator=(const Note& other) {
        return *this;
    }

    const char* text() const {
        return "";
    }

  private:
    char* _text;
};
