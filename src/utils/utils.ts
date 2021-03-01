import {Base, Option} from "../type/type";

export function exportFile(res: Blob, name: string) {
    const url = window.URL.createObjectURL(new Blob([res]))
    const link = document.createElement('a')
    link.style.display = 'none'
    link.href = url
    link.setAttribute('download', name)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}
export function optionFormat(label:string,value:string|number):Option{
    return {
        label,
        value
    }
}
export function dateTimeFormat(time: Base, format: string = 'yyyy-MM-dd hh:mm') {
    if (!time) {
        return ''
    }
    const t = parseInt(String(time))
    if (isNaN(t)) {
        return ''
    }
    const date = new Date(t)
    const o = {
        'M+': date.getMonth() + 1,
        'd+': date.getDate(),
        'h+': date.getHours(),
        'm+': date.getMinutes(),
        's+': date.getSeconds(),
        'q+': Math.floor((date.getMonth() + 3) / 3),
        'S+': date.getMilliseconds()
    }
    if (/(y+)/.test(format)) {
        format = format.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
    }
    for (const k in o) {
        if (new RegExp('(' + k + ')').test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length === 1 ? Reflect.get(o, k) : ('00' + Reflect.get(o, k)).substr(('' + Reflect.get(o, k)).length))
        }
    }
    return format
}
export function timeFormat(time:Base):string{
    return dateTimeFormat(time,'MM-dd hh:mm')
}
export function dateFormat(time:Base):string{
    return dateTimeFormat(time,'yyyy-MM-dd')
}
