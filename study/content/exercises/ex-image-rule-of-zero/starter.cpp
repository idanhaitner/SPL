#include <vector>

class Image {
  public:
    Image(int width, int height) {
    }

    int width() const {
        return 0;
    }

    int height() const {
        return 0;
    }

    void set(int x, int y, char value) {
    }

    char get(int x, int y) const {
        return 0;
    }

    const char* pixels() const {
        return nullptr;
    }

  private:
    int _width;
    int _height;
};
