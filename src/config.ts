import { Schema } from "koishi";

// 基础设置
export interface Config {
  admin?: string[];
  cooldown: number;
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    admin: Schema.array(String).role("table").description("管理员"),
    cooldown: Schema.number().description("缓存保留时间(分钟)").default(120),
  }),
]);
