import DefaultTheme from "vitepress/theme";
import { Sandbox } from "vitepress-plugin-sandpack";
import { h } from "vue";
import BundleSizeGraph from "../../components/BundleSizeGraph.vue";
import ExampleEditor from "../../components/ExampleEditor.vue";
import HomeHeroShader from "../../components/Hero/HomeHeroShader.vue";
import "vitepress-plugin-sandpack/dist/style.css";
import "virtual:group-icons.css";
import "./styles.scss";

export default {
  ...DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      "home-hero-image": () => h(HomeHeroShader),
    });
  },
  enhanceApp(ctx) {
    DefaultTheme.enhanceApp(ctx);
    ctx.app.component("BundleSizeGraph", BundleSizeGraph);
    ctx.app.component("Sandbox", Sandbox);
    ctx.app.component("ExampleEditor", ExampleEditor);
  },
};
