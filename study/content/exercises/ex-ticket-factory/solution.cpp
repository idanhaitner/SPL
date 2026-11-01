class Ticket {
    const int _seat;

    Ticket(int seat) : _seat(seat) {
    }

  public:
    static Ticket* create(int seat) {
        if (seat < 1) {
            return nullptr;
        }
        return new Ticket(seat);
    }
    int seat() const {
        return _seat;
    }
};
