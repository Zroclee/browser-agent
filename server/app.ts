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