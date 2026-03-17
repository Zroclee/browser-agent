#!/usr/bin/env ts-node

import 'dotenv/config';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { Command } from 'commander';
import { closeControlledBrowser, startControlledBrowser } from '../browser';
import { startServer } from '../server/app';

const program = new Command();
const appEnv = (process.env.APP_ENV ?? process.env.NODE_ENV ?? '').toLowerCase();
const isLocalEnv = appEnv === 'local';
const serverPort = Number(process.env.PORT ?? 3000);
const clientDevUrl = process.env.CLIENT_DEV_URL ?? 'http://localhost:5173';

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const spawnLocalProcess = (command: string, args: string[], cwd: string) =>
  spawn(command, args, {
    cwd,
    env: process.env,
    stdio: 'inherit',
  });

program
  .name('browser-agent')
  .description('基于Playwright的浏览器智能助手')
  .version('1.0.0');

program
  .command('start')
  .description('启动后端服务和受控浏览器')
  .action(async () => {
    console.log('🚀 正在启动 Browser Agent...');

    if (isLocalEnv) {
      const rootDir = process.cwd();
      const clientDir = path.resolve(rootDir, 'client');
      const serverProcess = spawnLocalProcess('pnpm', ['run', 'server:dev'], rootDir);
      const clientProcess = spawnLocalProcess('pnpm', ['run', 'dev'], clientDir);

      const shutdown = (): void => {
        if (!serverProcess.killed) {
          serverProcess.kill();
        }
        if (!clientProcess.killed) {
          clientProcess.kill();
        }
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);

      console.log('🌐 本地模式启动中，等待前端服务就绪...');
      await wait(3000);
      console.log('🌐 正在打开操作浏览器...');
      await startControlledBrowser(clientDevUrl);
      console.log('✅ 受控浏览器已启动');
      return;
    }

    startServer(serverPort);
    console.log('🌐 正在打开操作浏览器...');
    await startControlledBrowser(`http://localhost:${serverPort}/ui`);
    console.log('✅ 受控浏览器已启动');
  });

program
  .command('close')
  .description('关闭受控浏览器')
  .action(async () => {
    await closeControlledBrowser();
    console.log('🛑 受控浏览器已关闭');
  });

program.parse(process.argv);
