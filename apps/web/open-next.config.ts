import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig();

config.default = {
  ...config.default,
  minify: true,
  experimentalBundledNextServer: true,
};

export default config;
