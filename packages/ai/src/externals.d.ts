// Optional integration SDKs — declared loosely so @grudgemap/ai BUILDS without them
// installed (they're optional peer deps). The AI track installs the real package
// when implementing a provider; these `any` shims keep the scaffold green.
declare module "@google/genai";
declare module "@imgly/background-removal-node";
