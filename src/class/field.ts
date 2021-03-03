import {isString, isNumber, isObject, cloneDeep} from 'lodash-es'
import {dateTimeFormat} from "../utils/utils";
import {Base, obj, optionArray, Option} from "../type/type";

interface Config {
    render?: boolean
    method?: Function
    show?: boolean
    formatter?: Function
    params?: [string, string]
    width?: string | number
    notFilter?: boolean
    emptyValue?: string
    formConfig?: {
        [propName: string]: unknown
    }

    [propName: string]: unknown
}

abstract class Field {
    render: boolean = true
    method: Map<Function, Function> = new Map()
    show: boolean = true
    params: [string, string] = ['label', 'value']
    emptyValue: string = '-'
    formatter: (r: { [x: string]: unknown }) => Base = (r): Base => {
        return Reflect.get(r, this.prop) || this.emptyValue
    }

    [propName: string]: unknown

    constructor(readonly prop: string, readonly label: string, config: Config = {}) {
        this.prop = prop.trim()
        this.label = label.trim()
        this.setConfig(config)
    }

    protected setConfig(config: Config) {
        Object.entries(config).forEach(v => {
            this.set(v[0], v[1])
        })
    }

    toggle(): void {
        this.set('show', !this.get('show'))
    }

    get(key: string): unknown {
        if (!key.includes('.')) {
            return this[key]
        }
        const str = key.split(/\./)
        const fn = (str: string[], obj: obj = this): unknown => {
            if (str.length === 1) {
                return Reflect.get(obj, str[0])
            } else {
                const k = str[0]
                if (!Reflect.has(obj, k)) {
                    return undefined
                }
                str.shift()
                return fn(str, obj[k])
            }
        }
        return fn(str)
    }

    set(key: string, value: unknown): Field {
        if (key === 'method') {
            this._setMethod(<Function>value)
            return this
        }
        if (!key.includes('.')) {
            this[key] = value
            return this
        }
        const str = key.split(/\./)
        const fn = (str: string[], obj: obj = this): void => {
            if (str.length === 1) {
                Reflect.set(obj, str[0], value)
            } else {
                const k = str[0]
                if (!Reflect.has(obj, k)) {
                    obj[k] = {}
                }
                str.shift()
                return fn(str, obj[k])
            }
        }
        fn(str)
        return this
    }

    delete(key: string): Field {
        if (!key.includes('.')) {
            Reflect.deleteProperty(this, key)
            return this
        }
        const str = key.split(/\./)
        const fn = (str: string[], obj: obj = this): void => {
            if (str.length === 1) {
                Reflect.deleteProperty(obj, str[0])
            } else {
                const k = str[0]
                if (Reflect.has(obj, k)) {
                    str.shift()
                    return fn(str, obj[k])
                }
            }
        }
        fn(str)
        return this
    }

    has(key: string): boolean {
        if (!key.includes('.')) {
            return Reflect.has(this, key)
        } else {
            return !!this.get(key)
        }
    }

    private _setMethod(value: Function): void {
        this.method.set(value, value)
    }

    setFilters(option: optionArray[] = this.option as optionArray[] || []): Field {
        this.filterMethod = (v: Base, r: { [x: string]: unknown }) => {
            return r[this.prop] === v
        }

        if (!option.length) {
            this.filters = []
            return this
        }

        this.filters = option.map((text: string | obj, value: number) => {
            if (isString(text)) {
                return {
                    text,
                    value
                }
            } else if (isObject(text)) {
                return {
                    text: Reflect.get(text, this.params[0]),
                    value: Reflect.get(text, this.params[1])
                }
            } else {
                return {
                    text: '',
                    value: ''
                }
            }
        })
        return this
    }

    clearFilters(): Field {
        this.delete('filters').delete('filterMethod')
        return this
    }
}

class Input extends Field {
    readonly type = 'Input'
}

class InputNumber extends Field {
    readonly type = 'InputNumber'
}

abstract class BaseSelect extends Field {
    formatter: (r: { [x: string]: unknown }) => Base = (r): Base => {
        const value = r[this.prop]
        const option = this.option.find((s: Option) => s.value === value) || {} as Option
        return option.label || this.emptyValue
    }
    option: Option[] = []

    constructor(prop: string, label: string, option: optionArray[] = [], config: Config = {}) {
        super(prop, label);
        this.setOption(option)
        this.setConfig(config)
    }

    setOption(o: optionArray[], s: boolean = !this.notFilter): Field {
        if (!o.length) {
            this.option = []
            return this
        }
        this.option = o.map((label: string | obj, value: number) => {
            return isString(label)
                ? {
                    label,
                    value
                } : {
                    label: label[this.params[0]],
                    value: label[this.params[1]],
                    ...label
                }
        })
        s && this.setFilters()
        return this
    }

    setRemote(remoteMethod: Function): Field {
        this.set('formConfig.remote', true)
        this.set('formConfig.remoteMethod', remoteMethod)
        return this
    }
}

class Select extends BaseSelect {
    readonly type = 'Select'
}

class Radio extends BaseSelect {
    readonly type = 'Radio'
}

class SelectMultiple extends BaseSelect {
    readonly type = 'SelectMultiple'
}

abstract class BaseDate extends Field {
    format: string = 'yyyy-MM-dd'
}

class InputDate extends BaseDate {
    readonly type = 'InputDate'
    formatter: (r: { [x: string]: unknown }) => string = (r): string => {
        const t = parseInt(Reflect.get(r, this.prop))
        return t ? dateTimeFormat(t, this.format) : this.emptyValue
    }

    constructor(prop: string, label: string, config: Config = {}) {
        super(prop, label);
        this.setConfig(config)
    }
}

class DateRange extends BaseDate {
    readonly type = 'DateRange'
    formatter: (r: obj) => string = (r): string => {
        return `${dateTimeFormat(r[this.children[0]], this.format)} - ${dateTimeFormat(r[this.children[0]], this.format)}`
    }

    constructor(prop: string, label: string, readonly children: [string, string], config: Config = {}) {
        super(prop, label);
        this.setConfig(config)
    }
}

class Checkbox extends Field {
    readonly type = 'Checkbox'
}

class Upload extends Field {
    readonly type = 'Upload'
}

class FieldList {
    list: Field[] = []
    listMap: Map<string, unknown> = new Map()
    length: number = 0

    constructor(...list: Field[] | [Field[]]) {
        if (Array.isArray(list[0])) {
            this._init(list[0])
        } else {
            this._init(list as Field[])
        }
    }

    private _init(list: Field[]): void {
        this.list = list
        this.listMap = new Map(list.map(v => [v.prop, v]))
        this.length = this.list.length
    }

    find(prop: string | number): Field {
        if (isString(prop)) {
            return this.listMap.get(prop) as Field
        } else if (isNumber(prop)) {
            const index = Math.round(prop)
            if (index < 0) {
                const len = this.length - 1
                return this.list[len + index]
            } else {
                return this.list[index]
            }
        } else {
            return this.list[0]
        }
    }

    has(prop: string | number): boolean {
        return !!this.find(prop)
    }

    setAllAttr(prop: string, value: unknown): FieldList {
        if (prop && value) {
            const list = cloneDeep(this.list)
            list.forEach(v => {
                v.set(prop, value)
            })
            return new FieldList(list)
        } else {
            return this
        }
    }

    deleteAllAttr(prop: string): FieldList {
        if (prop) {
            const list = cloneDeep(this.list)
            list.forEach(v => {
                v.delete(prop)
            })
            return new FieldList(list)
        } else {
            return this
        }
    }

    delete(...prop: string[]): FieldList {
        if (prop.length) {
            const obj = prop.reduce((a, b) => {
                Reflect.set(a, b, true)
                return a
            }, {})
            const list = this.list.filter(v => !Reflect.has(obj, v.prop))
            return new FieldList(list)
        } else {
            return this
        }
    }

    findAndSetAttr(field: string | number, prop: string, value: unknown): FieldList {
        const f = cloneDeep(this.find(field))
        f.set(prop, value)
        return this.replace(field, f)
    }

    replace(key: string | number, field: Field): FieldList {
        if (isNumber(key)) {
            const index = Math.round(key)
            this.list.splice(index, 1, field)
            return new FieldList(this.list)
        } else if (isString(key)) {
            const index = this.findIndex(key)
            this.list.splice(index, 1, field)
            return new FieldList(this.list)
        } else {
            return this
        }
    }

    insert(key: string | number, field: Field, before = false): FieldList {
        if (isNumber(key)) {
            const index = Math.round(key)
            const list = cloneDeep(this.list)
            list.splice(index, 0, field)
            return new FieldList(list)
        } else if (isString(key)) {
            const index = before ? this.findIndex(key) - 1 : this.findIndex(key)
            const list = cloneDeep(this.list)
            list.splice(index, 0, field)
            return new FieldList(this.list)
        } else {
            return this
        }
    }

    findIndex(prop: string): number {
        return this.list.findIndex(v => v.prop === prop)
    }

    sliceByProp(...prop: string[]): FieldList {
        const p = prop.map(v => this.find(v)).filter(v => v)
        return new FieldList(p)
    }

    toggle(start = 0, end = this.length): FieldList {
        if (start > end) {
            return this
        }
        if (end) {
            const s = start < this.length ? start : this.length
            const l = end < this.length ? end : this.length
            for (let a = s; a < l; a++) {
                const f = this.find(a)
                f && f.toggle()
            }
        }
        return this
    }

    push(...field: Field[]): FieldList {
        if (field.length) {
            this.list.push(...field)
            return new FieldList(this.list)
        } else {
            return this
        }
    }

    unshift(...field: Field[]): FieldList {
        if (field.length) {
            this.list.unshift(...field)
            return new FieldList(this.list)
        } else {
            return this
        }
    }

    pop(): FieldList {
        if (this.length) {
            this.list.pop()
            return new FieldList(this.list)
        } else {
            return this
        }
    }

    shift(): FieldList {
        if (this.length) {
            this.list.shift()
            return new FieldList(this.list)
        } else {
            return this
        }
    }

    some(fn: (value: Field, index: number, array: Field[]) => unknown): boolean {
        return this.list.some(fn)
    }

    every(fn: (value: Field, index: number, array: Field[]) => value is Field): boolean {
        return this.list.every(fn)
    }

    map(fn: (value: Field, index: number, array: Field[]) => unknown): unknown[] {
        return this.list.map(fn)
    }

    filter(fn: (value: Field, index: number, array: Field[]) => value is Field): Field[] {
        return this.list.filter(fn)
    }

    reduce(fn: (previousValue: Field, currentValue: Field, currentIndex: number, array: Field[]) => Field, current: any):any {
        return this.list.reduce(fn, current)
    }

    * [Symbol.iterator]() {
        yield* this.list
    }
}
export {
    Input,
    InputNumber,
    Select,
    SelectMultiple,
    InputDate,
    DateRange,
    Checkbox,
    Radio,
    Upload,
    FieldList
}
