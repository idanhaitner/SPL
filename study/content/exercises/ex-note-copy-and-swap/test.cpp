int main() {
    char source[] = "hello";
    Note fromArray(source);
    source[0] = 'j';
    CHECK("the constructor copies the text", strcmp(fromArray.text(), "hello") == 0, "changing the caller's array afterwards should leave the note as hello, but it is \"%s\"", fromArray.text());

    Note original("one");
    Note copy(original);
    CHECK("copy has the same text", strcmp(copy.text(), "one") == 0, "a copy of a note saying one should say one, but it says \"%s\"", copy.text());
    CHECK("copy has its own buffer", strcmp(copy.text(), "one") == 0 && copy.text() != original.text(), "the copy and the original should have different buffers, but copy.text() and original.text() are the same address or the text is wrong (\"%s\")", copy.text());

    Note left("left");
    Note right("right");
    const char* leftBuffer = left.text();
    const char* rightBuffer = right.text();
    left.swap(right);
    CHECK("swap trades the text", strcmp(left.text(), "right") == 0 && strcmp(right.text(), "left") == 0, "after the swap, left should say right and right should say left, but they say \"%s\" and \"%s\"", left.text(), right.text());
    CHECK("swap trades the buffers", strcmp(left.text(), "right") == 0 && left.text() == rightBuffer && right.text() == leftBuffer, "swap should trade the two pointers, so each note ends up with the other's old address, but the addresses did not trade");

    Note shortNote("hi");
    Note longNote("a longer note");
    shortNote = longNote;
    CHECK("assignment copies the text", strcmp(shortNote.text(), "a longer note") == 0, "after shortNote = longNote, shortNote should say a longer note, but it says \"%s\"", shortNote.text());
    CHECK("assignment gives its own buffer", strcmp(shortNote.text(), "a longer note") == 0 && shortNote.text() != longNote.text(), "after the assignment, the two notes should have different buffers, but they share an address or the text is wrong (\"%s\")", shortNote.text());
    CHECK("assignment leaves the other note", strcmp(longNote.text(), "a longer note") == 0, "the right side of an assignment should not change, but it now says \"%s\"", longNote.text());

    Note a("a");
    Note b("b");
    Note c("c");
    a = b = c;
    CHECK("chained assignment", strcmp(a.text(), "c") == 0 && strcmp(b.text(), "c") == 0, "after a = b = c, a and b should both say c, but they say \"%s\" and \"%s\"", a.text(), b.text());

    Note solo("alone");
    Note& sameObject = solo;
    solo = sameObject;
    CHECK("self-assignment keeps the text", strcmp(solo.text(), "alone") == 0, "assigning a note to itself should keep the text alone, but it says \"%s\"", solo.text());

    Note keeper("keep me");
    {
        Note holder("old");
        holder = keeper;
    }
    CHECK("destroying a copy leaves the original", strcmp(keeper.text(), "keep me") == 0, "destroying a note that was assigned from keeper should leave keeper saying keep me, but it says \"%s\"", keeper.text());
    return 0;
}
