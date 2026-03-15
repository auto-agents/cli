import { existsSync, readdirSync, statSync } from 'fs'
import path, { basename, dirname } from 'path'
import chalk from 'chalk'
import Status from '../utils/status.js'
import { resolvePath } from '../utils/utils.js'
import wildcard from 'wildcard'
import { CommandRunErrorEvent, errorEvent } from '../../../shared/src/data/events.js'
import Command from '../../../shared/src/commands/command.js'

export default class LsCommand extends Command {

	constructor(ctx) {
		super(ctx, 'ls com')
		this.status = new Status(ctx)
	}

	run(args, com) {
		const currentPath = this.ctx.cli.currentPath
		const output = this.ctx.components.output
		const theme = this.ctx.theme.ls
		const e = this.ctx.components.event

		const pathArg = 'path'
		const dirPath = this.getPositionalArg(com, args, pathArg, 0) || ''

		var resolvedPath = resolvePath(this.ctx.cli.currentPath, dirPath)
		const pattern = basename(resolvedPath)
		var wc = false
		var tpath = resolvedPath
		if (pattern && pattern.includes('*')) {
			wc = true
			tpath = dirname(resolvedPath)
		}

		// Check if path exists
		if (!existsSync(resolvedPath)) {
			e.emit(CommandRunErrorEvent,
				{
					...errorEvent(this.From,
						new Error(`path '${resolvedPath}' does not exist`)),
					cmd: this.From
				}
			)
			return
		}

		// Output the resolved path
		output.newLine()
		output.appendLine(tpath)
		output.newLine()

		const files = readdirSync(tpath, { withFileTypes: true })
		const fileStats = files.map(file => {
			if (wc && !wildcard(pattern, file.name))
				return null
			const fp = path.join(tpath, file.name)
			var stats = null
			try {
				stats = statSync(fp)
			} catch { }

			return {
				name: file.name,
				size: stats?.size || 0,
				lastModified: stats?.mtime || '',
				permissions: stats?.mode || '',
				owner: stats?.uid || '',
				group: stats?.gid || '',
				type: file.isDirectory() ? 'dir' : file.isFile() ? 'file' : 'other',
				links: stats?.nlink || ''
			}
		}).filter(x => x != null)

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

		// Helper function to colorize text

		const colorize = (text, color) => {
			return chalk.hex(color)(text)
		}

		// Output header
		const header = `${colorize('Name'.padEnd(widths.name), theme.name)} ${colorize('Size'.padEnd(widths.size), theme.size)} ${colorize('Last Modified'.padEnd(widths.lastModified), theme.lastModified)} ${colorize('Perm'.padEnd(widths.permissions), theme.permissions)} ${colorize('Owner'.padEnd(widths.owner), theme.owner)} ${colorize('Group'.padEnd(widths.group), theme.group)} ${colorize('Type'.padEnd(widths.type), theme.type)} ${colorize('Links'.padEnd(widths.links), theme.links)}`
		output.appendLine(chalk.italic(header))

		// Output row separator
		const separator = '-'.repeat(widths.name) + ' ' + '-'.repeat(widths.size) + ' ' + '-'.repeat(widths.lastModified) + ' ' + '-'.repeat(widths.permissions) + ' ' + '-'.repeat(widths.owner) + ' ' + '-'.repeat(widths.group) + ' ' + '-'.repeat(widths.type) + ' ' + '-'.repeat(widths.links)
		output.appendLine(separator.trim())

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
			output.appendLine(line.trim())
		})

		// Add blank line and summary
		output.newLine()
		const fileCount = filesWithFormattedSizes.filter(f => f.type === 'file').length
		const folderCount = filesWithFormattedSizes.filter(f => f.type === 'dir').length
		const totalSize = filesWithFormattedSizes
			.filter(f => f.type === 'file')
			.reduce((sum, f) => sum + f.size, 0)
		const formattedTotalSize = totalSize > 0 ? formatFileSize(totalSize) : '0 B'
		const summary = `${fileCount} file${fileCount !== 1 ? 's' : ''}, ${folderCount} folder${folderCount !== 1 ? 's' : ''} - total size: ${colorize(formattedTotalSize, theme.size)}`
		output.appendLine(summary)

	}
}
