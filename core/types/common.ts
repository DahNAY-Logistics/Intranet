export interface ErrorResponse {
  error: string
}

export interface MessageResponse {
  message: string
}

export type Serializable<T> = T extends string
  ? T | Date
  : T extends (infer U)[]
    ? Serializable<U>[]
    : T extends object
      ? { [K in keyof T]: Serializable<T[K]> }
      : T
