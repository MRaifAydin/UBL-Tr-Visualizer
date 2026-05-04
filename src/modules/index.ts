import type { ModuleConfig } from '../types'
import * as invoice from './invoice/config'

export const MODULES: Record<string, ModuleConfig> = {
  invoice,
}
