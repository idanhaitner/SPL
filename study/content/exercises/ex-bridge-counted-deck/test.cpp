static int firstOf(Deck byValue) {
    return byValue.get(0);
}

int main() {
    CHECK("no decks at the start", Deck::alive == 0, "Deck::alive should start at 0, but it is %d", Deck::alive);
    {
        Deck first(3);
        CHECK("a new deck is all zeros", first.size() == 3 && first.get(0) == 0 && first.get(1) == 0 && first.get(2) == 0, "Deck(3) should hold three zeros");
        CHECK("constructor counts the deck", Deck::alive == 1, "after one Deck is built, Deck::alive should be 1, but it is %d", Deck::alive);

        first.set(0, 7);
        first.set(2, 9);
        Deck second = first;
        CHECK("copy has the same cards", second.size() == 3 && second.get(0) == 7 && second.get(1) == 0 && second.get(2) == 9, "the copy should hold 7, 0, 9, but it holds %d, %d, %d", second.get(0), second.get(1), second.get(2));
        CHECK("copy constructor counts the deck", Deck::alive == 2, "after a copy is built, Deck::alive should be 2, but it is %d", Deck::alive);

        second.set(0, 1);
        CHECK("copy owns its own array", first.get(0) == 7, "changing the copy should not change the original, but the original's first card is now %d", first.get(0));

        int seen = firstOf(first);
        CHECK("pass by value copies and destroys", seen == 7 && Deck::alive == 2, "a deck passed by value is copied and then destroyed, so Deck::alive should be back to 2, but it is %d", Deck::alive);
        CHECK("original survives pass by value", first.get(0) == 7 && first.get(2) == 9, "after the by-value copy was destroyed, the original should still hold 7 and 9, but it holds %d and %d", first.get(0), first.get(2));

        Deck third(1);
        third = first;
        CHECK("assignment copies the cards", third.size() == 3 && third.get(0) == 7 && third.get(2) == 9, "after third = first, third should have size 3 and hold 7 and 9, but its size is %d", third.size());
        CHECK("assignment does not change the count", Deck::alive == 3, "three decks exist, so Deck::alive should be 3, but it is %d", Deck::alive);

        third.set(2, 4);
        CHECK("assigned deck owns its own array", first.get(2) == 9, "changing third should not change first, but first's last card is now %d", first.get(2));

        Deck& same = third;
        third = same;
        CHECK("self-assignment keeps the cards", third.size() == 3 && third.get(0) == 7 && third.get(2) == 4, "after third = third, it should still hold 7 and 4, but it holds %d and %d", third.get(0), third.get(2));
    }
    CHECK("destructors count down", Deck::alive == 0, "every deck was destroyed, so Deck::alive should be 0, but it is %d", Deck::alive);

    Deck* heap = new Deck(2);
    CHECK("a heap deck is counted", Deck::alive == 1, "after new Deck(2), Deck::alive should be 1, but it is %d", Deck::alive);
    delete heap;
    CHECK("delete runs the destructor", Deck::alive == 0, "after delete, Deck::alive should be 0, but it is %d", Deck::alive);
    return 0;
}
