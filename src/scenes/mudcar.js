import MulleState from './base'
import DirectorHelper from '../objects/DirectorHelper'
import MulleSprite from '../objects/sprite'
import MulleBuffa from '../objects/buffa'
import directorAnimation from '../util/directorAnimation'
import movingAnimation from '../util/movingAnimation'
import partUtil from '../util/partUtil'
import blinkThing from '../util/blinkThing'
import MulleActor from '../objects/actor'

/**
 * Car stuck in mud
 * 82.DXR
 *
 * A strong car (strength over 4) pulls the stuck car out of the mud and Mulle finds a part.
 * Positions and timings are taken from the score of the original movie.
 */
class MudCarState extends MulleState {
  preload () {
    super.preload()

    this.game.load.pack('mudcar', 'assets/mudcar.json', null, this)
    this.dirResource = '82.DXR'
    this.game.load.json('JustDoIt_car', 'data/score/82.DXR_JustDoIt_4.json')
    this.game.load.json('JustDoIt_rope', 'data/score/82.DXR_JustDoIt_5.json')
    this.game.load.json('MudcarAnimations', 'data/82.DXR-animations.json')
  }

  create () {
    super.create()
    this.game.mulle.addAudio('mudcar')
    this.frameTime = 1000 / 12
    this.sounds = []
    this.leaving = false
    this.partSprite = null
    this.mulle = null

    if (!this.game.mulle.SetWhenDone) {
      this.game.mulle.SetWhenDone = {
        Cache: ['#MudCar', '#RescuedMudCar'],
        Parts: ['#Random']
      }
    }

    // Like init in the Dir script of 82.DXR, the reward is given at once
    this.game.mulle.user.Car.addCache(this.game.mulle.SetWhenDone.Cache[0])
    const strength = this.game.mulle.user.Car.getProperty('strength')
    console.log('Car strength is', strength)
    this.strong = strength > 4
    if (this.strong) {
      this.game.mulle.user.Car.addCache(this.game.mulle.SetWhenDone.Cache[1])
    }

    // Clicking skips the scene, like the mouseUp handler in the original movie
    this.game.input.onDown.addOnce(this.exit, this)

    this.background_layer = this.game.add.group()
    this.car_layer = this.game.add.group()

    const background = DirectorHelper.sprite(this.game, 320, 240, this.dirResource, 1)
    this.background_layer.add(background)

    this.animations = this.game.cache.getJSON('MudcarAnimations')

    if (this.strong) this.addPart()

    this.stuckCar = DirectorHelper.sprite(this.game, 389, 279, this.dirResource, 43)
    this.car_layer.add(this.stuckCar)

    this.rope = DirectorHelper.sprite(this.game, 323, 248, this.dirResource, 34)
    this.car_layer.add(this.rope)

    this.moose()
    this.driverAnimation()
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
   * The driver sighs and then calls for help on the phone
   */
  driverAnimation () {
    const driverHead = DirectorHelper.sprite(this.game, 412, 216, this.dirResource, 26)
    this.car_layer.add(driverHead)
    this.driverHead = driverHead

    const charts = this.animations
    const suck = directorAnimation.addAnimation(driverHead, 'suck', charts.TittAnimChart.Actions.suck, 26, false)
    directorAnimation.addAnimation(driverHead, 'suckLoop', charts.TittAnimChart.Actions.suck, 26, true)
    directorAnimation.addAnimation(driverHead, 'help', charts.HelpAnimChart.Actions.help, 26, true)

    suck.onComplete.addOnce(() => {
      driverHead.animations.play('help')
      // Help! i'm stuck in the mud
      this.playSound('82d009v0', () => {
        if (this.strong) {
          driverHead.destroy()
          this.strongCar()
        } else {
          // The driver keeps sighing while the car fails
          driverHead.animations.play('suckLoop')
          this.weakCar()
        }
      })
    })
    driverHead.animations.play('suck')
  }

  addPart () {
    const part = new partUtil(this.game)
    this.partId = part.getPart()
    console.log('given part', this.partId)
    if (!this.partId) {
      return
    }
    this.game.mulle.user.addPart('yard', this.partId)
    this.partSprite = part.showPart(this.partId, 412, 326, true)
    this.partSprite.y -= this.partSprite.height / 2
    this.background_layer.add(this.partSprite)
  }

  /**
   * Buffa walks in from the left and sits down, then waits
   * @param {int} x Start location
   * @param {int} y
   * @param {int} dx Distance to walk
   * @param {int} steps Number of steps
   * @param {Phaser.Point} waitLoc Location of the waiting Buffa
   * @param {function} onEnd
   */
  buffaEnter (x, y, dx, steps, waitLoc, onEnd) {
    // SittAnimChart, the first frame is shown again at the end
    const frames = [50, 51, 52, 53, 54, 55, 56, 50]
    const buffa = new MulleSprite(this.game, x, y)
    buffa.setDirectorMember(this.dirResource, frames[0])
    this.game.add.existing(buffa)

    let i = 0
    this.game.time.events.repeat(this.frameTime, frames.length, () => {
      buffa.setDirectorMember(this.dirResource, frames[i])
      buffa.x = x + Math.round(dx * Math.min(i + 1, steps) / steps)
      i++
      if (i === frames.length) {
        buffa.destroy()
        this.game.add.existing(new MulleBuffa(this.game, waitLoc.x, waitLoc.y))
        onEnd.call(this)
      }
    })
  }

  addMulle (x, y) {
    const mulle = new MulleActor(this.game, x, y, 'mulleDefault')
    mulle.talkAnimation = 'talkRegular'
    mulle.silenceAnimation = 'idle'
    this.game.add.existing(mulle)
    this.mulle = mulle
    return mulle
  }

  strongCar () {
    const ropeSound = this.playSound('82e002v0')

    const strongFrames = this.animations.StrongCarAnimChart.Actions.strong
    const strongAnimation = directorAnimation.addAnimation(this.rope, 'strong', strongFrames, 34)
    strongAnimation.onComplete.add(this.pullCar, this)
    this.rope.animations.play('strong', 12)

    // Buffa arrives at frame 110 of the score, when the sound sprite ends
    this.wait(110 - 25, () => {
      if (ropeSound) ropeSound.stop()
      this.buffaEnter(-16, 239, 40, 5, new Phaser.Point(218, 244), this.findPart)
    })
  }

  pullCar () {
    this.stuckCar.destroy()
    this.rope.destroy()

    const JustDoIt = this.game.cache.getJSON('JustDoIt_car')
    const JustDoItAnimation = new movingAnimation(this.game, this.dirResource, JustDoIt)
    this.game.add.existing(JustDoItAnimation.sprite)
    JustDoItAnimation.play()

    const JustDoItRope = this.game.cache.getJSON('JustDoIt_rope')
    const JustDoItRopeAnimation = new movingAnimation(this.game, this.dirResource, JustDoItRope)
    this.game.add.existing(JustDoItRopeAnimation.sprite)
    JustDoItRopeAnimation.play()
  }

  /**
   * Mulle discovers the part
   */
  findPart () {
    const mulle = this.addMulle(15, 254)
    mulle.talk('82d006v0', () => {
      if (this.partSprite) {
        new blinkThing(this.game, this.partSprite, this.exit, this)
      } else {
        this.exit()
      }
    })
  }

  weakCar () {
    const weakFrames = this.animations.WeakCarAnimChart.Actions.Svag
    directorAnimation.addAnimation(this.rope, 'weak', weakFrames, 34, true)

    console.log('Engine too weak')
    this.rope.animations.play('weak', 12, true)
    this.playSound('82e001v0', () => {
      this.rope.animations.stop('weak', true)
      this.buffaEnter(-37, 218, 60, 7, new Phaser.Point(223, 225), () => {
        // Mulle says the car is too weak
        this.addMulle(29, 256).talk('82d003v0', () => this.wait(14, this.exit))
      })
    })
  }

  moose () {
    const mooseFrames = this.animations.MooseAnimChart.Actions.Blink
    const mooseSprite = DirectorHelper.sprite(this.game, 87, 155, this.dirResource, 18)
    this.game.add.existing(mooseSprite)
    directorAnimation.addAnimation(mooseSprite, 'blink', mooseFrames, 18, true)
    mooseSprite.animations.play('blink', 12, true)
  }

  exit () {
    if (this.leaving) return
    this.leaving = true
    this.game.state.start('world')
  }

  shutdown () {
    for (const sound of this.sounds) sound.stop()
    if (this.mulle) this.mulle.resetTalk()

    super.shutdown()
  }
}

export default MudCarState
