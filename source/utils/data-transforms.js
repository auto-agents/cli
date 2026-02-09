import chalk from 'chalk'

export default class DataTransforms {

	constructor(ctx) {
		this.ctx = ctx
	}

	propData(originalValue, value, valueText, unit) {
		return {
			originalValue: originalValue || '',
			value: value || '',
			valueText: valueText || '',
			unit: unit || ''
		}
	}

	initProp(prop, propData) {
		prop.lastData = { ...prop.data }
		prop.value = propData.valueText
		prop.data = propData
	}

	toBytesWithUnitStr(n, decimals = 0, colorMap) {
		if (!n) return this.propData()
		const r = this.toBytesWithUnit(n, decimals)
		if (!r.value || r.value == '') return this.propData()
		var numCol = null
		if (colorMap) {
			for (const kt in colorMap) {
				const kv = parseFloat(kt)
				if (!numCol && r.value <= kv)
					numCol = colorMap[kt]
			}
		}
		const unit = chalk.hex(this.ctx.theme.valueColor)
		const num = chalk.hex(numCol || this.ctx.theme.unitColor)
		return this.propData(
			n,
			r.value,
			num(r.value) + ' ' + unit(r.unit),
			r.unit);
	}

	toBytesWithUnit(n, decimals = 0) {
		const r = (v, u) => {
			return {
				value: v,
				unit: u
			}
		}
		const round = v => {
			return decimals == 0 ?
				Math.round(v)
				: parseFloat(v.toFixed(decimals))
		}
		if (!n || n == '') return r('', '')
		const k = 1024
		if (n < k) return r(k, 'By')
		if (n < k * k) return r(round(n / k), 'Ko')
		if (n < k * k * k) return r(round(n / (k * k)), 'Mo')
		return r(round(n / (k * k * k)), 'Go')
	}
}
