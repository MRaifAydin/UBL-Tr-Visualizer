import type { ModuleConfig } from '../types'
import * as despatch from './despatch/config'
import * as invoice from './invoice/config'

export const MODULES: Record<string, ModuleConfig> = {
  invoice,
  despatch,
}
