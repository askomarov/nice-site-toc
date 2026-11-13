<template>
  <div class="pools" aria-hidden="true">
    <div class="pool pool-side"></div>
    <div class="pool pool-top"></div>
    <div class="pool pool-bottom"></div>
  </div>
</template>

<style scoped>
.pools {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.pool {
  position: absolute;
  inset: 0;
  background-repeat: no-repeat;
}

.pool-side {
  background-image: linear-gradient(
    to left,
    rgba(255, 255, 255, 0.72) 0%,
    rgba(255, 255, 255, 0.28) 62%,
    transparent 100%
  );
  background-size: min(3.5rem, 18vw) 100%;
  background-position: right top;
  opacity: calc(1 - var(--pools-clear, 0));
}

.pool-top {
  background-image: radial-gradient(
    100% 100% at 100% 0%,
    color-mix(in srgb, var(--bg) 88%, transparent) 0%,
    color-mix(in srgb, var(--bg) 8%, transparent) 80%,
    color-mix(in srgb, var(--bg) 0%, transparent) 100%,
    transparent 97%
  );
  background-size: min(439px, 78vw) 300px;
  background-position: right top;
}

.pool-bottom {
  background-image: radial-gradient(
    60% 90% at 100% 100%,
    color-mix(in srgb, var(--bg) 78%, transparent) 38%,
    color-mix(in srgb, var(--bg) 62%, transparent) 56%,
    color-mix(in srgb, var(--bg) 42%, transparent) 72%,
    color-mix(in srgb, var(--bg) 18%, transparent) 86%,
    color-mix(in srgb, var(--bg) 5%, transparent) 94%,
    transparent 97%
  );
  background-size: min(439px, 78vw) 220px;
  background-position: right bottom;
  opacity: calc(1 - var(--pools-clear, 0));
}
</style>
