export function isValidUrl(string: string) {
    if (!string.startsWith("http")) {
        return false;
    }
    try {
      new URL(string);
      return true;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_e) {
      return false;
    }
  }
  