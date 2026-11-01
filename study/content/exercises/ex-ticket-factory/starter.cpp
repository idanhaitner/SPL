class Ticket {
  public:
    Ticket(int seat) {
    }
    static Ticket* create(int seat) {
        return nullptr;
    }
    int seat() const {
        return 0;
    }
};
