const INTERVAL = 2000;

const data = require("./data");

module.exports = function AutoStance(dispatch) {
  let currentStamina = 0,
    moduleEnabled = false,
    buffActivated = false,
    alive = false,
    gameId = -1,
    job = -1,
    mounted = false,
    intervalRef = null,
    pos = {
      loc: null,
      w: 0
    };

  dispatch.hook("S_LOGIN", 10, (event) => {
    gameId = event.gameId;
    job = (event.templateId - 10101) % 100;
    moduleEnabled = (data[job] && event.level == 65) ? true : false;
  });

  dispatch.hook("S_LOAD_TOPO", 3, (event) => {
    if (moduleEnabled) {
      pos.loc = event.loc;
      pos.w = 0;
      mounted = false;
    }
  });

  dispatch.hook("S_SPAWN_ME", 3, (event) => {
    if (moduleEnabled) {
      pos.loc = event.loc;
      pos.w = event.w;
      alive = event.alive;
      tryActivateStance();
    }
  });

  dispatch.hook("C_PLAYER_LOCATION", 5, (event) => {
    if (moduleEnabled) {
      pos.loc = event.loc;
      pos.w = event.w;
    }
  });

  dispatch.hook("C_RETURN_TO_LOBBY", 1, (event) => {
    moduleEnabled = false;
    if (intervalRef) clearInterval(intervalRef);
  });

  dispatch.hook("S_MOUNT_VEHICLE", 2, (event) => {
    if (moduleEnabled)
      if (event.gameId.equals(gameId)) mounted = true
  });

  dispatch.hook("S_UNMOUNT_VEHICLE", 2, (event) => {
    if (moduleEnabled)
      if (event.gameId.equals(gameId)) mounted = false
  });

  dispatch.hook("S_PLAYER_CHANGE_STAMINA", 1, event => {
    if (moduleEnabled)
      currentStamina = event.current;
  });

  dispatch.hook("S_PLAYER_STAT_UPDATE", 9, (event) => {
    if (moduleEnabled)
      currentStamina = event.stamina;
  });
  dispatch.hook("S_ABNORMALITY_BEGIN", 2, (event) => {
    if (moduleEnabled)
      if (event.source.equals(gameId))
        if (data[job].abnormie == event.id)
          buffActivated = true;
  });

  dispatch.hook("S_ABNORMALITY_END", 1, (event) => {
    if (moduleEnabled)
      if (event.target.equals(gameId))
        if (data[job].abnormie == event.id)
          buffActivated = false;
  });

  function tryActivateStance() {
    if (intervalRef) clearInterval(intervalRef)

    intervalRef = setInterval(() => {
      if (!buffActivated) {

        if (data[job].needRE && currentStamina < data[job].needRE || mounted || !alive) return;

        dispatch.toServer("C_START_SKILL", 5, {
          skill: data[job].skill,
          w: pos.w,
          loc: pos.loc,
          //dest: 0, parser, your job
          unk: true,
          moving: false,
          continue: false,
          //target: 0 parser, your job
          unk2: false
        });

      } else clearInterval(intervalRef);

    }, INTERVAL);
  };
};