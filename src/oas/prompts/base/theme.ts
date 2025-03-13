import { Status } from '@inquirer/core';
import figures from '@inquirer/figures';
import PropScalar from '../../nodes/props/prop_scalar';
import { IType } from '../../nodes/type';
import { CustomTheme, RenderContext } from '../theme';

// const theme: CustomTheme = {
//   prefix: {
//     idle: colors.cyan('?'),
//     done: colors.green(figures.tick),
//     canceled: colors.red(figures.cross)
//   },
//   style: {
//     disabled: (text: string) => colors.dim(text),
//     active: (text: string) => colors.cyan(text),
//     cancelText: (text: string) => colors.red(text),
//     emptyText: (text: string) => colors.red(text),
//     directory: (text: string) => colors.yellow(text),
//     file: (text: string) => colors.white(text),
//     currentDir: (text: string) => colors.magenta(text),
//     message: (text: string, _status: Status) => colors.bold(text),
//     help: (text: string) => colors.white(text),
//     key: (text: string) => colors.cyan(text)
//   },
//   labels: {
//     disabled: '(not allowed)'
//   },
//   hierarchySymbols: {
//     branch: figures.lineUpDownRight + figures.line,
//     leaf: figures.lineUpRight + figures.line
//   },
//   renderItem(item: IType, context: RenderContext) {
//     const isLast = context.index === context.items.length - 1
//     const linePrefix =
//       isLast && !context.loop
//         ? this.hierarchySymbols.leaf
//         : this.hierarchySymbols.branch
//
//     const isDirectory = !(item instanceof PropScalar)
//     const line = isDirectory
//       ? `${linePrefix} ${item.name}+`
//       : `${linePrefix} ${item.name}`
//
//     // if (item.isDisabled) {
//     //   return this.style.disabled(`${line} ${this.labels.disabled}`)
//     // }
//
//     const baseColor = isDirectory ? this.style.directory : this.style.file
//     const color = context.isActive ? this.style.active : baseColor
//
//     return color(line)
//   }
// }

// export default theme;
