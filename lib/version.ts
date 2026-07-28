export const APP_VERSION = process.env.npm_package_version || '0.1.0'

export function getVersionInfo() {
  return {
    version: APP_VERSION,
    name: 'tikworth',
  }
}
