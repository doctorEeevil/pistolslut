Engine.initObject("Mac10", "Weapon", function() {
	var Mac10 = Weapon.extend({

		constructor: function(owner) {
			this.clipCapacity = 30;
            this.base(Mac10.getClassName(), owner, owner.field);

			this.automatic = Weapon.AUTOMATIC;
			this.roundsPerMinute = 1000;
			this.projectilesPerShot = 3;
			this.timeToReload = 2000;
			this.projectileVelocityVariability = 1;
			this.dischargeDelay = 0;
			this.timeRequiredForDeadAim = 1000;
			this.ordinanceBaseSpeed = 15;
            this.hasMuzzleFlash = true;
		},

		ordinancePhysics: function() {
			return this.recoil(Mac10.BASE_SPREAD, Mac10.UNSTEADINESS).mul(this.ordinanceSpeed(this.ordinanceBaseSpeed, this.projectileVelocityVariability));
		},

		generateOrdinance: function() { return Bullet.create(this); },

	}, {
		getClassName: function() { return "Mac10"; },

		UNSTEADINESS: 20,
		BASE_SPREAD: 4,
	});

	return Mac10;
});