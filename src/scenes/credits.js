import MulleState from './base'
import MulleSprite from '../objects/sprite'

/**
 * Credits, shown when quitting the game
 * 12.DXR
 *
 * The score is exported by the scores build step, the number of pages and their
 * positions differ between languages.
 * Click to show the next page, double click to skip to the match.
 */
class CreditsState extends MulleState {
  preload () {
    super.preload()

    this.game.load.pack('credits', 'assets/credits.json', null, this)
    this.game.load.json('CreditsScore', 'data/score/12.DXR.json')
  }

  create () {
    super.create()

    this.DirResource = '12.DXR'
    this.score = this.game.cache.getJSON('CreditsScore')
    this.game.mulle.addAudio('credits')

    this.previousBackground = this.game.stage.backgroundColor
    this.game.stage.backgroundColor = '#000000'
    this.sprites = {}
    this.shapes = this.game.add.graphics(0, 0)
    this.sound = null
    this.soundMember = null
    this.effects = []
    this.alreadyDone = false
    this.lastClick = 0
    this.frameTimer = null

    // Members with images, shapes have no image
    this.imageMembers = new Set()
    for (const key of this.game.cache.getKeys(Phaser.Cache.IMAGE)) {
      for (const frame of this.game.cache.getImage(key, true).frameData.getFrames()) {
        if (frame.dirFile === this.DirResource) this.imageMembers.add(frame.dirNum)
      }
    }

    this.game.input.onDown.add(this.mouseUp, this)

    this.goToFrame(1)
  }

  /**
   * Get a sound by cast member number
   * @param {int} member
   * @return {Phaser.Sound}
   */
  playMember (member) {
    const sound = this.game.mulle.audio.credits.sounds[member]
    if (!sound) {
      console.error('Sound member not found', member)
      return null
    }
    return this.game.mulle.playAudio(sound.extraData.dirName)
  }

  mouseUp () {
    if (this.alreadyDone) return

    const doubleClick = this.game.time.now - this.lastClick < 400
    this.lastClick = this.game.time.now
    if (doubleClick) {
      this.goToFrame(this.score.markers.Eldmatch)
    } else {
      this.goToFrame(this.frameNum + 1)
    }
  }

  goToFrame (frameNum) {
    if (this.frameTimer) this.game.time.events.remove(this.frameTimer)
    this.frameNum = frameNum

    const frame = this.score.frames[frameNum - 1]
    if (!frame) {
      this.quit()
      return
    }

    this.drawSprites(frame.sprites)
    this.setSound(frame.sound)

    const script = frame.script ? frame.script[1] : null
    if (script === 4) {
      // Page turn
      this.effects.push(this.game.mulle.playAudio('12e002v0'))
    } else if (script === 9) {
      // The match is lit, clicks are ignored from now on
      this.alreadyDone = true
    } else if (script === 2) {
      this.quit()
      return
    }

    // The tempo channel waits a number of seconds, otherwise the movie runs at 12 fps
    const delay = frame.tempo ? frame.tempo * Phaser.Timer.SECOND : 1000 / 12
    this.frameTimer = this.game.time.events.add(delay, () => this.goToFrame(this.frameNum + 1))
  }

  drawSprites (sprites) {
    this.shapes.clear()

    for (const channel in this.sprites) {
      if (!sprites[channel]) this.sprites[channel].visible = false
    }

    for (const channel of Object.keys(sprites).sort((a, b) => a - b)) {
      const data = sprites[channel]
      let sprite = this.sprites[channel]
      if (!sprite) {
        sprite = new MulleSprite(this.game, 0, 0)
        this.game.add.existing(sprite)
        this.sprites[channel] = sprite
      }

      if (sprite.member !== data.member) {
        sprite.member = data.member
        sprite.hasImage = this.imageMembers.has(data.member)
        if (sprite.hasImage) sprite.setDirectorMember(this.DirResource, data.member)
      }

      if (!sprite.hasImage) {
        // Shape member, the top border is a white rectangle
        sprite.visible = false
        this.shapes.beginFill(0xffffff)
        this.shapes.drawRect(data.x, data.y, data.width, data.height)
        this.shapes.endFill()
        continue
      }

      sprite.position.set(data.x, data.y)
      sprite.visible = true
    }
  }

  setSound (sound) {
    const member = sound ? sound[1] : null
    if (member === this.soundMember) return

    if (this.sound) this.sound.stop()
    this.soundMember = member
    this.sound = member ? this.playMember(member) : null
  }

  quit () {
    this.game.state.start('menu')
  }

  shutdown () {
    super.shutdown()

    this.game.input.onDown.remove(this.mouseUp, this)
    this.game.stage.backgroundColor = this.previousBackground
    if (this.sound) this.sound.stop()
    for (const effect of this.effects) {
      if (effect) effect.stop()
    }
  }
}

export default CreditsState
