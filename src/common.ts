import { Context, h, Session, Time } from "koishi";
import { Config } from ".";
import {} from "@koishijs/cache";

export function apply(ctx: Context, config: Config) {
  ctx
    .command("today_play")
    .alias("今天玩什么")
    .action(async ({ session }) => {
      let sid = "G" + session.guildId;
      if (session.type === "private") {
        sid = "P" + session.userId;
      }
      // 获取选择的游戏库
      const [slectLibrary] = await ctx.database.get("star_game_select", {
        sid: sid,
      });
      if (!slectLibrary) {
        return reply(session, ".notexist");
      }
      let key = "P" + session.userId;
      if (session.type === "group") {
        const groupInfo = await session.bot.internal.getGroupInfo(
          session.guildId,
          true
        );
        // 人数大于100,按照群计算
        if (groupInfo.member_count > 100) {
          key = "G" + session.guildId;
        }
      }
      const cachedGameId = await ctx.cache.get(
        `playing_today_${key}`,
        `${slectLibrary.library_id}`
      );
      // 存在缓存
      if (cachedGameId) {
        const [cachedGame] = await ctx.database.get("star_game", {
          id: cachedGameId,
        });
        return reply(session, ".hascache", { game: cachedGame.name });
      }
      const games = await ctx.database.get("star_game", {
        library_id: slectLibrary.library_id,
      });
      // 游戏库为空
      if (games.length === 0) {
        return reply(session, ".emptyLibrary");
      }
      // 随机选择一个游戏
      const randomGame = games[Math.floor(Math.random() * games.length)];
      // 设置缓存 2小时
      await ctx.cache.set(
        `playing_today_${key}`,
        `${slectLibrary.library_id}`,
        randomGame.id,
        config.cooldown * Time.minute
      );
      return reply(session, ".success", { game: randomGame.name });
    });

  // 选择游戏库
  ctx
    .command("select_library <库名>")
    .alias("类型")
    .action(async ({ session }, t_library) => {
      if (!t_library) {
        return reply(session, ".format");
      }
      const [library] = await ctx.database.get("star_game_library", {
        name: t_library,
      });
      if (!library) {
        return reply(session, ".notexist", { library: t_library });
      }
      let sid = "G" + session.guildId;
      if (session.type === "private") {
        sid = "P" + session.userId;
      }
      const [existingGame] = await ctx.database.get("star_game_select", {
        sid: sid,
      });
      if (existingGame) {
        await ctx.database.set(
          "star_game_select",
          { sid: sid },
          { library_id: library.id }
        );
      } else {
        await ctx.database.upsert("star_game_select", [
          { sid: sid, library_id: library.id },
        ]);
      }
      return reply(session, ".success", { library: t_library });
    });
  // 创建游戏库
  ctx
    .command("create_library <名字>")
    .alias("创建游戏库")
    .action(async ({ session }, t_name) => {
      if (!config.admin.includes(session.userId)) {
        // 无权限
        return;
      }
      if (!t_name) {
        return reply(session, ".format");
      }
      // 判断是否存在
      const [library] = await ctx.database.get("star_game_library", {
        name: t_name,
      });
      if (library) {
        return reply(session, ".hasexist", { library: t_name });
      }
      await ctx.database.upsert("star_game_library", [{ name: t_name }]);
      return reply(session, ".success", { library: t_name });
    });

  // 删除游戏库
  ctx
    .command("remove_library <库名>")
    .alias("删除游戏库")
    .action(async ({ session }, t_name) => {
      if (!config.admin.includes(session.userId)) {
        // 无权限
        return;
      }
      if (!t_name) {
        return reply(session, ".format");
      }
      // 判断是否存在
      const [library] = await ctx.database.get("star_game_library", {
        name: t_name,
      });
      if (!library) {
        return reply(session, ".notexist", { library: t_name });
      }
      await ctx.database.remove("star_game_library", { name: t_name });
      return reply(session, ".success", { library: t_name });
    });

  // 游戏库列表
  ctx
    .command("list_libraries")
    .alias("游戏库列表")
    .action(async ({ session }) => {
      const libraries = await ctx.database.get("star_game_library", {});
      if (libraries.length === 0) {
        return reply(session, ".empty");
      }
      const libraryList = libraries
        .map((library, index) => `${index + 1}. 【${library.name}】`)
        .join("\n");
      return reply(session, ".success", { libraryList });
    });

  // 查看游戏库
  ctx
    .command("view_library <库名>")
    .alias("查看游戏库")
    .action(async ({ session }, t_name) => {
      const [library] = await ctx.database.get("star_game_library", {
        name: t_name,
      });
      // 游戏库不存在
      if (!library) {
        return reply(session, ".notexist", { library: t_name });
      }
      const games = await ctx.database.get("star_game", {
        library_id: library.id,
      });
      if (games.length === 0) {
        return reply(session, ".empty", { library: t_name });
      }
      const gameList = games
        .map((games, index) => `${index + 1}. ${games.name}`)
        .join("\n");
      return reply(session, ".success", { library: t_name, gameList });
    });

  // 添加游戏
  ctx
    .command("add_game <库名> <游戏名字>")
    .alias("添加游戏")
    .action(async ({ session }, t_library, t_game) => {
      if (!config.admin.includes(session.userId)) {
        // 无权限
        return;
      }

      if (!t_library || !t_game) {
        return reply(session, ".format");
      }
      const [library] = await ctx.database.get("star_game_library", {
        name: t_library,
      });
      // 库不存在
      if (!library) {
        return reply(session, ".librarynotexist", { library: t_library });
      }
      const [existingGame] = await ctx.database.get("star_game", {
        library_id: library.id,
        name: t_game,
      });
      // 游戏已存在
      if (existingGame) {
        return reply(session, ".gameexist", {
          library: t_library,
          game: t_game,
        });
      }
      await ctx.database.upsert("star_game", [
        {
          library_id: library.id,
          name: t_game,
        },
      ]);
      return reply(session, ".success", {
        library: t_library,
        game: t_game,
      });
    });

  // 删除游戏
  ctx
    .command("remove_game <库名> <游戏名字>")
    .alias("删除游戏")
    .action(async ({ session }, t_library, t_game) => {
      if (!config.admin.includes(session.userId)) {
        // 无权限
        return;
      }
      if (!t_library || !t_game) {
        return reply(session, ".format");
      }
      const [library] = await ctx.database.get("star_game_library", {
        name: t_library,
      });
      if (!library) {
        return reply(session, ".librarynotexist", { library: t_library });
      }
      const [game] = await ctx.database.get("star_game", {
        library_id: library.id,
        name: t_game,
      });
      if (!game) {
        return reply(session, ".gameexist", {
          library: t_library,
          game: t_game,
        });
      }
      await ctx.database.remove("star_game", {
        library_id: library.id,
        name: t_game,
      });
      return reply(session, ".success", {
        library: t_library,
        game: t_game,
      });
    });
}

// 回复
export function reply(
  session: Session,
  path: string | string[],
  params?: object
) {
  const content = session.text(path, params);
  if (session.platform === "qq") {
    return "\r" + content;
  }
  if (session.subtype === "private") {
    return content;
  }
  return [h.at(session.userId), "\r" + content];
}
