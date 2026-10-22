import type { CSSProperties } from 'react'

const paths = {
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
  reset: <><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  check: <path d="m5 12 4 4L19 6" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-11v1" /></>,
  target: <><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" /><path d="M12 1v5m0 12v5M1 12h5m12 0h5" /></>,
  barrel: <><path d="M3 9h18v6H3zM7 6v12m10-12v12" /></>,
  muzzle: <><path d="M4 8h16v8H4zM8 8v8m4-8v8m4-8v8" /></>,
  foregrip: <path d="M5 5h14v4h-6v11H8V9H5z" />,
  stock: <path d="M4 7h15v12h-5l-3-7H4z" />,
  magazine: <path d="M7 3h10v9l-4 9H5l3-10zM8 7h8m-8 4h7m-8 4h6" />,
  optic: <><path d="M3 8h18v8H3zM7 5v14m10-14v14M9 19h6" /><circle cx="12" cy="12" r="2" /></>,
}
export type IconName = keyof typeof paths
export function Icon({ name, size = 18, style }: { name: IconName; size?: number; style?: CSSProperties }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>{paths[name]}</svg>
}
