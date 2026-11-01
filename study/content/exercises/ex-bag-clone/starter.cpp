class Bag {
  public:
    Bag(int items) {
    }

    virtual ~Bag() {
    }

    int items() const {
        return 0;
    }

    void setItems(int items) {
    }

    virtual int capacity() const {
        return 0;
    }

    virtual Bag* clone() const {
        return nullptr;
    }

  private:
    int _items;
};

class Bag7 : public Bag {
  public:
    Bag7(int items) : Bag(items) {
    }

    int capacity() const {
        return 0;
    }

    Bag* clone() const {
        return nullptr;
    }
};

class Bag12 : public Bag {
  public:
    Bag12(int items) : Bag(items) {
    }

    int capacity() const {
        return 0;
    }

    Bag* clone() const {
        return nullptr;
    }
};

class Locker {
  public:
    Locker(Bag* bag) : _bag(bag) {
    }

    ~Locker() {
        delete _bag;
    }

    Locker(const Locker& other) : _bag(nullptr) {
    }

    Locker& operator=(const Locker& other) {
        return *this;
    }

    Bag* bag() const {
        return _bag;
    }

  private:
    Bag* _bag;
};
