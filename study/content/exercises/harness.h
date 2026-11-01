#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#define CHECK(name, cond, ...) do { if (cond) { printf("PASS %s\n", name); } else { printf("FAIL %s: ", name); printf(__VA_ARGS__); printf("\n"); } fflush(stdout); } while (0)
