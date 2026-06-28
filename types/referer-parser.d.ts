declare module "referer-parser" {
  class Referer {
    constructor(refererUrl: string, currentUrl?: string);
    known: boolean;
    referer: string;
    medium: "unknown" | "search" | "social" | "email" | "internal" | "unknown" | string;
    search_parameter: string;
    search_term: string;
  }
  export = Referer;
}
