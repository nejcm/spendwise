/** Object */
declare type Dict<T = unknown> = Record<string | number | symbol, T>;
/** Object value types */
declare type ValueOf<T> = T[keyof T];
/** Keys of type */
declare type KeysOf<T> = (keyof T)[];
/** Keys with values of given type */
declare type KeyOfType<T, U> = {
  [P in keyof T]-?: T[P] extends U ? P : never;
}[keyof T];

/** Value or undefined */
declare type Maybe<T> = T | undefined | null;
/** Value or null */
declare type Nullable<T> = T | null;
/** Partial or null object */
declare type PartialNull<T> = { [K in keyof T]: T[K] | null };
/** Deep partial object */
declare type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer I>
    ? Array<DeepPartial<I>>
    : T[P] extends object
      ? DeepPartial<T[P]>
      : T[P];
};

/** Any function */
declare type Fn = (...args: any[]) => any;
/** Required function */
declare type FnR<TF> = Exclude<TF, undefined>;
/** Is never */
declare type IsNever<T> = [T] extends [never] ? never : T;

declare type OrPromise<T> = T | Promise<T>;

// Side-effect CSS imports (e.g. `import '../global.css'`) only resolve via the
// `expo/types` reference inside the gitignored, dev-server-generated
// `expo-env.d.ts` — which never exists in CI. Declare it explicitly here so
// `tsc` works on a clean checkout.
declare module '*.css';

declare type SetTimeout = ReturnType<typeof setTimeout>;

/* eslint-disable ts/consistent-type-imports, ts/no-redeclare */
type JestFn = <T extends (...args: any[]) => any = (...args: any[]) => any>(
  implementation?: T,
) => jest.Mock<T>;

declare const jest: Omit<typeof import('@jest/globals')['jest'], 'fn'> & {
  fn: JestFn;
};

declare namespace jest {
  type Mock<T extends (...args: any[]) => any = (...args: any[]) => any> = import('jest-mock').Mock<T>;
  type MockedFunction<T extends (...args: any[]) => any> = import('jest-mock').MockedFunction<T>;
}
/* eslint-enable ts/consistent-type-imports, ts/no-redeclare */
