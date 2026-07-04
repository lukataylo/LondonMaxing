// Optional integration SDK — declared loosely so the server type-checks without
// @google/genai's bundled types resolving. The package is installed at runtime;
// this shim only keeps tsc green for the Time Portal image-to-image dynamic import.
declare module "@google/genai";
