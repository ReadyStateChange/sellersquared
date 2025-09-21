/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { AstroSeoProps } from "@astrolib/seo";
declare module "@astrolib/seo" {
  export const AstroSeo: (props: AstroSeoProps) => any;
}
