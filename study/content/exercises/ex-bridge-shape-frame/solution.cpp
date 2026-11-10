#include <utility>

class Shape {
  public:
    static int alive;

    Shape() {
        alive = alive + 1;
    }

    Shape(const Shape&) {
        alive = alive + 1;
    }

    virtual ~Shape() {
        alive = alive - 1;
    }

    virtual int area() const = 0;
    virtual Shape* clone() const = 0;
};

int Shape::alive = 0;

class Square : public Shape {
  public:
    Square(int side) : _side(side) {
    }

    int area() const {
        return _side * _side;
    }

    Shape* clone() const {
        return new Square(*this);
    }

  private:
    int _side;
};

class Rect : public Shape {
  public:
    Rect(int width, int height) : _width(width), _height(height) {
    }

    int area() const {
        return _width * _height;
    }

    Shape* clone() const {
        return new Rect(*this);
    }

  private:
    int _width;
    int _height;
};

class Frame {
  public:
    Frame(Shape* shape) : _shape(shape) {
    }

    ~Frame() {
        delete _shape;
    }

    Frame(const Frame& other) : _shape(other._shape == nullptr ? nullptr : other._shape->clone()) {
    }

    Frame(Frame&& other) : _shape(other._shape) {
        other._shape = nullptr;
    }

    Frame& operator=(const Frame& other) {
        if (this != &other) {
            delete _shape;
            _shape = other._shape == nullptr ? nullptr : other._shape->clone();
        }
        return *this;
    }

    Frame& operator=(Frame&& other) {
        if (this != &other) {
            delete _shape;
            _shape = other._shape;
            other._shape = nullptr;
        }
        return *this;
    }

    bool empty() const {
        return _shape == nullptr;
    }

    int area() const {
        return _shape == nullptr ? 0 : _shape->area();
    }

  private:
    Shape* _shape;
};
