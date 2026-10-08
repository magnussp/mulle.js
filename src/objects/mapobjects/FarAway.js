'use strict'

// noinspection JSValidateTypes
/**
 * Far away (map 19), gives a medal for driving far from home
 * @type {MulleMapObject}
 */
var MapObject = {}

MapObject.onEnterOuter = function () {
  this.game.state.getCurrentState().awardMedal(this.def.SetWhenDone.Medals[0])
}

export default MapObject
