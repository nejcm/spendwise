import type { GetNextPageParamFunction, GetPreviousPageParamFunction } from '@tanstack/react-query';
import Constants from 'expo-constants';

export type PaginateQuery<T> = {
  results: T[];
  count: number;
  next: string | null;
  previous: string | null;
};

type KeyParams = {
  [key: string]: any;
};
export const DEFAULT_LIMIT = 10;

export function getQueryKey<T extends KeyParams>(key: string, params?: T) {
  return [key, ...(params ? [params] : [])];
}

// for infinite query pages  to flatList data
export function normalizePages<T>(pages?: PaginateQuery<T>[]): T[] {
  return pages ? pages.reduce((prev: T[], current) => [...prev, ...current.results], []) : [];
}

// a function that accept a url and return params as an object
const regex = /[?&]([^=#]+)=([^&#]*)/g;
export function getUrlParameters(url: string | null): { [k: string]: string } | null {
  if (url === null) {
    return null;
  }
  const params = {};
  let match;
  while ((match = regex.exec(url))) {
    if (match[1] !== null) {
      // @ts-expect-error - Dynamic key assignment
      params[match[1]] = match[2];
    }
  }
  return params;
}

export const getPreviousPageParam: GetNextPageParamFunction<unknown, PaginateQuery<unknown>> = (page) =>
  getUrlParameters(page.previous)?.offset ?? null;

export const getNextPageParam: GetPreviousPageParamFunction<unknown, PaginateQuery<unknown>> = (page) =>
  getUrlParameters(page.next)?.offset ?? null;

export function generateAPIUrl(relativePath: string) {
  const origin = Constants.experienceUrl.replace('exp://', 'http://');

  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

  if (process.env.NODE_ENV === 'development') {
    return `${origin}${path}`;
  }

  if (!process.env.EXPO_PUBLIC_API_BASE_URL) {
    throw new Error(
      'EXPO_PUBLIC_API_BASE_URL environment variable is not defined',
    );
  }

  return `${process.env.EXPO_PUBLIC_API_BASE_URL}${path}`;
}
