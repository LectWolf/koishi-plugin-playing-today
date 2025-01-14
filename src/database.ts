import { Context } from "koishi";
import { Config } from "src";

declare module "koishi" {
  interface Tables {
    star_game_library: StarGameLibrary;
    star_game: StarGame;
    star_game_select: StarGameSelect;
  }
}

export function initDataBase(ctx: Context, config: Config) {
  ctx.model.extend(
    "star_game_library",
    {
      id: "unsigned",
      name: "string",
    },
    {
      autoInc: true,
    }
  );
  ctx.model.extend(
    "star_game",
    {
      id: "unsigned",
      library_id: "unsigned",
      name: "string",
    },
    {
      autoInc: true,
    }
  );

  ctx.model.extend(
    "star_game_select",
    {
      id: "unsigned",
      sid: "string",
      library_id: "unsigned",
    },
    {
      autoInc: true,
    }
  );
}

// 绑定信息
export interface StarGameLibrary {
  id: number;
  name: string;
}
export interface StarGame {
  id: number;
  library_id: number;
  name: string;
}

export interface StarGameSelect {
  id: number;
  sid: string;
  library_id: number;
}
