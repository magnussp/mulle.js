import MulleState from './base'
import MulleBuffa from '../objects/buffa'
import MulleSprite from '../objects/sprite'
import MulleBuildCar from '../objects/buildcar'
import DirectorHelper from '../objects/DirectorHelper'
import partUtil from '../util/partUtil'
import blinkThing from '../util/blinkThing'

/**
 * Destination where visiting completes a mission and the first visit gives a part.
 * Doris Digital (90.DXR), Viola (89.DXR) and Ludde Labb (91.DXR) share the same
 * Dir script and score layout in the original game, the subclasses only give the
 * positions and sounds from their scores.
 *
 * - "JustDoIt": the part lies on the ground and Buffa waits while the host talks,
 *   then the part blinks and Mulle takes it.
 * - "Done": Mulle already has the part and comments from the car, a click leaves.
 */
class GiftSceneState extends MulleState {
  /**
   * Scene configuration, positions are taken from the score of the movie
   * @return {{
   *   dirResource: string, pack: string, missionId: int, partId: int,
   *   car: int[], part: int[], buffa: int[],
   *   sounds: {background: string, done: string, gift: string[]},
   *   framesAfterBlink: int,
   *   decoration: ({x: int, y: int, frames: (int|null)[], firstGiftOnly: boolean}|undefined)
   * }}
   */
  get config () {
    throw new Error('GiftSceneState.config must be implemented')
  }

  preload () {
    super.preload()

    this.game.load.pack(this.config.pack, 'assets/' + this.config.pack + '.json', null, this)
  }

  create () {
    super.create()

    this.DirResource = this.config.dirResource
    this.frameTime = 1000 / 12

    this.game.mulle.addAudio(this.config.pack)
    this.sounds = []
    this.car = null
    this.leaving = false

    if (!this.game.mulle.SetWhenDone) {
      this.game.mulle.SetWhenDone = {
        Parts: [this.config.partId],
        Missions: [this.config.missionId]
      }
    }

    this.game.mulle.user.addCompletedMission(this.game.mulle.SetWhenDone.Missions[0])

    this.game.add.existing(DirectorHelper.sprite(this.game, 320, 240, this.DirResource, 1))

    const part = new partUtil(this.game)
    const partId = part.getPart()
    if (partId) {
      this.justDoIt(part, partId)
    } else {
      this.done()
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
   * Play speech and show subtitles if there are any
   * @param {string} id
   * @param {function} onStop
   */
  say (id, onStop) {
    const subtitles = this.game.mulle.subtitle.getData(id)
    if (subtitles) {
      subtitles.lines.forEach((line, i) => {
        this.game.time.events.add(i * 2000, () => this.game.mulle.subtitle.showLine(line, subtitles.actor))
      })
    }
    return this.playSound(id, onStop)
  }

  addCar (hasDriver) {
    this.car = new MulleBuildCar(this.game, this.config.car[0], this.config.car[1], null, true, hasDriver)
    this.game.add.existing(this.car)
  }

  /**
   * Mulle has already got the part and only comments from the car
   */
  done () {
    this.addCar(true)
    this.playSound(this.config.sounds.background)

    // Clicking skips the scene, like the mouseUp handler in the original movie
    this.game.input.onDown.addOnce(this.leave, this)

    this.car.mulleSit.talk(this.config.sounds.done, () => this.wait(14, this.leave))
  }

  /**
   * Mulle gets a part
   * @param {partUtil} part
   * @param {int} partId
   */
  justDoIt (part, partId) {
    console.log('given part', partId)
    this.game.mulle.user.addPart('yard', partId)

    const partSprite = part.showPart(partId, this.config.part[0], this.config.part[1], true)
    partSprite.y -= partSprite.height / 2
    this.game.add.existing(partSprite)

    const decoration = this.addDecoration()
    // Buffa waits, shrugs now and then and sometimes barks
    this.game.add.existing(new MulleBuffa(this.game, this.config.buffa[0], this.config.buffa[1]))
    this.addCar(false)
    this.playSound(this.config.sounds.background)

    const [first, second] = this.config.sounds.gift
    this.say(first, () => {
      if (decoration && this.config.decoration.firstGiftOnly) decoration.destroy()
      this.say(second, () => {
        new blinkThing(this.game, partSprite, () => this.wait(this.config.framesAfterBlink, this.leave), this)
      })
    })
  }

  /**
   * Animated decoration, like the fire at Viola or the computer at Doris
   * @return {MulleSprite|null}
   */
  addDecoration () {
    const decoration = this.config.decoration
    if (!decoration) return null

    const sprite = new MulleSprite(this.game, decoration.x, decoration.y)
    this.game.add.existing(sprite)
    let i = 0
    const step = () => {
      const member = decoration.frames[i++ % decoration.frames.length]
      sprite.visible = member !== null
      if (member !== null) sprite.setDirectorMember(this.DirResource, member)
    }
    step()
    const timer = this.game.time.events.loop(this.frameTime, step)
    sprite.events.onDestroy.addOnce(() => this.game.time.events.remove(timer))
    return sprite
  }

  leave () {
    if (this.leaving) return
    this.leaving = true
    this.game.state.start('world')
  }

  shutdown () {
    super.shutdown()

    for (const sound of this.sounds) {
      sound.stop()
    }
    if (this.car && this.car.mulleSit) this.car.mulleSit.resetTalk()
  }
}

export default GiftSceneState
