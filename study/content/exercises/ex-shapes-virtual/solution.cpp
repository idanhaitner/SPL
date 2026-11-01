class Shape {
  public:
    virtual ~Shape() {
    }

    virtual int area() const = 0;
};

class Rectangle : public Shape {
  public:
    Rectangle(int width, int height) : _width(width), _height(height) {
    }

    int area() const {
        return _width * _height;
    }

  private:
    int _width;
    int _height;
};

class Square : public Shape {
  public:
    Square(int side) : _side(side) {
    }

    int area() const {
        return _side * _side;
    }

  private:
    int _side;
};

int totalArea(Shape** shapes, int count) {
    int total = 0;
    for (int i = 0; i < count; i++) {
        total += shapes[i]->area();
    }
    return total;
}
