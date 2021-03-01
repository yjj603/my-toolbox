import { Base, Option } from "../type/type";
export declare function exportFile(res: Blob, name: string): void;
export declare function optionFormat(label: string, value: string | number): Option;
export declare function dateTimeFormat(time: Base, format?: string): string;
export declare function timeFormat(time: Base): string;
export declare function dateFormat(time: Base): string;
