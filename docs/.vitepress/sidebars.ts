import type { DefaultTheme } from "vitepress";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import typedocSidebar from "../api/typedoc-sidebar.json";

type SidebarItem = DefaultTheme.SidebarItem;

const examplesDir = "examples";

const sections = fs
  .readdirSync(examplesDir)
  .filter((file) => fs.statSync(path.join(examplesDir, file)).isDirectory());

export const examplesSidebar: SidebarItem[] = sections.map((section) => {
  const sectionPath = path.join(examplesDir, section);
  const pages = fs
    .readdirSync(sectionPath)
    .filter((file) => fs.statSync(path.join(sectionPath, file)).isDirectory());

  return {
    text: capitalize(section),
    items: pages
      .map((page) => {
        const indexPath = path.join(sectionPath, page, "index.md");
        const { data } = matter(fs.readFileSync(indexPath, "utf8"));
        return {
          title: data.title || page,
          slug: page,
          position: data.position || 0,
        };
      })
      .sort((a, b) => a.position - b.position)
      .map((data) => ({
        text: data.title,
        link: `/examples/${section}/${data.slug}/`,
      })),
  };
});

export const apiSidebar: SidebarItem[] = [
  {
    text: "API Overview",
    link: "/api/",
  },
  ...normalizeApiSidebar(typedocSidebar),
];

function normalizeApiSidebar(items: SidebarItem[], depth = 0): SidebarItem[] {
  return items.map((item) => ({
    ...item,
    text: formatApiLabel(item.text!, depth),
    link: depth === 0 ? `/api/${item.text}/` : item.link,
    collapsed: depth > 0,
    items: item.items ? normalizeApiSidebar(item.items, depth + 1) : undefined,
  }));
}

function formatApiLabel(label: string, depth: number) {
  if (depth > 1) return label;
  return upperFirst(
    label.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2"),
  ).replace(/On |Watch |Gl /, "");
}

function upperFirst(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function capitalize(str: string) {
  return str.split(" ").map(upperFirst).join(" ");
}
