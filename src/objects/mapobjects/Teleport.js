'use strict'

/**
 * Teleport the car to another map when it drives past a border inside the object.
 * Not placed on any map in the original world, ported from ObjectTeleportScript
 * @type {MulleMapObject}
 */
var MapObject = {}

/**
 * Get optional data with case insensitive name, Lingo symbols are case insensitive
 * @param {string} name
 */
function getOption (opt, name) {
  for (const key in opt) {
    if (key.toLowerCase() === name.toLowerCase()) return opt[key]
  }
}

function toPoint (value) {
  if (Array.isArray(value)) return new Phaser.Point(value[0], value[1])
  return new Phaser.Point(value.x, value.y)
}

MapObject.onCreate = function () {
  const extra = 25
  const borders = {
    1: { vertical: false, downRight: true, border: 636 - extra },
    2: { vertical: true, downRight: true, border: 400 - extra },
    3: { vertical: false, downRight: false, border: 4 + extra },
    4: { vertical: true, downRight: false, border: 4 + extra }
  }
  this.teleportBorder = borders[getOption(this.opt, 'whichBorder')]
  this.toWorld = getOption(this.opt, 'toWorld')
  this.toMap = getOption(this.opt, 'toMap')
  this.toLoc = getOption(this.opt, 'toLoc')
}

MapObject.update = function () {
  if (!this.enteredInner || !this.teleportBorder) return

  const car = this.game.state.getCurrentState().driveCar
  const { vertical, downRight, border } = this.teleportBorder
  const pos = vertical ? car.position.y : car.position.x
  if (downRight ? pos > border : pos < border) {
    this.enteredInner = false
    this.game.state.getCurrentState().teleport(this.toWorld, toPoint(this.toMap), toPoint(this.toLoc))
  }
}

export default MapObject
