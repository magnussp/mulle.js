'use strict'

/**
 * Weak bridge (map 8)
 * A heavy car breaks the bridge and falls into the water, a light car gets a medal.
 * Ported from ObjectWBridgeScript
 * @type {{MapObject}}
 */
const MapObject = {}

/**
 * Repeat every other frame seven times, like doubleFrames in the original script
 * @param {string[]} frames
 * @return {string[]}
 */
function doubleFrames (frames) {
  const out = []
  frames.forEach((frame, i) => {
    out.push(frame)
    if (i % 2 === 0) {
      for (let n = 0; n < 6; n++) out.push(frame)
    }
  })
  return out
}

MapObject.onCreate = function () {
  this.animationHelper.static('normal', this.opt.Direction)
  this.bridgeExists = true
}

MapObject.onEnterOuter = function (car) {
  this.savedCar = { position: car.position.clone(), direction: car.direction }

  if (!this.bridgeExists) {
    car.speed = 0
    car.stepback(2)
  }
}

MapObject.onEnterInner = function (car) {
  if (!this.bridgeExists) return

  const weight = this.game.mulle.user.Car.getProperty('weight')
  if (weight < 20) {
    this.game.state.getCurrentState().awardMedal(6)
    return
  }

  console.log('Car too heavy, bridge broken', weight)
  this.bridgeExists = false
  car.enabled = false
  car.speed = 0
  if (car.engineAudio) car.engineAudio.stop()
  this.game.mulle.playAudio(this.def.Sounds[0])

  const frames = doubleFrames(this.animationHelper.getFrames('Splash', this.opt.Direction))
  let counter = 0
  this.game.time.events.repeat(1000 / 12, frames.length, () => {
    if (!this.alive) return

    const frame = frames[counter]
    if (frame === 'Dummy') {
      this.visible = false
    } else {
      this.setDirectorMember(frame)
    }

    counter++
    // The car disappears into the water
    if (counter === 9) car.visible = false

    if (counter === frames.length) {
      this.visible = false
      this.game.mulle.playAudio(this.def.Sounds[1])
      if (this.savedCar) {
        car.position.copyFrom(this.savedCar.position)
        car.direction = this.savedCar.direction
      }
      car.visible = true
      car.enabled = true
    }
  })
}

export default MapObject
