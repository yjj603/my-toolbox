const {dateFormat, timeFormat, dateTimeFormat, optionFormat, Input, Select, FieldList} = require('../lib/bundle.cjs')
test('时间工具函数', () => {
    expect(dateTimeFormat('abc')).toBe('')
    expect(dateFormat(1614225381649)).toBe('2021-02-25')
    expect(dateFormat('1614225381649')).toBe('2021-02-25')
    expect(timeFormat('1614225381649')).toBe('02-25 11:56')
})
test('基类类测试', () => {
    const data = {
        test: '我是测试'
    }
    const test = new Input(' test ', '测试')
    const test2 = new Input('test2', '测试2')
    const test3 = new Input('test', '测试3', {
        formatter(r: {}) {
            return 'formatter已改变'
        }
    })
    test3.set('a.b.c', '递归查询')
    expect(test.prop).toBe('test')
    expect(test.formatter(data)).toBe('我是测试')
    expect(test2.formatter(data)).toBe('-')
    expect(test3.formatter(data)).toBe('formatter已改变')
    expect(test3.get('a.b.c')).toBe('递归查询')
    test3.delete('a.b')
    expect(test3.get('a')).toEqual({})
    expect(test3.has('a.b')).toBe(false)
    const fn = () => {
        return ''
    }
    test3.set('method', fn)
    test3.set('method', fn)
    expect(test3.method.size).toBe(1)

})
test('枚举类测试', () => {
    const data = {
        test: 'USD',
        test2: 1
    }
    const list = [optionFormat('USD', 'USD'), optionFormat('CNY', 'CNY')]
    const list2 = ['USD', 'CNY']
    const test = new Select('test', '测试', list)
    const test2 = new Select('test2', '测试2', list2)
    expect(test.formatter(data)).toBe('USD')
    expect(test2.formatter(data)).toBe('CNY')
    expect(test2.filters).toEqual([{
        text: 'USD',
        value: 0
    }, {
        text: 'CNY',
        value: 1
    }])
})
test('集合类测试', () => {
    const input = new Input('input', 'Input')
    const select = new Select('select', 'Select')
    const list = new FieldList(input, select)
    expect(list.find(1).prop).toBe('select')
    expect(list.find('input').prop).toBe('input')
    const list2 = list.setAllAttr('testKey', '属性已修改')
    expect(list2.every((v: any) => v.testKey === '属性已修改')).toBe(true)
    const list3 = list2.deleteAllAttr('testKey')
    expect(list3.some((v: any) => v.testKey === '属性已修改')).toBe(false)
    const input2 = new Input('input2','input2')
    const input3 = new Input('input3','input3')
    const list4 = list3.push(input2,input3)
    const list5 = new FieldList(input2,input3)
    expect(list4.sliceByProp('input2','input3').map((v:any)=>v.prop)).toEqual(['input2','input3'])
})
