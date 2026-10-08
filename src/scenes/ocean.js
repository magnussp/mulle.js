import MulleState from './base'
import MulleSprite from '../objects/sprite'
import MulleBuildCar from '../objects/buildcar'
import DirectorHelper from '../objects/DirectorHelper'
import partUtil from '../util/partUtil'
import blinkThing from '../util/blinkThing'

/**
 * The sea
 * 93.DXR
 *
 * The first visit gives Mulle a part, later visits only play a comment.
 * Positions and timings are taken from the score of the original movie.
 */
class OceanState extends MulleState {
  preload () {
    super.preload()

    this.game.load.pack('ocean', 'assets/ocean.json', null, this)
    this.game.load.json('OceanAnimations', 'assets/ocean-animations.json')
  }

  create () {
    super.create()

    this.DirResource = '93.DXR'

    this.game.mulle.addAudio('ocean')
    this.sounds = []
    this.leaving = false

    if (!this.game.mulle.SetWhenDone) {
      this.game.mulle.SetWhenDone = {
        Parts: [54]
      }
    }

    this.game.add.existing(DirectorHelper.sprite(this.game, 320, 240, this.DirResource, 1))
    this.addFish()

    const part = new partUtil(this.game)
    const partId = part.getPart()

    const partSprite = partId ? this.addPart(part, partId) : null

    this.game.add.existing(new MulleBuildCar(this.game, 376, 360, null, true, false))
    this.playSound('93e001v0')

    if (partSprite) {
      this.justDoIt(partSprite)
    } else {
      this.done()
    }
  }

  /**
   * A fish glittering in the water
   */
  addFish () {
    const fish = new MulleSprite(this.game, 221, 212)
    fish.setDirectorMember(this.DirResource, 18)
    const frames = this.game.cache.getJSON('OceanAnimations').FishAnimChart.Blink
    fish.addAnimation('blink', frames.map(frame => [this.DirResource, 18 + frame - 1]), 12, true)
    fish.animations.play('blink')
    this.game.add.existing(fish)
  }

  /**
   * @param {partUtil} part
   * @param {int} partId
   * @return {MulleCarPart}
   */
  addPart (part, partId) {
    console.log('given part', partId)
    this.game.mulle.user.addPart('yard', partId)

    const partSprite = part.showPart(partId, 14, 469, true)
    partSprite.y -= partSprite.height / 2
    this.game.add.existing(partSprite)
    return partSprite
  }

  playSound (id, onStop = null) {
    const sound = this.game.mulle.playAudio(id, onStop)
    if (sound) this.sounds.push(sound)
    return sound
  }

  /**
   * Mulle has already got the part
   */
  done () {
    this.game.time.events.add(3 * Phaser.Timer.SECOND, () => {
      this.playSound('93d001v0', () => {
        this.game.time.events.add(Phaser.Timer.SECOND, this.leave, this)
      })
    })
  }

  /**
   * Mulle finds a part
   * @param {MulleCarPart} partSprite
   */
  justDoIt (partSprite) {
    this.playSound('93d001v0', () => {
      this.game.time.events.add(Phaser.Timer.SECOND, () => {
        new blinkThing(this.game, partSprite)

        // The Finnish version has a different name for this sound
        const sound = this.game.mulle.audio.ocean.sounds['202'].extraData.dirName
        this.playSound(sound, () => {
          this.game.time.events.add(Phaser.Timer.SECOND, this.leave, this)
        })
      })
    })
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
  }
}

export default OceanState
