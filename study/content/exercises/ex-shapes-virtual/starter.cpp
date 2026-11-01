class Shape {
  public:
    ~Shape() {
    }

    int area() const {
        return 0;
    }
};

class Rectangle : public Shape {
  public:
    Rectangle(int width, int height) {
    }

    int area() const {
        return 0;
    }

  private:
    int _width;
    int _height;
};

class Square : public Shape {
  public:
    Square(int side) {
    }

    int area() const {
        return 0;
    }

  private:
    int _side;
};

int totalArea(Shape** shapes, int count) {
    return 0;
}
