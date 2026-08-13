import DefaultTheme from "vitepress/theme";
import { h } from "vue";
import BundleSizeGraph from "../../components/BundleSizeGraph.vue";
import ExampleEditor from "../../components/ExampleEditor.vue";
import HomeHeroShader from "../../components/Hero/HomeHeroShader.vue";
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
    ctx.app.component("ExampleEditor", ExampleEditor);
  },
};
