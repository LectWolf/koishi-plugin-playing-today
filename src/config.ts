import { Schema } from "koishi";

// 基础设置
export interface Config {
  admin?: string[];
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    admin: Schema.array(String).role("table").description("管理员"),
  }),
]);
