import { isString, isNumber, isObject, cloneDeep } from 'lodash-es';
import { dateTimeFormat } from "../utils/utils";
class Field {
    constructor(prop, label, config = {}) {
        this.prop = prop;
        this.label = label;
        this.render = true;
        this.method = new Map();
        this.show = true;
        this.params = ['label', 'value'];
        this.emptyValue = '-';
        this.formatter = (r) => {
            return Reflect.get(r, this.prop) || this.emptyValue;
        };
        this.prop = prop.trim();
        this.label = label.trim();
        this.setConfig(config);
    }
    setConfig(config) {
        Object.entries(config).forEach(v => {
            this.set(v[0], v[1]);
        });
    }
    toggle() {
        this.set('show', !this.get('show'));
    }
    get(key) {
        if (!key.includes('.')) {
            return this[key];
        }
        const str = key.split(/\./);
        const fn = (str, obj = this) => {
            if (str.length === 1) {
                return Reflect.get(obj, str[0]);
            }
            else {
                const k = str[0];
                if (!Reflect.has(obj, k)) {
                    return undefined;
                }
                str.shift();
                return fn(str, obj[k]);
            }
        };
        return fn(str);
    }
    set(key, value) {
        if (key === 'method') {
            this._setMethod(value);
            return this;
        }
        if (!key.includes('.')) {
            this[key] = value;
            return this;
        }
        const str = key.split(/\./);
        const fn = (str, obj = this) => {
            if (str.length === 1) {
                Reflect.set(obj, str[0], value);
            }
            else {
                const k = str[0];
                if (!Reflect.has(obj, k)) {
                    obj[k] = {};
                }
                str.shift();
                return fn(str, obj[k]);
            }
        };
        fn(str);
        return this;
    }
    delete(key) {
        if (!key.includes('.')) {
            Reflect.deleteProperty(this, key);
            return this;
        }
        const str = key.split(/\./);
        const fn = (str, obj = this) => {
            if (str.length === 1) {
                Reflect.deleteProperty(obj, str[0]);
            }
            else {
                const k = str[0];
                if (Reflect.has(obj, k)) {
                    str.shift();
                    return fn(str, obj[k]);
                }
            }
        };
        fn(str);
        return this;
    }
    has(key) {
        if (!key.includes('.')) {
            return Reflect.has(this, key);
        }
        else {
            return !!this.get(key);
        }
    }
    _setMethod(value) {
        this.method.set(value, value);
    }
    setFilters(option = this.option || []) {
        this.filterMethod = (v, r) => {
            return r[this.prop] === v;
        };
        if (!option.length) {
            this.filters = [];
            return this;
        }
        this.filters = option.map((text, value) => {
            if (isString(text)) {
                return {
                    text,
                    value
                };
            }
            else if (isObject(text)) {
                return {
                    text: Reflect.get(text, this.params[0]),
                    value: Reflect.get(text, this.params[1])
                };
            }
            else {
                return {
                    text: '',
                    value: ''
                };
            }
        });
        return this;
    }
    clearFilters() {
        this.delete('filters').delete('filterMethod');
        return this;
    }
}
class Input extends Field {
    constructor() {
        super(...arguments);
        this.type = 'Input';
    }
}
class InputNumber extends Field {
    constructor() {
        super(...arguments);
        this.type = 'InputNumber';
    }
}
class BaseSelect extends Field {
    constructor(prop, label, option = [], config = {}) {
        super(prop, label);
        this.formatter = (r) => {
            const value = r[this.prop];
            const option = this.option.find((s) => s.value === value) || {};
            return option.label || this.emptyValue;
        };
        this.option = [];
        this.setOption(option);
        this.setConfig(config);
    }
    setOption(o, s = !this.notFilter) {
        if (!o.length) {
            this.option = [];
            return this;
        }
        this.option = o.map((label, value) => {
            return isString(label)
                ? {
                    label,
                    value
                } : {
                label: label[this.params[0]],
                value: label[this.params[1]],
                ...label
            };
        });
        s && this.setFilters();
        return this;
    }
    setRemote(remoteMethod) {
        this.set('formConfig.remote', true);
        this.set('formConfig.remoteMethod', remoteMethod);
        return this;
    }
}
class Select extends BaseSelect {
    constructor() {
        super(...arguments);
        this.type = 'Select';
    }
}
class Radio extends BaseSelect {
    constructor() {
        super(...arguments);
        this.type = 'Radio';
    }
}
class SelectMultiple extends BaseSelect {
    constructor() {
        super(...arguments);
        this.type = 'SelectMultiple';
    }
}
class BaseDate extends Field {
    constructor() {
        super(...arguments);
        this.format = 'yyyy-MM-dd';
    }
}
class InputDate extends BaseDate {
    constructor(prop, label, config = {}) {
        super(prop, label);
        this.type = 'InputDate';
        this.formatter = (r) => {
            const t = parseInt(Reflect.get(r, this.prop));
            return t ? dateTimeFormat(t, this.format) : this.emptyValue;
        };
        this.setConfig(config);
    }
}
class DateRange extends BaseDate {
    constructor(prop, label, children, config = {}) {
        super(prop, label);
        this.children = children;
        this.type = 'DateRange';
        this.formatter = (r) => {
            return `${dateTimeFormat(r[this.children[0]], this.format)} - ${dateTimeFormat(r[this.children[0]], this.format)}`;
        };
        this.setConfig(config);
    }
}
class Checkbox extends Field {
    constructor() {
        super(...arguments);
        this.type = 'Checkbox';
    }
}
class Upload extends Field {
    constructor() {
        super(...arguments);
        this.type = 'Upload';
    }
}
class FieldList {
    constructor(...list) {
        this.list = [];
        this.listMap = new Map();
        this.length = 0;
        if (Array.isArray(list[0])) {
            this._init(list[0]);
        }
        else {
            this._init(list);
        }
    }
    _init(list) {
        this.list = list;
        this.listMap = new Map(list.map(v => [v.prop, v]));
        this.length = this.list.length;
    }
    find(prop) {
        if (isString(prop)) {
            return this.listMap.get(prop);
        }
        else if (isNumber(prop)) {
            const index = Math.round(prop);
            if (index < 0) {
                const len = this.length - 1;
                return this.list[len + index];
            }
            else {
                return this.list[index];
            }
        }
        else {
            return this.list[0];
        }
    }
    has(prop) {
        return !!this.find(prop);
    }
    setAllAttr(prop, value) {
        if (prop && value) {
            const list = cloneDeep(this.list);
            list.forEach(v => {
                v.set(prop, value);
            });
            return new FieldList(list);
        }
        else {
            return this;
        }
    }
    deleteAllAttr(prop) {
        if (prop) {
            const list = cloneDeep(this.list);
            list.forEach(v => {
                v.delete(prop);
            });
            return new FieldList(list);
        }
        else {
            return this;
        }
    }
    delete(...prop) {
        if (prop.length) {
            const obj = prop.reduce((a, b) => {
                Reflect.set(a, b, true);
                return a;
            }, {});
            const list = this.list.filter(v => !Reflect.has(obj, v.prop));
            return new FieldList(list);
        }
        else {
            return this;
        }
    }
    findAndSetAttr(field, prop, value) {
        const f = cloneDeep(this.find(field));
        f.set(prop, value);
        return this.replace(field, f);
    }
    replace(key, field) {
        if (isNumber(key)) {
            const index = Math.round(key);
            this.list.splice(index, 1, field);
            return new FieldList(this.list);
        }
        else if (isString(key)) {
            const index = this.findIndex(key);
            this.list.splice(index, 1, field);
            return new FieldList(this.list);
        }
        else {
            return this;
        }
    }
    insert(key, field, before = false) {
        if (isNumber(key)) {
            const index = Math.round(key);
            const list = cloneDeep(this.list);
            list.splice(index, 0, field);
            return new FieldList(list);
        }
        else if (isString(key)) {
            const index = before ? this.findIndex(key) - 1 : this.findIndex(key);
            const list = cloneDeep(this.list);
            list.splice(index, 0, field);
            return new FieldList(this.list);
        }
        else {
            return this;
        }
    }
    findIndex(prop) {
        return this.list.findIndex(v => v.prop === prop);
    }
    sliceByProp(...prop) {
        const p = prop.map(v => this.find(v)).filter(v => v);
        return new FieldList(p);
    }
    toggle(start = 0, end = this.length) {
        if (start > end) {
            return this;
        }
        if (end) {
            const s = start < this.length ? start : this.length;
            const l = end < this.length ? end : this.length;
            for (let a = s; a < l; a++) {
                const f = this.find(a);
                f && f.toggle();
            }
        }
        return this;
    }
    push(...field) {
        if (field.length) {
            this.list.push(...field);
            return new FieldList(this.list);
        }
        else {
            return this;
        }
    }
    unshift(...field) {
        if (field.length) {
            this.list.unshift(...field);
            return new FieldList(this.list);
        }
        else {
            return this;
        }
    }
    pop() {
        if (this.length) {
            this.list.pop();
            return new FieldList(this.list);
        }
        else {
            return this;
        }
    }
    shift() {
        if (this.length) {
            this.list.shift();
            return new FieldList(this.list);
        }
        else {
            return this;
        }
    }
    some(fn) {
        return this.list.some(fn);
    }
    every(fn) {
        return this.list.every(fn);
    }
    map(fn) {
        return this.list.map(fn);
    }
    filter(fn) {
        return this.list.filter(fn);
    }
    reduce(fn, current) {
        return this.list.reduce(fn, current);
    }
    *[Symbol.iterator]() {
        yield* this.list;
    }
}
export { Input, InputNumber, Select, SelectMultiple, InputDate, DateRange, Checkbox, Radio, Upload, FieldList };
