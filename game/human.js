Engine.include("/components/component.mover2d.js");
Engine.include("/components/component.keyboardinput.js");
Engine.include("/engine/engine.object2d.js");
Engine.include("/components/component.collider.js");
Engine.include("/engine/engine.timers.js");
Engine.include("/components/component.sprite.js");

Engine.initObject("Human", "Mover", function() {
	var Human = Mover.extend({
		field: null,

		weapon: null,
		weapons: [],
		grenadeLauncher: null,

		stateOfBeing: null,
		health: -1,
		standState: null,
     	grenadeThrower: false,
		direction: null,
		lift: null,

		constructor: function(name, field, position, health, weaponName, grenadeThrower) {
			this.base(name);
			this.field = field;
			this.health = health;
			this.grenadeThrower = grenadeThrower;
			this.stateOfBeing = Human.ALIVE;
			this.standState = Human.STANDING;
			this.loadSprites();

			this.add(Mover2DComponent.create("move"));
			this.setVelocity(Vector2D.create(0, 0));
			this.stopWalk();

			this.setupWeapons(weaponName);

			// Add components to move and draw the human
			this.add(SpriteComponent.create("draw"));
			this.add(ColliderComponent.create("collide", this.field.collisionModel));

			this.updateSprite();

			this.getComponent("move").setCheckLag(false);
			this.getComponent("move").setPosition(position);
		},

		update: function(renderContext, time) {
			this.move(time);
			renderContext.pushTransform();
			this.base(renderContext, time);
			renderContext.popTransform();

			this.weapon.handleReload(time);
			this.weapon.handleAutomatic(time);
			this.weapon.handleDischarge(time);
		},

		notifyGrenadeNearby: function(grenade) {
			var add = true;
			for(var i in this.nearbyGrenades)
				if(this.nearbyGrenades[i] == grenade)
				{
					add = false;
					break;
				}

			if(add == true)
				this.nearbyGrenades.push(grenade);
		},

		move: function(time) {
			if(this.getSprite().isSinglePlayOver(time) == true) // on a single play anim and it's over
			{
				if(this.stateOfBeing == Human.DYING)
					this.stateOfBeing = Human.DEAD;

				if(this.weapon.isShooting() == true)
					this.weapon.stopShooting();
			}

			this.updateSprite();

			this.field.applyGravity(this);
            this.handleLift();
			this.handleFriction();
			this.setPosition(this.getPosition().add(this.getVelocity()));
		},

		handleLift: function() {
			if(this.lift != null)
				this.getPosition().setY(this.lift.getStandY(this));
		},

		setOnLift: function(lift) {
			this.lift = lift;
			this.getVelocity().setY(0);
			this.jumping = false;
		},

		setNotOnLift: function() {
			this.lift = null;
		},

		canStand: function() { return this.weapon.canStand(); },

		getStandState: function() { return this.standState; },

		getMoveState: function() {
			if(this.getVelocity().x != 0)
				return Human.RUNNING;
			else
				return Human.STILL;
		},

		die: function(ordinance) {
			this.stateOfBeing = Human.DYING;
			this.setSprite(this.direction + Human.DYING + this.weapon.name);

			this.throwBackwards(ordinance);
		},

		shoot: function() {
			this.weapon.shoot();
			this.updateSprite();
		},

		throwBackwardsUp: -3,
		throwBackwardsTempering: 6,
		throwBackwards: function(bullet) {
			this.getVelocity().setX(bullet.getVelocity().x / this.throwBackwardsTempering);
			this.getPosition().setY(this.getPosition().y - 5);
			this.getVelocity().setY(this.throwBackwardsUp);
		},

		crouch: function() {
			if(!this.isCrouching())
			{
				this.standState = Human.CROUCHING;
				this.stopWalk();
			}
		},

		stand: function() {
			if(this.isCrouching())
			{
				this.standState = Human.STANDING;
				this.stopWalk();
			}
		},

		// delay on when human lowers their gun
		delayBeforeLoweringGun: 400,
		lastStoppedShooting: 0,
		getShootState: function() {
			if(this.weapon.shooting == Weapon.SHOOTING)
				return Weapon.SHOOTING;
			else
			{
				if(new Date().getTime() - this.lastStoppedShooting > this.delayBeforeLoweringGun)
					return Weapon.NOT_SHOOTING;
				else
					return Weapon.SHOOTING;
			}
		},

		stoppedShooting: function() { this.lastStoppedShooting = new Date().getTime(); },

		throwGrenade: function() { this.grenadeLauncher.shoot(); },

		cycleWeapon: function() {
			if(this.weapons.length == 0)
				return;

			for(var i = 0; i < this.weapons.length; i++)
				if(i == this.weapons.length - 1)
					this.setWeapon(this.weapons[0].name);
				else if(this.weapons[i] == this.weapon)
				{
					this.setWeapon(this.weapons[i + 1].name);
					break;
				}

			this.field.notifier.post(Weapon.SWITCH, this.weapon);

			this.updateSprite();
		},

		setWeapon: function(weaponName) {
			for(var i in this.weapons)
				if(this.weapons[i].name == weaponName)
				{
					this.weapon = this.weapons[i];
					this.weapon.setPose();
				}
		},

		jumping: false,
		jumpSpeed: -6.0,
		postJumpAdjustmentVector: Vector2D.create(0, -1),
		jump: function() {
			if(!this.jumping && !this.isCrouching())
			{
				this.jumping = true;

				var newVelocityY = this.jumpSpeed;
				if(this.lift != null)
					newVelocityY += this.lift.getVelocity().y;

				this.setNotOnLift();

				this.getVelocity().setY(newVelocityY);
				this.setPosition(this.getPosition().add(this.postJumpAdjustmentVector));
			}
		},

		turn: function(direction) { this.direction = direction; },

		walking: false,
		walk: function(direction) {
			this.setNotOnLift();
			if(!this.walking && !this.isCrouching())
			{
				this.walking = true;
				this.direction = direction;
				if(direction == Collider.LEFT)
					this.getVelocity().setX(this.getVelocity().x - Human.WALK_SPEED);
				else if(direction == Collider.RIGHT)
					this.getVelocity().setX(this.getVelocity().x + Human.WALK_SPEED);
			}
		},

		stopWalk: function(newX) {
			this.getVelocity().setX(0);
			this.walking = false;
		},

		endFall: function(groundObj) {
			this.getPosition().setY(groundObj.getPosition().y - this.getBoundingBox().dims.y);
			this.getVelocity().setY(0);
			this.jumping = false;
		},

		endRise: function(ceilingObj) {
			this.getPosition().setY(ceilingObj.getPosition().y + ceilingObj.getBoundingBox().dims.y + 2);
			if(this.getVelocity().y < 0)
				this.getVelocity().setY(0);
		},

		shot: function(ordinance) {
			if(this.isAlive())
			{
				this.field.notifier.post(Human.SHOT, this);
				this.bloodSpurt(ordinance);
				this.health -= ordinance.damage;
				if(this.health <= 0)
					this.die(ordinance);
			}
		},

		bloodSpread: 50,
		bloodParticleCount: 10,
		bloodParticleTTL: 300,
		bloodSpurt: function(projectile) {
			var positionData = this.field.collider.pointOfImpact(projectile, this);
			var position = null;
			if(positionData != null)
				var position = Point2D.create(positionData[0].x, positionData[0].y)

			if(position)
			{
				var particles = [];

				var sideHit = positionData[1];
				var reversedAngle = this.field.physics.reverseAngle(projectile, sideHit);
				for(var x = 0; x < this.bloodParticleCount; x++)
					particles[x] = BloodParticle.create(position, reversedAngle, this.bloodSpread, this.bloodParticleTTL);

				this.field.pEngine.addParticles(particles);
			}
		},

		setupWeapons: function(weaponName) {
			this.setWeapon(weaponName);
			this.grenadeLauncher = new GrenadeLauncher(this);
		},

		onCollide: function(obj) {
			if(obj instanceof Furniture && this.field.collider.objsColliding(this, obj))
			{
				if(this.field.collider.aFallingThroughB(this, obj))
					this.endFall(obj);
				else if(this.field.collider.aOnBottomAndBumpingB(this, obj))
					this.endRise(obj);
				else if(this.field.collider.aOnLeftAndBumpingB(this, obj))
					this.block(obj.getPosition().x - this.getBoundingBox().dims.x - 1);
				else if(this.field.collider.aOnRightAndBumpingB(this, obj))
					this.block(obj.getPosition().x + obj.getBoundingBox().dims.x + 1);
			}
            else if(obj instanceof Barrel && this.field.collider.objsColliding(this, obj))
            {
				if(this.field.collider.aFallingThroughB(this, obj))
					this.endFall(obj);
				else if(this.field.collider.aOnBottomAndBumpingB(this, obj)) // unlikely
					this.endRise(obj);
				else if(this.field.collider.aOnLeftAndBumpingB(this, obj))
					this.block(obj.getPosition().x - this.getBoundingBox().dims.x);
				else if(this.field.collider.aOnRightAndBumpingB(this, obj))
					this.block(obj.getPosition().x + obj.getBoundingBox().dims.x);
            }
			else if(obj instanceof Ordinance)
				this.field.notifier.post(Human.INCOMING, obj);

			return ColliderComponent.CONTINUE;
		},

		// if dead, carry on moving. A bit.
		friction: 0.1,
		handleFriction: function() {
			newX = null;
			if(!this.isAlive())
			{
				var x = this.getVelocity().x;
				if(x == 0)
					return;
				else if(x > 0)
				{
					newX = x - this.friction;
					if(newX < 0)
						newX = 0;
				}
				else // x < 0
				{
					newX = x + this.friction;
					if(newX < 0)
						newX = 0;
				}
				this.getVelocity().setX(newX);
			}
		},

		// sets sprite to reflect whatever human is doing
		updateSprite: function() {
			if(this.isAlive())
				this.setSprite(this.direction + this.getStandState() + this.getMoveState() + this.getShootState() + this.weapon.name);
			else if(this.stateOfBeing == Human.DEAD)
				this.setSprite(this.direction + Human.DEAD + this.weapon.name);
		},

		loadSprites: function() {
			for(var spriteIdentifier in this.field.spriteLoader.get("human").info.sprites)
				this.addSprite(spriteIdentifier, this.field.spriteLoader.getSprite("human", spriteIdentifier));
		},

		isAlive: function() { return this.stateOfBeing == Human.ALIVE; },
		isCrouching: function() { return this.standState == Human.CROUCHING; },

		getGunAngle: function() { return Human.COORDINATES[this.direction][this.standState][this.weapon.name]["gunAngle"]; },
		getRelativeGunTip: function() { return Human.COORDINATES[this.direction][this.standState][this.weapon.name]["gunTip"]; },
		getRelativeArmTip: function() { return Human.COORDINATES[this.direction][this.standState]["armTip"]; },
		getArmAngle: function() {
			// if(this instanceof Enemy)
				return Human.COORDINATES[this.direction]["armAngle"];
			// else
			// 	return this.crosshair.getVectorToTarget();
		},

		release: function() {
			this.base();
			this.stateOfBeing = null;
			this.health = -1;
			this.weapon = null;
			this.weapons = [];
		},

	}, {
		getClassName: function() { return "Human"; },

		WALK_SPEED: 3,

		// states of being
		ALIVE: "Alive",
		DYING: "Dying",
		DEAD: "Dead",

		// standing state
		STANDING: "Standing",
		CROUCHING: "Crouching",

		RUNNING: "Running",
		STILL: "Still",

		RELOADED: "Reloaded",
		SHOT: "shot",
		INCOMING: "incoming",
		GRENADE_NEARBY: "grenade_nearby",
		NO_NEARBY_GRENADES: "no_nearby_grenades",

		GRENADE_IMMEDIATE: true,
		GRENADE_DELAYED: false,

		COORDINATES: {
			"Left": {
				"armAngle": 330,
			 	"Standing": {
					"armTip": new Point2D(0, 2),
					"M9": 		{ "gunTip": new Point2D(07, 06), "gunAngle": 270 },
					"Mac10": 	{	"gunTip": new Point2D(07, 04), "gunAngle": 270 },
					"SPAS": 	{ "gunTip": new Point2D(07, 09), "gunAngle": 270 }
				},
				"Crouching": {
					"armTip": new Point2D(0, 2),
					"M9": 		{ "gunTip": new Point2D(07, 05), "gunAngle": 270 },
					"Mac10": 	{ "gunTip": new Point2D(07, 04), "gunAngle": 270 },
					"SPAS": 	{ "gunTip": new Point2D(07, 08), "gunAngle": 270 },
					"Mortar": { "gunTip": new Point2D(11, 08), "gunAngle": 345 }
				}
			},
			"Right": {
				"armAngle": 30,
				"Standing": {
					"armTip": new Point2D(44, 2),
					"M9": 		{ "gunTip": new Point2D(40, 06), "gunAngle": 90 },
					"Mac10": 	{ "gunTip": new Point2D(40, 04), "gunAngle": 90 },
					"SPAS":   { "gunTip": new Point2D(40, 09), "gunAngle": 90 }
				},
				"Crouching": {
					"armTip": new Point2D(44, 2),
					"M9":     { "gunTip": new Point2D(40, 05), "gunAngle": 90 },
					"Mac10":  { "gunTip": new Point2D(40, 04), "gunAngle": 90 },
					"SPAS":   { "gunTip": new Point2D(40, 08), "gunAngle": 90 },
					"Mortar": { "gunTip": new Point2D(40, 08), "gunAngle": 15 }
				}
			}
		},
	});

	return Human;
});