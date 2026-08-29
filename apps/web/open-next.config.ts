import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig();

config.default = {
  ...config.default,
  minify: true,
  experimentalBundledNextServer: true,
};

config.edgeExternals = ["node:crypto", "sharp"];

export default config;
