import { onMounted, onUnmounted, type Ref } from 'vue'
import gsap from 'gsap'
import { useLenis } from 'lenis/vue'

const LARGE_FONT = 36
const SMALL_FONT = 18
const SMALL_SCALE = SMALL_FONT / LARGE_FONT
const RIGHT = 32
const TOP_INSET = 20
const STACK_STEP = 16
const ACTIVE_GAP = 18
const BOTTOM_INSET = 20
const BOTTOM_STEP = 16
const ENTER_DISTANCE = 64
const ARRIVE_DISTANCE = 210
const END_ARRIVE = 200
const STAGGER_SPREAD = 0.58
const REST_MS = 400
const REST_DURATION = 0.7
const REST_EDGE = 0.04

type Pose = {
  x: number
  y: number
  rotation: number
  scale: number
}

type Metric = {
  width: number
  height: number
}

type LetterRuntime = {
  el: HTMLElement
  metric: Metric
  setX: (value: number) => void
  setY: (value: number) => void
  setRotation: (value: number) => void
  setScaleX: (value: number) => void
  setScaleY: (value: number) => void
}

type SectionRuntime = {
  el: HTMLElement
  link: HTMLAnchorElement | null
  letters: LetterRuntime[]
}

const parsedEase = gsap.parseEase('power2.inOut')

function ease(progress: number): number {
  return typeof parsedEase === 'function' ? parsedEase(progress) : progress
}

function easeInOutCubic(progress: number): number {
  return progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function activeLine(index: number): number {
  return TOP_INSET + index * STACK_STEP + ACTIVE_GAP
}

function topCenterY(index: number): number {
  return TOP_INSET + index * STACK_STEP + (LARGE_FONT * SMALL_SCALE) / 2
}

function activeCenterY(index: number): number {
  return activeLine(index) + LARGE_FONT / 2
}

function bottomCenterY(index: number, count: number): number {
  const fromEnd = count - 1 - index
  return window.innerHeight - BOTTOM_INSET - fromEnd * BOTTOM_STEP - (LARGE_FONT * SMALL_SCALE) / 2
}

function horizontalPoses(metrics: Metric[], scale: number, centerY: number): Pose[] {
  const right = window.innerWidth - RIGHT
  const total = metrics.reduce((sum, metric) => sum + metric.width * scale, 0)
  let cursor = right - total

  return metrics.map((metric) => {
    const advance = metric.width * scale
    const centerX = cursor + advance / 2
    cursor += advance
    return {
      x: centerX - metric.width / 2,
      y: centerY - metric.height / 2,
      rotation: 0,
      scale,
    }
  })
}

function queueLimit(tops: number[], index: number): number {
  const fold = window.innerHeight
  const labelHalf = (LARGE_FONT * SMALL_SCALE) / 2
  let limit = fold - 12

  for (let later = index + 1; later < tops.length; later++) {
    const top = tops[later]
    if (top === undefined || top <= fold - ENTER_DISTANCE) continue
    const labelTop = bottomCenterY(later, tops.length) - labelHalf
    limit = Math.min(limit, labelTop - 8)
  }

  return limit
}

function verticalPoses(metrics: Metric[], anchorY: number, limitBottom: number): Pose[] {
  const scale = SMALL_SCALE
  const total = metrics.reduce((sum, metric) => sum + metric.width * scale, 0)
  const column = Math.max(...metrics.map((metric) => metric.height), LARGE_FONT) * scale
  const centerX = window.innerWidth - RIGHT - column / 2
  const anchor = Math.min(anchorY, limitBottom - total / 2)
  let cursor = anchor + total / 2

  return metrics.map((metric) => {
    const advance = metric.width * scale
    const centerY = cursor - advance / 2
    cursor -= advance
    return {
      x: centerX - metric.width / 2,
      y: centerY - metric.height / 2,
      rotation: -90,
      scale,
    }
  })
}

function blendPoses(
  from: Pose[],
  to: Pose[],
  progress: number,
  stagger: boolean,
  reduced: boolean,
): Pose[] {
  const amount = reduced ? (progress >= 0.5 ? 1 : 0) : progress
  const spread = stagger && !reduced && from.length > 1 ? STAGGER_SPREAD : 0

  return from.map((pose, index) => {
    const delay = spread === 0 ? 0 : ((from.length - 1 - index) / (from.length - 1)) * spread
    const t = ease(clamp((amount - delay) / (1 - spread || 1), 0, 1))
    const target = to[index]
    if (!target) return pose
    return {
      x: pose.x + (target.x - pose.x) * t,
      y: pose.y + (target.y - pose.y) * t,
      rotation: pose.rotation + (target.rotation - pose.rotation) * t,
      scale: pose.scale + (target.scale - pose.scale) * t,
    }
  })
}

function arriveProgress(top: number, index: number): number {
  const line = activeLine(index)
  if (top <= line) return 1
  if (top >= line + ARRIVE_DISTANCE) return 0
  return 1 - (top - line) / ARRIVE_DISTANCE
}

function endArriveProgress(
  top: number,
  index: number,
  scrollY: number,
  maxScroll: number,
  bottomDoc: number,
): number {
  const line = activeLine(index)
  if (top + scrollY - maxScroll <= line) return 0

  const start = Math.min(bottomDoc - window.innerHeight, maxScroll - END_ARRIVE)
  const span = Math.max(END_ARRIVE, maxScroll - start)
  return clamp((scrollY - start) / span, 0, 1)
}

function flipProgress(
  top: number,
  index: number,
  scrollY: number,
  maxScroll: number,
  bottomDoc: number,
): number {
  return Math.max(
    arriveProgress(top, index),
    endArriveProgress(top, index, scrollY, maxScroll, bottomDoc),
  )
}

function enterProgress(top: number): number {
  const fold = window.innerHeight
  if (top >= fold) return 0
  if (top <= fold - ENTER_DISTANCE) return 1
  return (fold - top) / ENTER_DISTANCE
}

function posesFor(
  index: number,
  tops: number[],
  bottoms: number[],
  metrics: Metric[],
  reduced: boolean,
  scrollY: number,
  maxScroll: number,
): Pose[] {
  const top = tops[index]
  const bottom = bottoms[index]
  if (top === undefined || bottom === undefined) return []

  const nextTop = tops[index + 1]
  const nextBottom = bottoms[index + 1]
  const pushed =
    nextTop === undefined || nextBottom === undefined
      ? 0
      : flipProgress(nextTop, index + 1, scrollY, maxScroll, nextBottom)
  const progress = flipProgress(top, index, scrollY, maxScroll, bottom)
  const activePose = horizontalPoses(metrics, 1, activeCenterY(index))
  const topPose = horizontalPoses(metrics, SMALL_SCALE, topCenterY(index))
  const bottomPose = horizontalPoses(metrics, SMALL_SCALE, bottomCenterY(index, tops.length))
  const verticalPose = verticalPoses(metrics, top, queueLimit(tops, index))

  if (progress >= 1) {
    return blendPoses(activePose, topPose, pushed, false, reduced)
  }

  if (progress > 0) {
    return blendPoses(verticalPose, activePose, progress, true, reduced)
  }

  if (top > window.innerHeight - ENTER_DISTANCE) {
    return blendPoses(bottomPose, verticalPose, enterProgress(top), true, reduced)
  }

  return verticalPose
}

function bind(root: HTMLElement): SectionRuntime[] {
  const sections = [...root.querySelectorAll<HTMLElement>('[data-section]')]
  const links = [...root.querySelectorAll<HTMLAnchorElement>('a[data-nav]')]

  return sections.map((el, index) => {
    const link = links[index] ?? null
    const letters = link ? [...link.querySelectorAll<HTMLElement>('.letter')] : []
    return {
      el,
      link,
      letters: letters.map((letter) => {
        gsap.set(letter, { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 })
        return {
          el: letter,
          metric: { width: 0, height: 0 },
          setX: gsap.quickSetter(letter, 'x', 'px') as (value: number) => void,
          setY: gsap.quickSetter(letter, 'y', 'px') as (value: number) => void,
          setRotation: gsap.quickSetter(letter, 'rotation', 'deg') as (value: number) => void,
          setScaleX: gsap.quickSetter(letter, 'scaleX') as (value: number) => void,
          setScaleY: gsap.quickSetter(letter, 'scaleY') as (value: number) => void,
        }
      }),
    }
  })
}

function measure(sections: SectionRuntime[]) {
  for (const section of sections) {
    for (const letter of section.letters) {
      letter.metric = {
        width: letter.el.offsetWidth,
        height: letter.el.offsetHeight,
      }
    }
  }
}

function restingScroll(sections: SectionRuntime[], scrollY: number): number | null {
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
  const fold = window.innerHeight

  for (let index = 0; index < sections.length; index++) {
    const section = sections[index]
    if (!section) continue
    const rect = section.el.getBoundingClientRect()
    const top = rect.top
    const bottomDoc = scrollY + rect.bottom
    const line = activeLine(index)
    const progress = flipProgress(top, index, scrollY, maxScroll, bottomDoc)

    if (progress > REST_EDGE && progress < 1 - REST_EDGE) {
      if (top + scrollY - maxScroll > line) {
        const start = Math.min(bottomDoc - fold, maxScroll - END_ARRIVE)
        return clamp(progress >= 0.5 ? maxScroll : start - 4, 0, maxScroll)
      }

      const desired = progress >= 0.5 ? line - 4 : line + ARRIVE_DISTANCE + 4
      return clamp(scrollY + top - desired, 0, maxScroll)
    }

    if (top < fold && top > fold - ENTER_DISTANCE) {
      const enter = (fold - top) / ENTER_DISTANCE
      if (enter > REST_EDGE && enter < 1 - REST_EDGE) {
        const desired = enter >= 0.5 ? fold - ENTER_DISTANCE - 4 : fold + 4
        return clamp(scrollY + top - desired, 0, maxScroll)
      }
    }
  }

  return null
}

function apply(
  root: HTMLElement,
  sections: SectionRuntime[],
  reduced: boolean,
  scrollY: number,
): boolean {
  const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
  const tops: number[] = []
  const bottoms: number[] = []
  for (const section of sections) {
    const rect = section.el.getBoundingClientRect()
    tops.push(rect.top)
    bottoms.push(scrollY + rect.bottom)
  }
  let ready = sections.length > 0
  let poolsClear = sections.length > 0 ? 1 : 0
  const activeThreshold = (SMALL_SCALE + 1) / 2

  sections.forEach((section, index) => {
    const top = tops[index]
    const bottom = bottoms[index]
    if (top !== undefined && bottom !== undefined) {
      poolsClear = Math.min(poolsClear, flipProgress(top, index, scrollY, maxScroll, bottom))
    } else {
      poolsClear = 0
    }

    const metrics = section.letters.map((letter) => letter.metric)
    if (metrics.length === 0 || metrics.some((metric) => metric.height === 0)) {
      ready = false
      return
    }

    const poses = posesFor(index, tops, bottoms, metrics, reduced, scrollY, maxScroll)
    const isActive = (poses[0]?.scale ?? 0) > activeThreshold
    section.link?.classList.toggle('is-active', isActive)

    poses.forEach((pose, letterIndex) => {
      const letter = section.letters[letterIndex]
      if (!letter) return
      letter.setX(pose.x)
      letter.setY(pose.y)
      letter.setRotation(pose.rotation)
      letter.setScaleX(pose.scale)
      letter.setScaleY(pose.scale)
    })
  })

  root.style.setProperty('--pools-clear', String(poolsClear))
  return ready
}

export function useFlyingNav(root: Ref<HTMLElement | null>) {
  const lenis = useLenis()
  let stop = () => {}

  onMounted(() => {
    const el = root.value
    if (!el) return

    const sections = bind(el)
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let restTimer = 0
    let ownScroll: number | null = null
    let settleTween: { kill: () => void } | null = null

    const currentScroll = () => lenis.value?.scroll ?? window.scrollY

    const writeScroll = (y: number) => {
      if (lenis.value) {
        lenis.value.scrollTo(y, { immediate: true })
        return
      }
      window.scrollTo(0, y)
    }

    const stopSettle = () => {
      settleTween?.kill()
      settleTween = null
      ownScroll = null
    }

    const beginSettle = () => {
      if (motion.matches || settleTween) return
      const scrollY = currentScroll()
      const target = restingScroll(sections, scrollY)
      if (target === null || Math.abs(target - scrollY) < 2) return
      const proxy = { y: scrollY }
      settleTween = gsap.to(proxy, {
        y: target,
        duration: REST_DURATION,
        ease: easeInOutCubic,
        onUpdate: () => {
          ownScroll = proxy.y
          writeScroll(proxy.y)
        },
        onComplete: () => {
          settleTween = null
          window.requestAnimationFrame(() => {
            ownScroll = null
          })
        },
      })
    }

    const update = () => {
      if (apply(el, sections, motion.matches, currentScroll())) el.classList.add('is-ready')
    }

    const requestUpdate = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        update()
      })
    }

    const requestMeasure = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        frame = 0
        measure(sections)
        update()
      })
    }

    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const link = target.closest('a[data-nav]')
      if (!(link instanceof HTMLAnchorElement) || !el.contains(link)) return
      const id = link.getAttribute('href')?.slice(1)
      if (!id) return
      const section = document.getElementById(id)
      if (!section) return
      event.preventDefault()
      stopSettle()
      if (lenis.value) {
        lenis.value.scrollTo(section, { immediate: motion.matches })
        return
      }
      section.scrollIntoView({
        behavior: motion.matches ? 'auto' : 'smooth',
        block: 'start',
      })
    }

    measure(sections)
    update()

    const onScroll = () => {
      requestUpdate()
      if (ownScroll !== null && Math.abs(currentScroll() - ownScroll) < 1) return
      stopSettle()
      window.clearTimeout(restTimer)
      restTimer = window.setTimeout(beginSettle, REST_MS)
    }

    const onMotion = () => update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', requestMeasure)
    el.addEventListener('click', onClick)
    motion.addEventListener('change', onMotion)

    const fonts = document.fonts?.ready
    if (fonts) void fonts.then(() => requestMeasure())

    stop = () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.clearTimeout(restTimer)
      stopSettle()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', requestMeasure)
      el.removeEventListener('click', onClick)
      motion.removeEventListener('change', onMotion)
    }
  })

  onUnmounted(() => stop())
}
