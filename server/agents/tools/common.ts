import { tool } from '@langchain/core/tools';
import * as z from 'zod';

export const getCurrentTimeTool = tool(
  async ({ timeZone }) => {
    const now = new Date();
    const resolvedTimeZone = timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    const localTime = new Intl.DateTimeFormat('zh-CN', {
      timeZone: resolvedTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(now);

    return JSON.stringify({
      timestamp: now.getTime(),
      iso: now.toISOString(),
      timeZone: resolvedTimeZone,
      localTime,
    });
  },
  {
    name: 'get_current_time',
    description: '获取当前时间，支持可选时区参数，返回时间戳、ISO 时间和本地格式化时间',
    schema: z.object({
      timeZone: z.string().optional().describe('可选 IANA 时区，例如 Asia/Shanghai、UTC'),
    }),
  },
);
