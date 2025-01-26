export const sGridComponents = [
  'Cell',
  'Col',
  'Color',
  'CommandCenter',
  'Fixtures',
  'Grid',
  'History',
  'Project',
  'PubSub',
  'Row',
  'Selection',
  'Transformer',
  'UI',
] as const
export type SGridComponent = (typeof sGridComponents)[number]
