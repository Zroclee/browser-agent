import { Router } from 'express';

const chatRouter: Router = Router();

chatRouter.post('/', async (req, res) => {
  const { message } = req.body;
  res.json({ reply: `你发送了: ${message}。智能体正在思考...` });
});

chatRouter.get('/sse', (req, res) => {
  const message = typeof req.query.message === 'string' ? req.query.message : '';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent('start', { message });

  const chunks = ['智能体正在分析请求', '智能体正在检索上下文', '智能体正在组织答案'];
  let index = 0;
  const interval = setInterval(() => {
    if (index >= chunks.length) {
      sendEvent('done', { reply: `你发送了: ${message}。智能体已完成回复。` });
      clearInterval(interval);
      res.end();
      return;
    }

    sendEvent('chunk', { content: chunks[index] });
    index += 1;
  }, 800);

  req.on('close', () => {
    clearInterval(interval);
  });
});

export default chatRouter;
