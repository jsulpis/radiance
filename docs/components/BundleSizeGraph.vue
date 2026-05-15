<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import bundleSizeData from "../.vitepress/data/bundle-size.json";

type BundleSizeEntry = {
  id: string;
  label: string;
  version: string;
  sloc: number;
  gzip: number;
};

type BundleSizeRow = BundleSizeEntry & {
  weightPercent: number;
  slocPercent: number;
};

type BundleSizeData = {
  generatedAt: string;
  items: BundleSizeEntry[];
};

const data = bundleSizeData as BundleSizeData;
const graphEl = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

const generatedAt = new Date(data.generatedAt).toLocaleDateString("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const rows = computed<BundleSizeRow[]>(() => {
  const items = [...data.items].sort((a, b) => a.gzip - b.gzip);
  const maxValue = Math.max(...items.map((item) => item.gzip), 1);
  const maxSloc = Math.max(...items.map((item) => item.sloc), 1);

  return items.map((item) => {
    return {
      ...item,
      weightPercent: Number(((item.gzip / maxValue) * 100).toFixed(2)),
      slocPercent: Number(((item.sloc / maxSloc) * 100).toFixed(2)),
    };
  });
});

onMounted(() => {
  if (!graphEl.value || typeof IntersectionObserver === "undefined") {
    return;
  }

  const rows = graphEl.value.querySelectorAll("tbody tr");
  rows.forEach((row) => row.classList.add("is-hidden"));

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.remove("is-hidden");
        observer?.unobserve(entry.target);
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -10% 0px",
    },
  );

  rows.forEach((row) => observer?.observe(row));
});

onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>

<template>
  <section class="bundle-graph">
    <table ref="graphEl">
      <tbody>
        <tr
          v-for="item in rows"
          :key="item.id"
          :class="[{ 'is-highlight': item.label === '@radiancejs/gl' }]"
        >
          <td class="bundle-graph__label">
            <span class="lib-label">{{ item.label }}</span>
            <span v-if="item.version" class="lib-version">{{ item.version }}</span>
          </td>

          <td class="bundle-graph__metrics">
            <div class="bundle-graph__metric-row">
              <span class="bundle-graph__metric-value">{{ item.gzip }} kB</span>
              <div class="bundle-graph__pill" :style="{ width: `${item.weightPercent}%` }"></div>
            </div>

            <div class="bundle-graph__metric-row bundle-graph__metric-row--sloc">
              <span class="bundle-graph__metric-value">{{ item.sloc }} sloc</span>
              <div
                class="bundle-graph__pill bundle-graph__pill--sloc"
                :style="{ width: `${item.slocPercent}%` }"
              ></div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <p class="bundle-graph__legend">
      <span><strong>weight</strong> = gzip size</span>
      <span><strong>sloc</strong> = source lines of code (JS) to render the shader</span>
    </p>
    <p class="bundle-graph__meta">
      Updated {{ generatedAt }}. See the
      <a
        href="https://github.com/jsulpis/radiance/benchmark"
        target="_blank"
        rel="noopener noreferrer"
        >benchmark</a
      >.
    </p>
  </section>
</template>

<style lang="scss" scoped>
.bundle-graph {
  max-width: 800px;

  &__meta {
    margin: 0 0;
    color: var(--vp-c-text-2);
    font-size: 0.92rem;
  }

  &__legend {
    display: flex;
    flex-wrap: wrap;
    margin: 0;
    color: var(--vp-c-text-2);
    font-size: 0.9rem;

    span:first-child {
      margin-right: 1.5rem;
    }
  }

  &__label {
    font-size: 1rem;
    font-weight: bold;
    width: 12ch;
    padding: 0;
    line-height: 1.5;

    .lib-label {
      margin: 0;
    }

    .lib-version {
      display: block;
      font-size: 0.75em;
      opacity: 0.8;
    }
  }

  table {
    border: 0;
    display: table;
    table-layout: fixed;
    width: 100%;
  }

  tbody {
    width: 100%;
  }

  tr,
  td {
    background: transparent;
    border: 0;
  }

  tr {
    &:not(.is-highlight) {
      .bundle-graph__pill {
        filter: grayscale(10%) opacity(0.6) hue-rotate(-10deg) brightness(110%);
      }
    }
  }

  &__metrics {
    padding: 0.75rem 0.2rem;
  }

  &__metric-row {
    display: grid;
    grid-template-columns: 7ch 1fr;
    gap: 4px;
    align-items: center;
    line-height: 1.5;
    font-size: 0.9em;
  }

  &__pill {
    min-width: 4px;
    min-height: 1rem;
    border-radius: 2px 6px 6px 2px;
    background: linear-gradient(to right, var(--vp-c-brand-2), var(--vp-c-brand-1));
    transform-origin: left center;
    transition: transform 600ms cubic-bezier(0.4, 0, 0.2, 1);

    &--sloc {
      background: linear-gradient(to right, var(--vp-c-warning-3), var(--vp-c-warning-2));
      filter: hue-rotate(-10deg) brightness(110%);
    }
  }

  .is-hidden &__pill {
    transform: scaleX(0);
  }

  @media (prefers-reduced-motion: reduce) {
    &__pill {
      transition: none;
    }
  }

  @media (max-width: 640px) {
    & {
      margin-right: 0;
      max-width: none;
    }

    table,
    tbody,
    tr,
    td {
      display: block;
      width: 100%;
    }

    tr {
      margin-bottom: 1.5rem;
    }

    & &__label {
      width: auto;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-bottom: 0.5rem;
    }

    &__metrics {
      padding: 0 0 0 0.5rem;
    }

    &__metric-row {
      & + & {
        margin-top: 0.2rem;
      }
    }
  }
}

@keyframes bundle-graph-reveal {
  from {
    transform: scaleX(0);
  }
}
</style>
