import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import chatRouter from './router/chat';

const app = express();
const appEnv = (process.env.APP_ENV ?? process.env.NODE_ENV ?? '').toLowerCase();
const isLocalEnv = appEnv === 'local';
const clientDistPath = path.resolve(process.cwd(), 'client', 'dist');

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/chat', chatRouter);

if (!isLocalEnv && fs.existsSync(clientDistPath)) {
  app.use('/ui', express.static(clientDistPath));
  app.get(/^\/ui(\/.*)?$/, (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

export const startServer = (port: number) => {
  app.listen(port, () => {
    console.log(`✨ 后端服务已在 http://localhost:${port} 运行`);
  });
};

if (require.main === module) {
  const port = Number(process.env.PORT ?? 3000);
  startServer(port);
}
