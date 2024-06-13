# Understanding Node.js Modules: CommonJS (CJS) vs ECMAScript Modules (ESM)

Node.js, a widely used runtime for executing JavaScript on the server side, supports two different module systems: CommonJS (CJS) and ECMAScript Modules (ESM). These modules serve as the building blocks for organizing and structuring Node.js applications. This document aims to clarify the differences between CJS and ESM, and explain how modules work in Node.js.

## CommonJS (CJS)

CommonJS is the older module system used in Node.js. It uses the `require()` function to load modules and `module.exports` to export them. Here are the key characteristics:

- **Syntax**:

  ```javascript
  // Importing a module
  const moduleName = require("module-name");

  // Exporting a module
  module.exports = {
    functionName,
    variableName,
  };
  ```

- **Dynamic imports**: Modules can be imported at any point in the code.

- **File extension**: Typically uses `.js` but can also work without specifying the file extension.

- **Synchronous loading**: `require()` blocks the execution until the module is loaded.

- **Scope**: Each file has its own scope.

- **Compatibility**: Widespread use in Node.js projects. However, CJS is not natively supported in browsers.

## ECMAScript Modules (ESM)

ECMAScript Modules, also known as ES6 modules, follow the official JavaScript standard for modularity. Node.js has started supporting ESM to align with modern JavaScript. Here are the key characteristics:

- **Syntax**:

  ```javascript
  // Importing a module
  import { functionName, variableName } from "module-name";

  // Exporting a module
  export { functionName, variableName };
  // or
  export default functionName;
  ```

- **Static imports**: Imports are hoisted and executed before the rest of the code.

- **File extension**: Uses `.mjs` or setting `"type": "module"` in `package.json` for `.js` files.

- **Asynchronous loading**: Unlike CJS, ESM can load modules asynchronously. Meaning you could await at global scope for example.

- **Scope**: ESMs have their own scope and do not pollute the global scope.

- **Compatibility**: Works both in Node.js and modern browsers.

## Key Differences

1. **Syntax**:

   - CJS uses `require()` and `module.exports`.
   - ESM uses `import` and `export`.

2. **File extension**:

   - CJS typically uses `.js`.
   - ESM uses `.mjs` or can use `.js` if `"type": "module"` is specified in the `package.json`.

3. **Loading**:

   - CJS modules are loaded synchronously.
   - ESM allows asynchronous module loading.

4. **Scope**:

   - Both CJS and ESM have their own module scope, providing encapsulation.

5. **Browser Compatibility**:
   - CJS is not natively supported in browsers.
   - ESM is supported in both Node.js and modern browsers.

## How Modules Work in Node.js

Node.js follows a specific process for loading modules:

1. **Resolution**: Node.js determines the file path of the module.

   - For CJS, it checks for `.js`, `.json`, and `.node` extensions.
   - For ESM, it respects the file extension or uses the set module type in `package.json`.

2. **Loading**: The module file is read into memory.

   - CJS synchronously reads the file.
   - ESM can load modules asynchronously.

3. **Compilation**: Node.js compiles the module.

   - CJS wraps the module code in a function to maintain its scope.
   - ESM parses the module and performs static analysis.

4. **Execution**: Node.js executes the compiled code.

   - For both CJS and ESM, the module's exports are returned to the caller.

5. **Caching**: Node.js caches the module to optimize performance and avoid redundant loading.
