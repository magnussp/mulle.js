import MulleState from './base'

import MulleSprite from '../objects/sprite'
import MulleBuildCar from '../objects/buildcar'
import MulleActor from '../objects/actor'
import idleLoop from '../util/idleLoop'

/**
 * Lemonade factory
 * 87.DXR
 *
 * The neighbour has run out of lemonade for the party. With a tank (part 172) on the
 * car Mulle can take lemonade to Sture Stortand, which is mission 3.
 * Positions and timings are taken from the score of the original movie.
 *
 * 87d001v0: Narrator, only when the car has no tank
 * 87d002v0: The neighbour has run out of lemonade
 * 87d003v0: Mulle can not help
 * 87d004v0: Mulle has a tank
 * 87d005v0: Drive straight ahead
 * 87d006v0: Mulle understands
 * 87d007v0: Revisit, the factory is closed
 */
class SaftfabrikState extends MulleState {
  preload () {
    super.preload()

    this.game.load.pack('saftfabrik', 'assets/saftfabrik.json', null, this)
  }

  create () {
    super.create()

    this.DirResource = '87.DXR'
    this.frameTime = 1000 / 12
    this.sounds = []
    this.leaving = false

    this.game.mulle.addAudio('saftfabrik')

    const background = new MulleSprite(this.game, 320, 240)
    background.setDirectorMember(this.DirResource, 208)
    this.game.add.existing(background)

    this.playSound('02e010v0')

    // Like the Dir script of 87.DXR, the lemonade is already fixed
    if (this.game.mulle.user.Car.hasCache('#Lemonade') || this.game.mulle.user.isMissionCompleted(3)) {
      this.done()
      return
    }

    const hasTank = this.game.mulle.user.Car.hasPart(172)
    if (hasTank) {
      this.game.mulle.user.Car.addCache('#Lemonade')
    } else {
      // Clicking skips the scene, like the mouseUp handler in the original movie
      this.game.input.onDown.addOnce(this.leave, this)
    }

    this.car = new MulleBuildCar(this.game, 217, 335, null, true, false)
    this.game.add.existing(this.car)

    const mulle = new MulleActor(this.game, 496, 332, 'mulleDefault')
    mulle.talkAnimation = 'talkRegular'
    mulle.silenceAnimation = 'idle'
    this.game.add.existing(mulle)
    this.game.mulle.actors.mulle = mulle
    this.mulle = mulle
    idleLoop(this.game, mulle, {
      still: 'idle',
      min: 31,
      max: 51,
      actions: [{ animation: 'scratchChin', sound: '00e029v0' }, { animation: 'scratchHead', sound: '00e030v0' }]
    })

    const garson = new MulleActor(this.game, 537, 218, 'garson')
    garson.talkAnimation = 'talk'
    garson.silenceAnimation = 'idle'
    garson.addAnimation('blink', [[this.DirResource, 18]], 12, false)
    this.game.add.existing(garson)
    this.game.mulle.actors.garson = garson
    idleLoop(this.game, garson, { still: 'idle', min: 11, max: 45, actions: [{ animation: 'blink' }] })

    const ask = () => garson.talk('87d002v0', () => {
      this.wait(8, () => {
        if (hasTank) {
          // jomenvisst
          mulle.talk('87d004v0', () => this.pump(garson, mulle))
        } else {
          // nja
          mulle.talk('87d003v0', () => this.wait(12, this.leave))
        }
      })
    })

    if (hasTank) {
      ask()
    } else {
      // The narrator tells about the lemonade factory first
      this.playSound('87d001v0', ask)
    }
  }

  /**
   * Run a callback after a number of score frames
   * @param {int} frames
   * @param {function} callback
   */
  wait (frames, callback) {
    this.game.time.events.add(frames * this.frameTime, callback, this)
  }

  playSound (id, onStop = null) {
    const sound = this.game.mulle.playAudio(id, onStop)
    if (sound) this.sounds.push(sound)
    return sound
  }

  /**
   * The lemonade is pumped into the tank
   * @param {MulleActor} garson
   * @param {MulleActor} mulle
   */
  pump (garson, mulle) {
    const splash = new MulleSprite(this.game, 320, 241)
    splash.setDirectorMember(this.DirResource, 26)
    this.game.add.existing(splash)

    // SaftAnimChart
    splash.addAnimation('saft', [26, 27, 28, 29].map(m => [this.DirResource, m]), 12, true)
    splash.animations.play('saft')

    this.playSound('87e001v0', () => {
      splash.destroy()

      // nu kör du bara rakt fram
      garson.talk('87d005v0', () => {
        // uppfattat
        mulle.talk('87d006v0', () => this.wait(12, this.leave))
      })
    })
  }

  /**
   * Mulle has already got the lemonade and comments from the car
   */
  done () {
    this.car = new MulleBuildCar(this.game, 217, 335, null, true, true)
    this.game.add.existing(this.car)

    // Clicking skips the scene, like the mouseUp handler in the original movie
    this.game.input.onDown.addOnce(this.leave, this)

    this.wait(14, () => {
      this.car.mulleSit.talk('87d007v0', () => {
        this.car.mulleSit.animations.play('wave')
        this.wait(14, this.leave)
      })
    })
  }

  leave () {
    if (this.leaving) return
    this.leaving = true
    this.game.state.start('world')
  }

  shutdown () {
    for (const sound of this.sounds) sound.stop()
    if (this.mulle) this.mulle.resetTalk()
    if (this.car && this.car.mulleSit) this.car.mulleSit.resetTalk()

    this.game.mulle.actors.mulle = null
    this.game.mulle.actors.garson = null

    super.shutdown()
  }
}

export default SaftfabrikState
