const INTERVAL = 2000

const JOB_WARRIOR = 0
const JOB_ARCHER  = 5

const SNIPERS_EYE = [ 601133, 67319064 ] // [0] = Skill ID, [1] = Abrnomality ID
const ASSAULT_STANCE = [ 100150, 67189264, 10154030, 0x4000000 + 110100 ] // [0] = Skill ID, [1] = Abrnomality ID

module.exports = function AutoStance(dispatch) {
  let re = null,
      on = false,
      cid = null,
      job = null,
      skill = null,
      model = null,
      mounted = false,
      interval = null,
      location = null

  dispatch.hook('C_PLAYER_LOCATION', 1, (event) => { location = event })
  dispatch.hook('S_MOUNT_VEHICLE', 1, (event) => { if (event.target.equals(cid)) mounted = true })
  dispatch.hook('S_UNMOUNT_VEHICLE', 1, (event) => { if (event.target.equals(cid)) mounted = false })

  dispatch.hook('S_LOGIN', 2, (event) => {
    ({cid, model} = event)
    job = (model - 10101) % 100
    skill = (job == JOB_ARCHER) ? SNIPERS_EYE[1] : ((job == 11) ? ASSAULT_STANCE[3] : ASSAULT_STANCE[1])
  })

  dispatch.hook('S_PLAYER_CHANGE_STAMINA', 1, (event) => {
    if (job !== JOB_WARRIOR) return
    re = event.current
  })

  dispatch.hook('S_ABNORMALITY_BEGIN', 2, (event) => {
    if (event.source.equals(cid)) {
      if (ASSAULT_STANCE.includes(event.id) || SNIPERS_EYE.includes(event.id)) on = true
    }
  })

  dispatch.hook('S_ABNORMALITY_END', 1, (event) => {
    if (event.target.equals(cid)) {
      if (ASSAULT_STANCE.includes(event.id) || SNIPERS_EYE.includes(event.id)) {
        on = false
        tryActivateStance()
      }
    }
  })

  function tryActivateStance() {
    if (interval) clearInterval(interval)

    interval = setInterval(() => {
      if (!on) {
        if (job == JOB_WARRIOR && re <= 1000 || mounted) return
        dispatch.toServer('C_START_SKILL', 2, {
          skill: skill,
          w: location.w,
          x1: location.x1,
          y1: location.y1,
          z1: location.z1,
          x2: location.x2,
          y2: location.y2,
          z2: location.z2,
          unk1: 0,
          movementkey: 0,
          unk3: 0,
          target: cid
        })
      } else clearInterval(interval)
    }, INTERVAL)
  }
}
