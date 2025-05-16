export function detectComponentType(filePath: string): string | null {
  if (filePath.endsWith('.cls')) return 'ApexClass';
  if (filePath.endsWith('.trigger')) return 'ApexTrigger';
  if (filePath.includes('/lwc/')) return 'LWC';
  if (filePath.includes('/aura/')) return 'Aura';
  if (filePath.endsWith('.flow-meta.xml')) return 'Flow';
  if (filePath.endsWith('.permissionset-meta.xml')) return 'PermissionSet';
  if (filePath.endsWith('.layout-meta.xml')) return 'Layout';
  if (filePath.endsWith('.object-meta.xml')) return 'Object';
  if (filePath.endsWith('__mdt.meta.xml')) return 'CustomMetadata';
  return null;
}
