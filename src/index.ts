import { Context } from "koishi";
import zh from "./locales/zh-CN.yml";
import * as common from "./common";
import { Config } from "./config";
import { initDataBase } from "./database";

export const name = "playing-today";
export const inject = ["cache"];

export * from "./config";

declare module "@koishijs/cache" {
  interface Tables {
    [key: `playing_today_${string}`]: number;
  }
}
export function apply(ctx: Context, config: Config) {
  // 加载语言
  ctx.i18n.define("zh-CN", zh);
  initDataBase(ctx, config);

  ctx
    .intersect((session) => session.type === "group")
    .platform("onebot")
    .plugin(common, config);
}
