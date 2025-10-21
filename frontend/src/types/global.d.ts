export {};

declare global {
  // Minimal process definition for environments without Node types
  // eslint-disable-next-line no-var
  var process: {
    env?: Record<string, string | undefined>;
  };
}
