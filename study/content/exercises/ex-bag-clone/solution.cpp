class Bag {
  public:
    Bag(int items) : _items(items) {
    }

    virtual ~Bag() {
    }

    int items() const {
        return _items;
    }

    void setItems(int items) {
        _items = items;
    }

    virtual int capacity() const {
        return 5;
    }

    virtual Bag* clone() const {
        return new Bag(*this);
    }

  private:
    int _items;
};

class Bag7 : public Bag {
  public:
    Bag7(int items) : Bag(items) {
    }

    int capacity() const {
        return 7;
    }

    Bag* clone() const {
        return new Bag7(*this);
    }
};

class Bag12 : public Bag {
  public:
    Bag12(int items) : Bag(items) {
    }

    int capacity() const {
        return 12;
    }

    Bag* clone() const {
        return new Bag12(*this);
    }
};

class Locker {
  public:
    Locker(Bag* bag) : _bag(bag) {
    }

    ~Locker() {
        delete _bag;
    }

    Locker(const Locker& other) : _bag(other._bag->clone()) {
    }

    Locker& operator=(const Locker& other) {
        if (this != &other) {
            delete _bag;
            _bag = other._bag->clone();
        }
        return *this;
    }

    Bag* bag() const {
        return _bag;
    }

  private:
    Bag* _bag;
};
