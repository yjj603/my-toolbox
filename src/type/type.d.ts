export declare type Base = string | number;
export declare type obj = {
    [x: string]: any;
};
export declare type optionArray = string | obj;
export interface Option {
    label: string;
    value: string | number;
    [propName: string]: unknown;
}
