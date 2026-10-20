const base = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }

export const Home = (p) => <svg {...base} {...p}><path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" /></svg>
export const Camera = (p) => <svg {...base} {...p}><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13" r="3.5" /></svg>
export const Doc = (p) => <svg {...base} {...p}><path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /><path d="M14 3v4h4M9 12h6M9 16h6" /></svg>
export const Ring = (p) => <svg {...base} {...p}><circle cx="12" cy="15" r="5" /><path d="M9 6l3-3 3 3-3 4z" /></svg>
export const Pen = (p) => <svg {...base} {...p}><path d="M4 20l1-4L16 5l3 3L8 19z" /><path d="M14 7l3 3" /></svg>
export const Person = (p) => <svg {...base} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></svg>
export const Check = (p) => <svg {...base} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
export const Plus = (p) => <svg {...base} {...p}><path d="M12 5v14M5 12h14" /></svg>
export const Trash = (p) => <svg {...base} {...p}><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" /></svg>
export const Lock = (p) => <svg {...base} {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
export const Image = (p) => <svg {...base} {...p}><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="1.7" /><path d="M4 18l5-5 4 4 3-3 4 4" /></svg>
export const Download = (p) => <svg {...base} {...p}><path d="M12 4v11M7 11l5 5 5-5M5 20h14" /></svg>
export const Move = (p) => <svg {...base} {...p}><path d="M12 3v18M3 12h18M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3" /></svg>
