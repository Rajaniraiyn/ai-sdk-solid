import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid()],
  optimizeDeps: {
    // https://github.com/andi23rosca/solid-markdown/issues/33#issuecomment-2612454745
    include: ["solid-markdown > micromark", "solid-markdown > unified"],
  },
});
