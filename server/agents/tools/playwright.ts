import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { PlaywrightExecutor } from "./actions/executor.js";
import type { AgentActionResponse } from "./actions/types.js";
import { BrowserManager } from "../../../browser";


const manager = BrowserManager.getInstance();
/**
 * 参考视觉标记 (Set-of-Mark)
 * 工具：extract_page_state
 * - 在页面注入标注层，为视口内可交互元素添加红色编号
 * - 同时为每个元素添加 data-som-id 属性，用于后续操作
 * - 返回：当前 url、title、elements 摘要
 *
 * 注意：
 * - 仅标注“可见且在当前视口内”的元素，避免误点与无效目标
 * - 元素 text 使用 textContent 或 placeholder 的前 50 字符，作为 LLM 提示上下文
 */
export const extractPageStateTool = tool(
  async () => {
    const p = await manager.getPage();
    const elementsMetadata = await p.evaluate(() => {
      type ElementMetadata = {
        id: number;
        tagName: string;
        text: string;
        type?: string;
      };

      const markerAttr = "data-som-id";
      const labelContainerClass = "ai-label-container";

      document
        .querySelectorAll(`.${labelContainerClass}`)
        .forEach((el) => el.remove());
      document.querySelectorAll(`[${markerAttr}]`).forEach((el) => {
        el.removeAttribute(markerAttr);
      });
      document.querySelectorAll("[ba-mark-id]").forEach((el) => {
        el.removeAttribute("ba-mark-id");
      });

      const selectors = [
        "a[href]",
        "button",
        "input",
        "select",
        "textarea",
        '[role="button"]',
        '[role="link"]',
        '[role="checkbox"]',
      ];
      const elements = document.querySelectorAll(selectors.join(","));
      const metadata: ElementMetadata[] = [];
      let currentId = 0;
      const container = document.createElement("div");
      container.className = labelContainerClass;
      container.style.position = "absolute";
      container.style.top = "0";
      container.style.left = "0";
      container.style.zIndex = "9999999";
      container.style.pointerEvents = "none";
      document.body.appendChild(container);

      elements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const rect = htmlEl.getBoundingClientRect();
        const style = window.getComputedStyle(htmlEl);
        const isVisible =
          rect.width > 0 &&
          rect.height > 0 &&
          style.visibility !== "hidden" &&
          style.display !== "none" &&
          Number(style.opacity) > 0;
        const inViewport =
          rect.bottom > 0 &&
          rect.right > 0 &&
          rect.top < window.innerHeight &&
          rect.left < window.innerWidth;

        if (!isVisible || !inViewport) {
          return;
        }

        const id = currentId++;
        htmlEl.setAttribute(markerAttr, id.toString());
        htmlEl.setAttribute("ba-mark-id", id.toString());

        const label = document.createElement("div");
        label.innerText = `${id}`;
        label.style.position = "absolute";
        label.style.top = `${rect.top + window.scrollY}px`;
        label.style.left = `${rect.left + window.scrollX}px`;
        label.style.backgroundColor = "transparent";
        label.style.color = "red";
        label.style.fontSize = "12px";
        label.style.fontWeight = "bold";
        label.style.border = "1.5px solid red";
        label.style.width = "18px";
        label.style.height = "18px";
        label.style.display = "flex";
        label.style.justifyContent = "center";
        label.style.alignItems = "center";
        container.appendChild(label);

        const text = (
          htmlEl.textContent ||
          htmlEl.getAttribute("aria-label") ||
          (htmlEl as HTMLInputElement).placeholder ||
          htmlEl.getAttribute("alt") ||
          ""
        )
          .replace(/\s+/g, " ")
          .trim()
          .substring(0, 50);

        const inputType =
          htmlEl instanceof HTMLInputElement ? htmlEl.type || undefined : undefined;

        metadata.push({
          id,
          tagName: htmlEl.tagName.toLowerCase(),
          text,
          ...(inputType ? { type: inputType } : {}),
        });
      });
      return metadata;
    });

    const title = await p.title();

    return {
      url: p.url(),
      title,
      elements: elementsMetadata,
    };
  },
  {
    name: "extract_page_state",
    description: "抓取当前页面的关键交互元素，并输出带编号截图与上下文摘要",
  },
);

/**
 * 工具：execute_playwright_actions
 * 执行大模型生成的 Playwright 指令序列 (JSON 格式)
 */
export const executePlaywrightActionsTool = tool(
  async (input) => {
    const p = await manager.getPage();
    const executor = new PlaywrightExecutor(p);
    const result = await executor.executeActions(input as AgentActionResponse);
    return JSON.stringify(result);
  },
  {
    name: "execute_playwright_actions",
    description: "执行大模型生成的 Playwright 指令序列 (JSON 格式)",
    schema: z.object({
      task_id: z.string().describe("任务 ID"),
      plan_summary: z.string().describe("计划摘要"),
      actions: z
        .array(
          z.object({
            step: z.number().describe("步骤序号"),
            intent: z.string().describe("该步骤的意图"),
            type: z
              .enum([
                "click",
                "fill",
                "press",
                "hover",
                "check",
                "selectOption",
                "wait",
                "goto",
              ])
              .describe("动作类型"),
            target: z
              .object({
                type: z.enum(["markId", "css", "role", "text"]),
                value: z.string(),
                name: z.string().optional(),
              })
              .optional()
              .describe("定位器"),
            payload: z
              .object({
                text: z.string().optional(),
                key: z.string().optional(),
                delay: z.number().optional(),
                options: z.array(z.string()).optional(),
                url: z.string().optional(),
              })
              .optional()
              .describe("动作参数"),
          }),
        )
        .describe("动作列表"),
    }),
  },
);

/**
 * 工具集合导出：便于在 Agent 中统一引入
 */
export const browserTools = [
  extractPageStateTool,
  executePlaywrightActionsTool,
];
