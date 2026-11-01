#include <vector>

class Image {
  public:
    Image(int width, int height) : _width(width), _height(height), _bytes(width * height) {
    }

    int width() const {
        return _width;
    }

    int height() const {
        return _height;
    }

    void set(int x, int y, char value) {
        _bytes[y * _width + x] = value;
    }

    char get(int x, int y) const {
        return _bytes[y * _width + x];
    }

    const char* pixels() const {
        return &_bytes[0];
    }

  private:
    int _width;
    int _height;
    std::vector<char> _bytes;
};
