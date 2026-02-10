import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

export default class LsCommand {

	constructor(ctx) {
		this.ctx = ctx
	}

	run() {
		const currentPath = this.ctx.cli.currentPath
		const output = this.ctx.components.output
		const theme = this.ctx.theme.ls
		output.newLine()

		try {
			const files = fs.readdirSync(currentPath, { withFileTypes: true })
			const fileStats = files.map(file => {
				const filePath = path.join(currentPath, file.name)
				const stats = fs.statSync(filePath)

				return {
					name: file.name,
					size: stats.size,
					lastModified: stats.mtime,
					permissions: stats.mode,
					owner: stats.uid,
					group: stats.gid,
					type: file.isDirectory() ? 'dir' : file.isFile() ? 'file' : 'other',
					links: stats.nlink
				}
			})

			// Helper function to format file size with appropriate unit
			const formatFileSize = (bytes) => {
				const units = ['B', 'Kb', 'Mb', 'Gb', 'Tb']
				let size = bytes
				let unitIndex = 0

				while (size >= 1024 && unitIndex < units.length - 1) {
					size /= 1024
					unitIndex++
				}

				return `${size.toFixed(1)} ${units[unitIndex]}`
			}

			// Calculate formatted file sizes for width calculation
			const filesWithFormattedSizes = fileStats.map(file => ({
				...file,
				formattedSize: file.type === 'dir' ? '-' : formatFileSize(file.size),
				displayName: file.type === 'dir' ? `/${file.name}` : `${file.name}`
			}))

			// Calculate column widths
			const widths = {
				name: Math.max(...filesWithFormattedSizes.map(f => f.displayName.length), 4),
				size: Math.max(...filesWithFormattedSizes.map(f => f.formattedSize.length), 4),
				lastModified: 22, // ISO date format length (19)
				permissions: 8,
				owner: Math.max(...filesWithFormattedSizes.map(f => f.owner.toString().length), 4),
				group: Math.max(...filesWithFormattedSizes.map(f => f.group.toString().length), 4),
				type: Math.max(...filesWithFormattedSizes.map(f => f.type.length), 4),
				links: Math.max(...filesWithFormattedSizes.map(f => f.links.toString().length), 5)
			}
			//console.log(widths)

			// Helper function to colorize text
			const colorize = (text, color) => {
				return chalk.hex(color)(text)
			}

			// Output header
			const header = `${colorize('Name'.padEnd(widths.name), theme.name)} ${colorize('Size'.padEnd(widths.size), theme.size)} ${colorize('Last Modified'.padEnd(widths.lastModified), theme.lastModified)} ${colorize('Permissions'.padEnd(widths.permissions), theme.permissions)} ${colorize('Owner'.padEnd(widths.owner), theme.owner)} ${colorize('Group'.padEnd(widths.group), theme.group)} ${colorize('Type'.padEnd(widths.type), theme.type)} ${colorize('Links'.padEnd(widths.links), theme.links)}`
			output.appendLine(chalk.italic(header))

			// Output row separator
			const separator = '-'.repeat(widths.name) + ' ' + '-'.repeat(widths.size) + ' ' + '-'.repeat(widths.lastModified) + ' ' + '-'.repeat(widths.permissions) + ' ' + '-'.repeat(widths.owner) + ' ' + '-'.repeat(widths.group) + ' ' + '-'.repeat(widths.type) + ' ' + '-'.repeat(widths.links)
			output.appendLine(separator)

			// Output file entries
			filesWithFormattedSizes.forEach(file => {
				const name = colorize(file.displayName.padEnd(widths.name), file.type === 'dir' ? theme.folder : theme.name)
				const size = colorize(file.formattedSize.padEnd(widths.size), theme.size)
				const lastModified = colorize(file.lastModified.toLocaleString().padEnd(widths.lastModified), theme.lastModified)
				const permissions = colorize(file.permissions.toString().padEnd(widths.permissions), theme.permissions)
				const owner = colorize(file.owner.toString().padEnd(widths.owner), theme.owner)
				const group = colorize(file.group.toString().padEnd(widths.group), theme.group)
				const type = colorize(file.type.padEnd(widths.type), theme.type)
				const links = colorize(file.links.toString().padEnd(widths.links), theme.links)

				const line = `${name} ${size} ${lastModified} ${permissions} ${owner} ${group} ${type} ${links}`
				output.appendLine(line)
			})

		} catch (error) {
			output.appendLine(output.error(error.message))
		}
	}
}
