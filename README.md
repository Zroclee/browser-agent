# browser-agent

基于Playwright的浏览器智能助手，本地部署，通过文件系统、长期记忆使助手能够学习用户习惯完成自我进化。

## 项目初始化

1. 安装项目依赖
```bash
pnpm install

# 安装生产依赖
pnpm install commander playwright express cors langchain @langchain/openai dotenv

# 安装开发依赖
pnpm install -D typescript @types/node @types/express @types/cors ts-node

# 初始化 TypeScript
npx tsc --init

```

## 编写 CLI 入口文件
```bash
# 存放 CLI 入口文件
mkdir bin
```
在 `bin/` 下创建 `index.ts`:
```typescript
#!/usr/bin/env ts-node

import { Command } from 'commander';


const program = new Command();

program
  .name('start')
  .description('AI Agent 终端集成工具')
  .version('1.0.0')
  .action(async () => {
    console.log('🚀 正在启动 Agent Nexus...');
  });

program.parse(process.argv);
```

在 `package.json `中添加`bin`
```json
"bin": {
  "browser-agent": "./bin/index.ts"
}
```


## 后端服务

```bash
# 后端服务 (Express + LangChain)
mkdir server
```
在 `server/` 下创建 `app.ts`

```ts
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// 模拟聊天接口
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  // 这里后续会集成 LangChain
  res.json({ reply: `你发送了: ${message}。智能体正在思考...` });
});

export const startServer = (port: number) => {
  app.listen(port, () => {
    console.log(`✨ 后端服务已在 http://localhost:${port} 运行`);
  });
};
```

## 前端服务

```bash
# 前端 UI (React)
mkdir client
# 初始化前端项目
pnpm create vite@latest client -- --template react-ts
```

## 智能体开发


