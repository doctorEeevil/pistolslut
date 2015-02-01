Engine.include("/components/component.mover2d.js");
Engine.include("/components/component.keyboardinput.js");
Engine.include("/engine/engine.object2d.js");
Engine.include("/components/component.collider.js");
Engine.include("/engine/engine.timers.js");
Engine.include("/components/component.sprite.js");

Engine.initObject("Player", "Human", function() {
  var Player = Human.extend({
    identifier: null,
    keyMap: null, // the key bindings for this player

    constructor: function(field, playerData, existingPlayers, numberOfPlayers) {
      this.identifier = "player" + existingPlayers.length;
      this.turn(Collider.RIGHT);
      var startPosition = Point2D.create(playerData.startPosition.x + 20 * existingPlayers.length, playerData.startPosition.y);
      this.base("Player", field, startPosition, Player.STARTING_HEALTH, Player.AVAILABLE_WEAPONS, Player.CAN_THROW_GRENADES);

      this.keyMap = Player.KEY_MAPS[numberOfPlayers - 1][existingPlayers.length];
      this.add(KeyboardInputComponent.create("input"));
    },

    release: function() {
      this.base();
    },

    update: function(renderContext, time) {
      this.base(renderContext, time);
      if (this.isMainPlayer())
        this.field.updateFramePosition(this.getVelocity(), this); // move the render frame in response to player movement

      if (this.getVelocity().x != 0)
        this.field.notifier.post(Player.MOVE_EVENT, this);

      this.handleHealthReload(time);
    },

    handleHealthReload: function(time) {
      if (this.isAlive() && this.health != this.maxHealth)
        if (this.lastShot + Player.HEALTH_RELOAD_DELAY < new Date().getTime()) {
          if (this.isMainPlayer() && this.field.healthMeter !== null)
            this.field.healthMeter.reset();

          this.health = this.maxHealth;
        }
    },

    isMainPlayer: function() {
      return this == Player.getMainPlayer(this.field);
    },

    lastShot: 0,
    shot: function(ordinance) {
      if (this.isAlive())
        if (this.isMainPlayer() && this.field.healthMeter !== null)
          this.field.healthMeter.decrement();

      this.base(ordinance);
      if (this.isAlive())
        this.lastShot = new Date().getTime();
    },

    // if walking when pressed crouch, have now stood up
    // and want to resume walk.  A workaround for weird keyboard handling.
    resumeWalk: function() {
      if (this.walkPaused == true) {
        this.walk(this.direction);
        this.walkPaused = false;
      }
    },

    // if walking when pressed crouch, save direction of walk
    // for future resumption.  A workaround for weird keyboard handling.
    walkPaused: false,
    handlePausedWalk: function() {
      if (this.walking)
        this.walkPaused = true;
      this.stopWalk();
    },

    onKeyDown: function(keyCode) {
      if (!this.isAlive())
        return;

      switch (keyCode) {
        case this.keyMap["left"]:
          this.walk(Collider.LEFT);
          break;
        case this.keyMap["right"]:
          this.walk(Collider.RIGHT);
          break;
        case this.keyMap["jump"]:
          this.jump();
          break;
        case this.keyMap["crouch"]:
          this.handlePausedWalk();
          this.crouch();
          break;
        case this.keyMap["shoot"]:
          // deal with an initial shot on semi-automatic
          if (!this.weapon.isShooting()) // got to block delayed keyboard auto-repeat
            this.shoot();

          this.weapon.shootKeyDown();
          break;
        case this.keyMap["grenade"]:
          this.grenadeLauncher.startAim();
          break;
        case this.keyMap["cycle_weapon"]:
          this.cycleWeapon();
          break;
      }

      return false;
    },

    onKeyUp: function(keyCode) {
      if (!this.isAlive())
        return;

      switch (keyCode) {
        case this.keyMap["left"]:
        case this.keyMap["right"]:
          this.stopWalk();
          this.walkPaused = false; // stopped walking so walk no longer paused
          break;
        case this.keyMap["shoot"]:
          this.weapon.shootKeyUp();
          break;
        case this.keyMap["crouch"]:
          this.stand();
          // allowed to start walking now, but must
          // work around lack of keyboard repeat support in engine for this case
          this.resumeWalk();
          break;
        case this.keyMap["grenade"]:
          if (this.grenadeLauncher.isAiming())
            this.throwGrenade();
          break;
      }

      return false;
    },
  }, {
    getClassName: function() {
      return "Player";
    },

    addPlayer: function(field, playerData, numberOfPlayers) {
      var player = Player.create(field, playerData, field.players, numberOfPlayers);
      field.players.push(player);
      field.renderContext.add(player);
    },

    getPlayer: function(field, identifier) {
      for (var i in field.players)
        if (field.players[i].identifier == identifier)
          return field.players[i];

      return null;
    },

    getMainPlayer: function(field) {
      return field.players[0];
    },

    isPlayerAlive: function(field) {
      if (field.players.length == 0)
        return false;

      for (var i in field.players)
        if (field.players[i].isAlive() === true)
          return true;

      return false;
    },

    STARTING_HEALTH: 7,
    CAN_THROW_GRENADES: true,

    HEALTH_RELOAD_DELAY: 5000,
    HEALTH_RELOAD: "health_reload",

    MOVE_EVENT: "playerMove",

    AVAILABLE_WEAPONS: ["M9", "Mac10", "SPAS"],

    KEY_MAPS: [
      [ // ONE PLAYER MODE
       { // player 1
          "left": 37, // left
          "right": 39, // right
          "jump": 38, // up
          "crouch": 40, // down
          "shoot": 49, // z
          "cycle_weapon": 50, // x
          "grenade": 51, // c
        }
      ],
      [ // TWO PLAYER MODE
        { // player 1
          "left": 68,         // d
          "right":71,         // g
          "jump": 82,         // r
          "crouch": 70,       // f
          "shoot": 49,        // 1
          "cycle_weapon": 50, // 2
          "grenade": 51,      // 3
        },
        { // player 2
          "left": 37,         // left
          "right": 39,        // right
          "jump": 38,         // up
          "crouch": 40,       // down
          "shoot": 73,        // i
          "cycle_weapon": 79, // o
          "grenade": 80,      // p
        }
      ], 
    ],
  });

  return Player;
});
