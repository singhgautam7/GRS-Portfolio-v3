import { test as base } from '@playwright/test';

/**
 * WebGL is off by default: behaviour tests should not depend on a software-rendered 3D rig
 * (headless Chromium renders it on the CPU, which starves parallel tests). The 3D tests opt in
 * with test.use({ webgl: true }).
 */
export const test = base.extend<{ webgl: boolean }>({
  webgl: [false, { option: true }],
  page: async ({ page, webgl }, use) => {
    if (!webgl)
      await page.addInitScript(() => {
        const orig = HTMLCanvasElement.prototype.getContext;
        // @ts-expect-error -- test shim: refuse WebGL contexts, keep 2D
        HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...a: unknown[]) {
          return /webgl/.test(type) ? null : (orig as (...x: unknown[]) => unknown).call(this, type, ...a);
        };
      });
    await use(page);
  },
});
export { expect } from '@playwright/test';
