export const LANGUAGE_DEFAULTS: Record<string, string> = {
    javascript: "// Starting code here\nconsole.log('Hello JavaScript');\n",
    typescript: "// Starting code here\nconsole.log('Hello TypeScript');\n",
    python: "# Starting code here\nprint('Hello Python')\n",
    java: "// Starting code here\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello Java\");\n    }\n}\n",
    cpp: "// Starting code here\n#include <iostream>\n\nint main() {\n    std::cout << \"Hello C++\" << std::endl;\n    return 0;\n}\n",
    csharp: "// Starting code here\nusing System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine(\"Hello C#\");\n    }\n}\n",
    go: "// Starting code here\npackage main\n\nimport \"fmt\"\n\nfunc main() {\n    fmt.Println(\"Hello Go\")\n}\n",
    rust: "// Starting code here\nfn main() {\n    println!(\"Hello Rust\");\n}\n",
    ruby: "# Starting code here\nputs 'Hello Ruby'\n",
    php: "<?php\n// Starting code here\necho \"Hello PHP\";\n",
    sql: "-- Starting code here\nSELECT 'Hello SQL';\n",
    html: "<!-- Starting code here -->\n<!DOCTYPE html>\n<html>\n<body>\n    <h1>Hello HTML</h1>\n</body>\n</html>\n",
    css: "/* Starting code here */\nbody {\n    font-family: sans-serif;\n}\n",
    json: "{\n    \"message\": \"Hello JSON\"\n}\n"
};
