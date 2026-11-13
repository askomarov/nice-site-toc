export type Section = {
  id: string
  title: string
  body: string
}

export const sections: Section[] = [
  {
    id: 'about',
    title: 'ABOUT',
    body: 'Demo portfolio of a product designer and front-end developer. Interfaces, motion, and small tools built with care.',
  },
  {
    id: 'work',
    title: 'SELECTED WORK',
    body: 'Case studies from client and side projects: dashboards, marketing sites, and interaction-heavy prototypes.',
  },
  {
    id: 'process',
    title: 'PROCESS',
    body: 'From brief to ship: research, wireframes, high-fidelity UI, then polished Vue and CSS in the browser.',
  },
  {
    id: 'stack',
    title: 'STACK',
    body: 'Vue, TypeScript, Vite, and thoughtful CSS. Comfortable with design systems, Figma handoff, and motion.',
  },
  {
    id: 'notes',
    title: 'NOTES',
    body: 'Short write-ups on layout, animation, and building portfolio pieces that still feel like real products.',
  },
  {
    id: 'contact',
    title: 'CONTACT',
    body: 'Open for freelance and collaboration. This page is a demo — replace the copy with your real links and projects.',
  },
]
