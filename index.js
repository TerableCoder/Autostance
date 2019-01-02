const INTERVAL = 2000;
const data = require("./data");

module.exports = function AutoStance(dispatch) {
	let moduleEnabled = false,
		buffActivated = false,
		alive = false,
		gameId = -1,
		job = -1,
		mounted = false,
		intervalRef = null,
		w = 0,
	loc = {
        "x": 0,
        "y": 0,
        "z": 0
    },
	dest = {
        "x": 0,
        "y": 0,
        "z": 0
    },
	skill = {
        "reserved": 0,
        "npc": false,
        "type": 1,
        "huntingZoneId": 0,
        "id": 110100
    };
	
	dispatch.hook("S_LOGIN", 12, (event) => {
		gameId = event.gameId;
		job = (event.templateId - 10101) % 100;
		moduleEnabled = (job == 11 && event.level == 65) ? true : false;
	});
	
	dispatch.hook("S_LOAD_TOPO", 3, (event) => {
		if (moduleEnabled) {
			loc = event.loc;
			mounted = false;
		}
	});
	
	dispatch.hook("S_SPAWN_ME", 3, (event) => {
		if (moduleEnabled) {
			loc = event.loc;
			w = event.w;
			alive = event.alive;
			tryActivateStance();
		}
	});
	
	dispatch.hook("C_PLAYER_LOCATION", 5, (event) => {
		if (moduleEnabled) {
			loc = event.loc;
			w = event.w;
		}
	});
	
	dispatch.hook("C_RETURN_TO_LOBBY", 1, (event) => {
		moduleEnabled = false;
		if (intervalRef) clearInterval(intervalRef);
	});
	
	dispatch.hook("S_MOUNT_VEHICLE", 2, (event) => {
		if (moduleEnabled)
		if (event.gameId == gameId) mounted = true;
	});
	
	dispatch.hook("S_UNMOUNT_VEHICLE", 2, (event) => {
		if (moduleEnabled)
		if (event.gameId == gameId) mounted = false;
	});
	
	dispatch.hook("S_ABNORMALITY_BEGIN", 3, (event) => {
		if (moduleEnabled)
			if (event.source == gameId)
				if (10154030 == event.id)
					buffActivated = true;
	});
	
	dispatch.hook("S_ABNORMALITY_END", 1, (event) => {
		if (moduleEnabled)
			if (event.target == gameId)
				if (10154030 == event.id)
					buffActivated = false;
	});
	
	function tryActivateStance() {
		if (intervalRef) clearInterval(intervalRef);
		
		intervalRef = setInterval(() => {
			if (!buffActivated) {
				if (mounted || !alive) return;
				
				dispatch.toServer("C_START_SKILL", 7, {
				skill: skill,
				w: w,
				loc: loc,
				dest: dest, 
				unk: true,
				moving: false,
				continue: false,
				target: 0n,
				unk2: false
				});
			} else clearInterval(intervalRef);
		}, INTERVAL);
	};
};