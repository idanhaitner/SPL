// clang-format compiled to WebAssembly. It is about 2.5 MB, so it loads the first time it is needed.

// The style of the course's C++: 4 spaces, braces on the same line, `int* p`.
export const CODE_STYLE = JSON.stringify({
  BasedOnStyle: "LLVM",
  IndentWidth: 4,
  DerivePointerAlignment: false,
  PointerAlignment: "Left",
  ColumnLimit: 100,
  AllowShortFunctionsOnASingleLine: "None",
  AllowShortBlocksOnASingleLine: "Never",
  AllowShortIfStatementsOnASingleLine: "Never",
  AllowShortLoopsOnASingleLine: false,
  ReflowComments: false,
  SortIncludes: "Never",
});

type Format = (source: string, filename: string, style: string) => string;

let loaded: Promise<Format> | null = null;

function load(): Promise<Format> {
  loaded ??= import("@wasm-fmt/clang-format/web")
    .then(async (m) => {
      await m.default();
      return m.format as Format;
    })
    .catch((error) => {
      // A failed download may be a passing network problem, so the next call tries again.
      loaded = null;
      throw error;
    });
  return loaded;
}

// Formatting only tidies, so when it cannot run the code simply stays as it is.
export async function formatCode(source: string): Promise<string> {
  try {
    const format = await load();
    return format(source, "main.cpp", CODE_STYLE);
  } catch {
    return source;
  }
}
