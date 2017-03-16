"use babel";

export default {
  config: {
    execPath: {
      type: "string",
      default: "emcc"
    },
    includePaths: {
      type: "array",
      default: ["."]
    },
    suppressWarnings: {
      type: "boolean",
      default: false
    },
    defaultCFlags: {
      type: "string",
      default: "-Wall"
    },
    defaultCppFlags: {
      type: "string",
      default: "-Wall -std=c++11"
    },
    defaultObjCFlags: {
      type: "string",
      default: ""
    },
    defaultObjCppFlags: {
      type: "string",
      default: ""
    },
    errorLimit: {
      type: "integer",
      default: 0
    },
    verboseDebug: {
      type: "boolean",
      default: false
    }
  },

  activate() {
    require("atom-package-deps").install("linter-emscripten");
  },

  provideLinter() {
    const helpers = require("atom-linter");
    const clangFlags = require("clang-flags");
    const regex = "(?<file>.+):(?<line>\\d+):(?<col>\\d+):(\{(?<lineStart>\\d+):(?<colStart>\\d+)\-(?<lineEnd>\\d+):(?<colEnd>\\d+)}.*:)? (?<type>[\\w \\-]+): (?<message>.*)";
    return {
      name: "Emscripten",
      grammarScopes: ["source.c", "source.cpp", "source.objc", "source.objcpp"],
      scope: "file",
      lintOnFly: false,
      lint: (activeEditor) => {
        const command = atom.config.get("linter-emscripten.execPath");
        const file = activeEditor.getPath();
        const args = ["-fsyntax-only",
          "-fno-caret-diagnostics",
          "-fno-diagnostics-fixit-info",
          "-fdiagnostics-print-source-range-info",
          "-fexceptions"];

        const grammar = activeEditor.getGrammar().name;

        if(/^C\+\+/.test(grammar)) {
          //const language = "c++";
          args.push("-xc++");
          args.push(...atom.config.get("linter-emscripten.defaultCppFlags").split(/\s+/));
        }
        if(grammar === "Objective-C++") {
          //const language = "objective-c++";
          args.push("-xobjective-c++");
          args.push(...atom.config.get("linter-emscripten.defaultObjCppFlags").split(/\s+/));
        }
        if(grammar === "C") {
          //const language = "c";
          args.push("-xc");
          args.push(...atom.config.get("linter-emscripten.defaultCFlags").split(/\s+/));
        }
        if(grammar === "Objective-C") {
          //const language = "objective-c";
          args.push("-xobjective-c");
          args.push(...atom.config.get("linter-emscripten.defaultObjCFlags").split(/\s+/));
        }

        args.push(`-ferror-limit=${atom.config.get("linter-emscripten.errorLimit")}`);
        if(atom.config.get("linter-emscripten.suppressWarnings")) {
          args.push("-w");
        }
        if(atom.config.get("linter-emscripten.verboseDebug")) {
          args.push("--verbose");
        }

        atom.config.get("linter-emscripten.includePaths").forEach((path) =>
          args.push(`-I${path}`)
        );

        try {
          flags = clangFlags.getClangFlags(activeEditor.getPath());
          if(flags) {
            args.push.apply(args, flags);
          }
        }
        catch (error) {
          if(atom.config.get("linter-emscripten.verboseDebug")) {
            console.log(error);
          }
        }

        // The file is added to the arguments last.
        args.push(file);
        return helpers.exec(command, args, {stream: "stderr"}).then(output =>
          helpers.parse(output, regex)
        );
      }
    };
  }
};
