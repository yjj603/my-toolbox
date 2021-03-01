export type Base = string | number

export type obj = {
    [x: string]: any
}

export type optionArray = string | obj

export interface Option {
    label: string
    value: string | number
    [propName: string]: unknown
}
