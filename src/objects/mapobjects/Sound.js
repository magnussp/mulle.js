'use strict'

/**
 * Play a sound the first time the car drives by (map 28)
 * @type {MulleMapObject}
 */
var MapObject = {}

MapObject.onEnterInner = function () {
  if (this.playedSound || !this.opt.Sound) return
  this.playedSound = true
  this.game.mulle.playAudio(this.opt.Sound)
}

export default MapObject
