Engine.initObject("SPAS", "Weapon", function() {
	var SPAS = Weapon.extend({

		constructor: function(owner) {
			this.clipCapacity = 3;
            this.base(SPAS.getClassName(), owner, owner.field);

			this.automatic = Weapon.SEMI_AUTOMATIC;
			this.roundsPerMinute = 180;
			this.projectilesPerShot = 100;
			this.timeToReload = 2000;
			this.projectileVelocityVariability = 1;
			this.dischargeDelay = 0;
			this.timeRequiredForDeadAim = 1000;
			this.ordinanceBaseSpeed = 15;
            this.hasMuzzleFlash = true;
		},

		ordinancePhysics: function() {
			return this.recoil(SPAS.BASE_SPREAD, SPAS.UNSTEADINESS).mul(this.ordinanceSpeed(this.ordinanceBaseSpeed, this.projectileVelocityVariability));
		},

		generateOrdinance: function() { return Bullet.create(this); },

	}, {
		getClassName: function() { return "SPAS"; },

		UNSTEADINESS: 30,
		BASE_SPREAD: 30,
	});

	return SPAS;
});