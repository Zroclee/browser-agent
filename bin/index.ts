#!/usr/bin/env ts-node

import { Command } from 'commander';
import { chromium } from 'playwright';
import { startServer } from '../server/app'; // 稍后创建

const program = new Command();

program
  .name('browser-agent')
  .description('基于Playwright的浏览器智能助手')
  .version('1.0.0')
  .action(async () => {
    console.log('🚀 正在启动 Browser Agent...');

    // 1. 启动后端网关
    startServer(3000);

    // 2. 启动受控浏览器
    console.log('🌐 正在打开操作浏览器...');
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('http://localhost:3000/ui'); // 预留给 React UI 的路由
  });

program.parse(process.argv);