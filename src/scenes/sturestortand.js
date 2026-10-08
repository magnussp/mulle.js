import MulleState from './base'

import MulleSprite from '../objects/sprite'
import MulleBuildCar from '../objects/buildcar'
import MulleActor from '../objects/actor'
import partUtil from '../util/partUtil'
import blinkThing from '../util/blinkThing'
import idleLoop from '../util/idleLoop'

/**
 * Sture Stortand
 * 88.DXR
 *
 * Sture is having a party but is out of lemonade. With lemonade from the factory
 * Mulle helps him, gets a part and completes mission 3.
 * Positions and timings are taken from the score of the original movie,
 * which uses member numbers one higher than the extracted cast.
 *
 * 88d001v0: Narrator
 * 88d002v0: Sture has a problem
 * 88d003v0: Mulle will try to help
 * 88d005v0: Sture thanks Mulle
 * 88d006v0: Mulle thanks for the part
 */
class StureStortandState extends MulleState {
  preload () {
    super.preload()

    this.game.load.pack('sturestortand', 'assets/sturestortand.json', null, this)
  }

  create () {
    super.create()

    this.DirResource = '88.DXR'
    this.frameTime = 1000 / 12
    this.sounds = []
    this.leaving = false

    this.game.mulle.addAudio('sturestortand')

    if (!this.game.mulle.SetWhenDone) {
      this.game.mulle.SetWhenDone = {
        Parts: [162],
        Missions: [3]
      }
    }
    const partId = this.game.mulle.SetWhenDone.Parts[0]
    const missionId = this.game.mulle.SetWhenDone.Missions[0]

    // Like the Dir script of 88.DXR
    let marker = 'CantDoIt'
    if (this.game.mulle.user.isMissionCompleted(missionId) || this.game.mulle.user.hasPart(partId)) {
      marker = 'Done'
    } else if (this.game.mulle.user.Car.hasCache('#Lemonade')) {
      marker = 'JustDoIt'
      this.game.mulle.user.addPart('yard', partId)
      this.game.mulle.user.addCompletedMission(missionId)
    }

    const background = new MulleSprite(this.game, 320, 240)
    background.setDirectorMember(this.DirResource, marker === 'CantDoIt' ? 40 : 32)
    this.game.add.existing(background)

    this.car = new MulleBuildCar(this.game, 41, 301, null, true, false)
    this.game.add.existing(this.car)

    this.mulle = this.addMulle()

    if (marker !== 'JustDoIt') {
      // Clicking skips the scene, like the mouseUp handler in the original movie
      this.game.input.onDown.addOnce(this.leave, this)
    }

    if (marker === 'Done') {
      this.playSound('88e001v0')
      this.addSture(true)
      this.playSound('88d001v0', () => this.wait(6, this.leave))
    } else if (marker === 'JustDoIt') {
      this.justDoIt(partId)
    } else {
      this.cantDoIt()
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
   * Mulle facing left, MulleSpegel with MulleAnimChart
   * @return {MulleActor}
   */
  addMulle () {
    const m = this.DirResource
    const frames = (list) => list.map(f => [m, 52 + f - 1])
    const mulle = new MulleActor(this.game, 351, 234, 'stureMulle', true)
    mulle.setDirectorMember(m, 52)
    mulle.addAnimation('idle', frames([1]), 12, false)
    mulle.addAnimation('talk', frames([26, 27, 28, 29, 30, 31, 32]), 12, true)
    mulle.addAnimation('scratch', frames([2, 3, 4, 5, 6, 5, 6, 5, 4, 3, 2, 1]), 12, false)
    mulle.addAnimation('scratchHead', frames([7, 8, 9, 10, 11, 11, 11, 11, 11, 11, 11, 11, 12, 11, 12, 11, 10, 9, 8, 7, 1]), 12, false)
    mulle.talkAnimation = 'talk'
    this.game.add.existing(mulle)
    this.game.mulle.actors.mulle = mulle
    idleLoop(this.game, mulle, {
      still: 'idle',
      min: 31,
      max: 51,
      actions: [{ animation: 'scratch', sound: '00e029v0' }, { animation: 'scratchHead', sound: '00e030v0' }]
    })
    return mulle
  }

  /**
   * Sture, happy with a full lemonade tank or sad without
   * @param {boolean} happy
   * @return {MulleActor}
   */
  addSture (happy) {
    const sture = happy
      ? new MulleActor(this.game, 289, 165, 'stureHappy')
      : new MulleActor(this.game, 285, 162, 'stureSad')
    sture.talkAnimation = 'talk'
    sture.silenceAnimation = 'idle'
    sture.addAnimation('blink', [[this.DirResource, happy ? 38 : 46]], 12, false)
    this.game.add.existing(sture)
    this.game.mulle.actors.sture = sture
    idleLoop(this.game, sture, { still: 'idle', min: 11, max: 45, actions: [{ animation: 'blink' }] })
    return sture
  }

  /**
   * A kid at the party, blinking now and then
   * @param {int} member First frame, the next member blinks
   * @param {int} x
   * @param {int} y
   */
  addKid (member, x, y) {
    const kid = new MulleSprite(this.game, x, y)
    kid.setDirectorMember(this.DirResource, member)
    kid.addAnimation('still', [[this.DirResource, member]], 12, false)
    kid.addAnimation('blink', [[this.DirResource, member + 1]], 12, false)
    this.game.add.existing(kid)
    idleLoop(this.game, kid, { still: 'still', min: 11, max: 45, actions: [{ animation: 'blink' }] })
  }

  /**
   * Sture has no lemonade and Mulle can not help yet
   */
  cantDoIt () {
    this.addKid(92, 441, 237)
    const sture = this.addSture(false)

    this.playSound('88d001v0', () => this.wait(6, () => {
      // mulle, vi har ett problem
      sture.talk('88d002v0', () => this.wait(6, () => {
        // tja, jag kan ju försöka hjälpa till
        this.mulle.talk('88d003v0', () => this.wait(6, this.leave))
      }))
    }))
  }

  /**
   * Mulle brings lemonade and gets a part
   * @param {int} partId
   */
  justDoIt (partId) {
    this.playSound('88e001v0')

    // The hose pumps lemonade, SlangAnimChart
    const hose = new MulleSprite(this.game, 304, 245)
    hose.setDirectorMember(this.DirResource, 17)
    hose.addAnimation('pump', [17, 18, 19, 20, 21, 22, 23, 24].map(m => [this.DirResource, m]), 12, true)
    hose.animations.play('pump')
    this.game.add.existing(hose)

    this.addKid(96, 443, 240)
    this.addKid(100, 537, 263)

    const part = new partUtil(this.game)
    const partSprite = part.showPart(partId, 437, 417, true)
    partSprite.y -= partSprite.height / 2
    this.game.add.existing(partSprite)

    const sture = this.addSture(true)

    this.wait(7, () => {
      // tackar tackar, mera saft och kalaset
      sture.talk('88d005v0', () => {
        new blinkThing(this.game, partSprite, () => this.wait(4, () => {
          // men så bra, den kommer nog väl till pass
          this.mulle.talk('88d006v0', () => this.wait(7, this.leave))
        }), this)
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

    this.game.mulle.actors.mulle = null
    this.game.mulle.actors.sture = null

    super.shutdown()
  }
}

export default StureStortandState
