import { expect, Page, Locator, Response, APIResponse, APIRequestContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface ApiResponse<T = unknown> {
  status: number;
  body: T | null;
}

async function waitForResponse(
  page: Page,
  urlPattern: string | RegExp,
  action: () => Promise<void>
): Promise<Response> {
  const [response] = await Promise.all([
    page.waitForResponse(urlPattern),
    action(),
  ]);
  return response;
}

async function waitUntil(
  conditionFn: () => Promise<boolean>,
  maxAttempts = 5,
  delayMs = 1000
): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (await conditionFn()) return;
    if (attempt < maxAttempts) await delay(delayMs);
  }
  throw new Error(`Condition not met after ${maxAttempts} attempts`);
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function uniqueString(prefix = 'test'): string {
  const rand = Math.random().toString(36).substring(2, 5);
  return `${prefix}_${Date.now()}_${rand}`;
}

function formatDate(date = new Date()): string {
  return date.toISOString().split('T')[0];
}

function futureDateString(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

function parseAmount(text: string): number {
  return parseFloat((text ?? '').replace(/[^0-9.]/g, '')) || 0;
}

async function assertText(locator: Locator, expected: string | RegExp): Promise<void> {
  await expect(locator).toHaveText(expected);
}

async function assertUrlContains(page: Page, substring: string): Promise<void> {
  await expect(page).toHaveURL(new RegExp(substring));
}

async function assertInteractable(locator: Locator): Promise<void> {
  await expect(locator).toBeVisible();
  await expect(locator).toBeEnabled();
}

async function takeScreenshot(page: Page, name: string): Promise<void> {
  const dir = path.resolve(process.cwd(), 'test-results/screenshots');
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: true });
}

async function apiCall<T = unknown>(
  request: APIRequestContext,
  method: HttpMethod,
  url: string,
  body?: object,
  headers: Record<string, string> = {}
): Promise<ApiResponse<T>> {
  const options = {
    headers: { 'Content-Type': 'application/json', ...headers },
    ...(body ? { data: body } : {}),
  };

  const methodMap: Record<HttpMethod, () => Promise<APIResponse>> = {
    GET:    () => request.get(url, options),
    POST:   () => request.post(url, options),
    PUT:    () => request.put(url, options),
    DELETE: () => request.delete(url, options),
    PATCH:  () => request.patch(url, options),
  };

  const response = await methodMap[method]();
  const json = await response.json().catch(() => null);
  return { status: response.status(), body: json as T | null };
}

async function setLocalStorage(page: Page, key: string, value: string): Promise<void> {
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [key, value] as [string, string]);
}

async function getLocalStorage(page: Page, key: string): Promise<string | null> {
  return page.evaluate(k => localStorage.getItem(k), key);
}

export {
  waitForResponse,
  waitUntil,
  delay,
  uniqueString,
  formatDate,
  futureDateString,
  parseAmount,
  assertText,
  assertUrlContains,
  assertInteractable,
  takeScreenshot,
  apiCall,
  setLocalStorage,
  getLocalStorage,
};
