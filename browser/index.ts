import { chromium } from 'playwright';
import type { Browser, BrowserContext, BrowserContextOptions, LaunchOptions, Page } from 'playwright';

type BrowserManagerInitOptions = {
  launchOptions?: LaunchOptions;
  contextOptions?: BrowserContextOptions;
};

type BrowserManagerStartOptions = BrowserManagerInitOptions & {
  gotoOptions?: Parameters<Page['goto']>[1];
};

class BrowserManager {
  private static instance: BrowserManager;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private initializing: Promise<Page> | null = null;

  private constructor() {}

  static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager();
    }

    return BrowserManager.instance;
  }

  async getOrCreatePage(options?: BrowserManagerInitOptions): Promise<Page> {
    if (this.page && !this.page.isClosed()) {
      return this.page;
    }

    if (this.initializing) {
      return this.initializing;
    }

    this.initializing = this.initialize(options);

    try {
      return await this.initializing;
    } finally {
      this.initializing = null;
    }
  }

  async start(url: string, options?: BrowserManagerStartOptions): Promise<Page> {
    const page = await this.getOrCreatePage(options);
    await page.goto(url, options?.gotoOptions);
    return page;
  }

  getBrowser(): Browser | null {
    return this.browser;
  }

  getContext(): BrowserContext | null {
    return this.context;
  }

  getPage(): Page | null {
    if (!this.page || this.page.isClosed()) {
      return null;
    }

    return this.page;
  }

  async close(): Promise<void> {
    if (this.page && !this.page.isClosed()) {
      await this.page.close();
    }

    if (this.context) {
      await this.context.close();
    }

    if (this.browser && this.browser.isConnected()) {
      await this.browser.close();
    }

    this.page = null;
    this.context = null;
    this.browser = null;
    this.initializing = null;
  }

  private async initialize(options?: BrowserManagerInitOptions): Promise<Page> {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await chromium.launch({
        channel: 'chrome',
        headless: false,
        ...options?.launchOptions,
      });
      this.browser.on('disconnected', () => {
        this.browser = null;
        this.context = null;
        this.page = null;
      });
    }

    if (!this.context) {
      this.context = await this.browser.newContext(options?.contextOptions);
      this.context.on('close', () => {
        this.context = null;
        this.page = null;
      });
    }

    if (!this.page || this.page.isClosed()) {
      this.page = await this.context.newPage();
      this.page.on('close', () => {
        this.page = null;
      });
    }

    return this.page;
  }
}

export const browserManager = BrowserManager.getInstance();
export const startControlledBrowser = (url: string, options?: BrowserManagerStartOptions): Promise<Page> =>
  browserManager.start(url, options);
export const closeControlledBrowser = (): Promise<void> => browserManager.close();
export { BrowserManager };
export type { BrowserManagerInitOptions, BrowserManagerStartOptions };
