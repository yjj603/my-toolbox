import { Base, obj, optionArray, Option } from "../type/type";
interface Config {
    render?: boolean;
    method?: Function;
    show?: boolean;
    formatter?: Function;
    params?: [string, string];
    width?: string | number;
    notFilter?: boolean;
    emptyValue?: string;
    formConfig?: {
        [propName: string]: unknown;
    };
    [propName: string]: unknown;
}
declare abstract class Field {
    readonly prop: string;
    readonly label: string;
    render: boolean;
    method: Map<Function, Function>;
    show: boolean;
    params: [string, string];
    emptyValue: string;
    formatter: (r: {
        [x: string]: unknown;
    }) => Base;
    [propName: string]: unknown;
    constructor(prop: string, label: string, config?: Config);
    protected setConfig(config: Config): void;
    toggle(): void;
    get(key: string): unknown;
    set(key: string, value: unknown): Field;
    delete(key: string): Field;
    has(key: string): boolean;
    private _setMethod;
    setFilters(option?: optionArray[]): Field;
    clearFilters(): Field;
}
declare class Input extends Field {
    readonly type = "Input";
}
declare class InputNumber extends Field {
    readonly type = "InputNumber";
}
declare abstract class BaseSelect extends Field {
    formatter: (r: {
        [x: string]: unknown;
    }) => Base;
    option: Option[];
    constructor(prop: string, label: string, option?: optionArray[], config?: Config);
    setOption(o: optionArray[], s?: boolean): Field;
    setRemote(remoteMethod: Function): Field;
}
declare class Select extends BaseSelect {
    readonly type = "Select";
}
declare class Radio extends BaseSelect {
    readonly type = "Radio";
}
declare class SelectMultiple extends BaseSelect {
    readonly type = "SelectMultiple";
}
declare abstract class BaseDate extends Field {
    format: string;
}
declare class InputDate extends BaseDate {
    readonly type = "InputDate";
    formatter: (r: {
        [x: string]: unknown;
    }) => string;
    constructor(prop: string, label: string, config?: Config);
}
declare class DateRange extends BaseDate {
    readonly children: [string, string];
    readonly type = "DateRange";
    formatter: (r: obj) => string;
    constructor(prop: string, label: string, children: [string, string], config?: Config);
}
declare class Checkbox extends Field {
    readonly type = "Checkbox";
}
declare class Upload extends Field {
    readonly type = "Upload";
}
declare class FieldList {
    list: Field[];
    listMap: Map<string, unknown>;
    length: number;
    constructor(...list: Field[] | [Field[]]);
    private _init;
    find(prop: string | number): Field;
    has(prop: string | number): boolean;
    setAllAttr(prop: string, value: unknown): FieldList;
    deleteAllAttr(prop: string): FieldList;
    delete(...prop: string[]): FieldList;
    findAndSetAttr(field: string | number, prop: string, value: unknown): FieldList;
    replace(key: string | number, field: Field): FieldList;
    insert(key: string | number, field: Field, before?: boolean): FieldList;
    findIndex(prop: string): number;
    sliceByProp(...prop: string[]): FieldList;
    toggle(start?: number, end?: number): FieldList;
    push(...field: Field[]): FieldList;
    unshift(...field: Field[]): FieldList;
    pop(): FieldList;
    shift(): FieldList;
    some(fn: (value: Field, index: number, array: Field[]) => unknown): boolean;
    every(fn: (value: Field, index: number, array: Field[]) => value is Field): boolean;
    map(fn: (value: Field, index: number, array: Field[]) => unknown): unknown[];
    filter(fn: (value: Field, index: number, array: Field[]) => value is Field): Field[];
    reduce(fn: (previousValue: Field, currentValue: Field, currentIndex: number, array: Field[]) => Field, current: any): any;
    [Symbol.iterator](): Generator<Field, void, undefined>;
}
export { Input, InputNumber, Select, SelectMultiple, InputDate, DateRange, Checkbox, Radio, Upload, FieldList };
