'use strict'

// noinspection JSValidateTypes
/**
 * Automatic bridge (map 27)
 * The bridge goes up and down, the car can only pass while it is down.
 * Ported from ObjectCBridgeScript
 * @type {MulleMapObject}
 */
var MapObject = {}

MapObject.onCreate = function () {
  this.bridgeFrames = this.animationHelper.getFrames('normal')
  this.bridgeCounter = 1
  this.bridgeOpening = 1
  this.bridgeWait = 0
  this.bridgeTime = 0
  this.setDirectorMember(this.bridgeFrames[0])
}

/**
 * One frame of the original movie
 */
MapObject.bridgeStep = function () {
  if (this.bridgeWait) {
    this.bridgeWait--
    return
  }

  this.bridgeCounter += this.bridgeOpening
  if (this.bridgeCounter === 0) {
    // The bridge is down
    if (this.enteredOuter) this.game.mulle.playAudio(this.def.Sounds[0])
    this.bridgeWait = 17
    this.bridgeCounter = 1
    this.bridgeOpening = 1
  } else if (this.bridgeCounter === this.bridgeFrames.length) {
    // The bridge is up
    this.bridgeWait = 10
    this.bridgeOpening = -1
  }
  this.setDirectorMember(this.bridgeFrames[this.bridgeCounter - 1])
}

MapObject.update = function () {
  this.bridgeTime += this.game.time.elapsed
  while (this.bridgeTime >= 1000 / 12) {
    this.bridgeTime -= 1000 / 12
    this.bridgeStep()
  }

  // The car can only pass while the bridge is waiting down
  const passable = this.bridgeWait && this.bridgeOpening === 1
  if (this.enteredInner && !passable && this.savedCar) {
    const car = this.game.state.getCurrentState().driveCar
    car.position.copyFrom(this.savedCar.position)
    car.direction = this.savedCar.direction
    car.speed = 0
  }
}

MapObject.onEnterInner = function (car) {
  this.savedCar = { position: car.position.clone(), direction: car.direction }
}

MapObject.onExitInner = function () {
  this.savedCar = null
}

export default MapObject
