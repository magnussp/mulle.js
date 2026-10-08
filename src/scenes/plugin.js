import MulleState from './base'
import MulleSprite from '../objects/sprite'
import MulleActor from '../objects/actor'
import MulleButton from '../objects/button'
import MulleBuffa from '../objects/buffa'
import partUtil from '../util/partUtil'
import blinkThing from '../util/blinkThing'

const MOVIE = '66.DXR'

/**
 * Figge's junk yard, the crane game from the plugin (DLC)
 * 66.DXR
 *
 * Move the junk with the crane using the arrow keys, a piece can only be put on a larger
 * piece. When the part at the bottom of the left stack is free it can be lifted and Mulle
 * gets one of the plugin parts. Ported from the Dir script and movie scripts of 66.DXR,
 * positions are taken from the score.
 */
class PluginState extends MulleState {
  preload () {
    super.preload()

    this.game.load.pack('plugin', 'assets/plugin.json', null, this)
  }

  create () {
    super.create()

    this.DirResource = MOVIE
    this.game.mulle.addAudio('plugin')
    this.sounds = []
    this.leaving = false
    this.playing = false
    this.item = null

    this.choosePart()

    this.sprite(25, 320, 240)

    // Figge
    this.sprite(69, -86, 228)
    this.figge = new MulleActor(this.game, -85, 228, 'pluginFigge', true)
    this.figge.setDirectorMember(MOVIE, 70)
    this.figge.addAnimation('idle', [[MOVIE, 70]], 12, false)
    // NeighbourAnimChart talk, one random frame in the middle
    this.figge.addAnimation('talk', [71, 72, 70, 73, 73, 74].map(m => [MOVIE, m]), 12, true)
    this.figge.talkAnimation = 'talk'
    this.game.add.existing(this.figge)

    this.game.add.existing(new MulleBuffa(this.game, 730, 276))

    // Mulle
    const mulleBody = new MulleSprite(this.game, 582, 251)
    mulleBody.setDirectorMember('00.CXT', 323)
    this.game.add.existing(mulleBody)
    this.mulle = new MulleActor(this.game, 582, 251, 'pluginMulle', true)
    this.mulle.setDirectorMember(MOVIE, 98)
    this.mulle.addAnimation('idle', [[MOVIE, 98]], 12, false)
    // MulleGameAnimChart
    this.mulle.addAnimation('talk', [98, 99, 100, 101, 102, 103, 104, 105].map(m => [MOVIE, m]), 12, true)
    this.game.add.existing(this.mulle)

    // The part to get at the bottom of the left stack, and the junk on top of it
    this.partSprite = null
    if (this.partId) {
      const part = new partUtil(this.game)
      this.partSprite = part.showPart(this.partId, 123, 414, true)
      this.partSprite.y -= this.partSprite.height / 2
      this.game.add.existing(this.partSprite)
    }

    // Junk from the largest to the smallest, sizes are the sprite rects in the score
    const junk = [[33, 80, 68], [34, 46, 48], [35, 56, 31], [36, 46, 35], [37, 49, 30]]
    this.junk = junk.map(([member, width, height], i) => {
      const sprite = this.sprite(member, 133, 0)
      sprite.scale.set(width / sprite.texture.frame.width, height / sprite.texture.frame.height)
      sprite.size = i + 2
      return sprite
    })
    // canHeights in the Dir script, can 1 is the part
    this.heights = [1, 62, 48, 31, 35, 30]

    this.crane = this.sprite(57, 320, 240)
    this.cranePosition = 0
    this.craneMembers = [57, 58, 59]
    this.craneLocs = [new Phaser.Point(125, 152), new Phaser.Point(320, 155), new Phaser.Point(486, 154)]

    this.stacks = [133, 325, 500].map(x => ({ x, items: [], currentY: 407 }))
    this.push(this.stacks[0], { size: 1, sprite: this.partSprite })
    for (const sprite of this.junk) this.push(this.stacks[0], { size: sprite.size, sprite })

    // Leave at any time
    const exit = new MulleButton(this.game, 620, 453, {
      imageDefault: [MOVIE, 45],
      click: () => this.leave()
    })
    this.game.add.existing(exit)

    this.keys = this.game.input.keyboard.addKeys({ left: Phaser.KeyCode.LEFT, right: Phaser.KeyCode.RIGHT, down: Phaser.KeyCode.DOWN, up: Phaser.KeyCode.UP })
    this.keys.left.onDown.add(() => this.playing && this.goLeft())
    this.keys.right.onDown.add(() => this.playing && this.goRight())
    this.keys.down.onDown.add(() => this.playing && this.goDown())
    this.keys.up.onDown.add(() => this.playing && this.goUp())
    this.game.input.keyboard.addKeyCapture([Phaser.KeyCode.LEFT, Phaser.KeyCode.RIGHT, Phaser.KeyCode.DOWN, Phaser.KeyCode.UP])

    this.intro()
  }

  sprite (member, x, y, movie = MOVIE) {
    const sprite = new MulleSprite(this.game, x, y)
    sprite.setDirectorMember(movie, member)
    this.game.add.existing(sprite)
    return sprite
  }

  playSound (id, onStop = null) {
    const sound = this.game.mulle.playAudio(id, onStop)
    if (sound) this.sounds.push(sound)
    return sound
  }

  /**
   * Choose a plugin part the user does not have, like init in the Dir script
   */
  choosePart () {
    const parts = [601, 602, 603, 604, 605, 606, 607] // PluginGameDB
    const left = parts.filter(id => !this.game.mulle.user.hasPart(id))
    this.beenHereBefore = left.length < parts.length
    this.gotPart = left.length > 0
    this.partId = this.gotPart ? this.game.rnd.pick(left) : null
  }

  intro () {
    this.mulle.talk('66d001v0', () => {
      this.figge.talk('66d002v0', () => {
        if (this.beenHereBefore) {
          this.startGame()
        } else {
          this.tutorial()
        }
      })
    })
  }

  /**
   * Figge explains the arrow keys, the keys light up in time with the speech
   */
  tutorial () {
    const plate = this.sprite(81, 320, 432)
    const keys = {
      up: this.sprite(82, 320, 390),
      left: this.sprite(84, 256, 449),
      down: this.sprite(86, 320, 449),
      right: this.sprite(88, 383, 449)
    }
    const normal = { up: 82, left: 84, down: 86, right: 88 }
    const light = (name) => {
      for (const key in keys) keys[key].setDirectorMember(MOVIE, normal[key] + (key === name ? 1 : 0))
    }
    // pTimerTime of the frames in the score, in ticks
    const timeline = [[320, 'up'], [530, 'left'], [600, 'right'], [800, 'down'], [950, null]]
    for (const [ticks, key] of timeline) {
      this.game.time.events.add(ticks * 1000 / 60, () => light(key))
    }

    this.figge.talk('66d003v0', () => {
      plate.destroy()
      for (const key in keys) keys[key].destroy()
      this.startGame()
    })
  }

  startGame () {
    this.playing = true
  }

  /**
   * Put an item on a stack, like push in the Parent CanStack script
   */
  push (stack, item) {
    stack.items.push(item)
    // The part keeps its own position, like BlinkThing in the score
    if (item.sprite && item.size > 1) item.sprite.position.set(stack.x, stack.currentY)
    stack.currentY -= this.heights[item.size - 1]
  }

  pop (stack) {
    const item = stack.items.pop()
    stack.currentY += this.heights[item.size - 1]
    return item
  }

  top (stack) {
    return stack.items[stack.items.length - 1]
  }

  /**
   * Hang the lifted item under the crane, a point plus a number adds to both coordinates in Lingo
   */
  hangItem () {
    if (!this.item) return
    const offset = Math.floor(this.heights[this.item.size - 1] / 2)
    const loc = this.craneLocs[this.cranePosition]
    this.item.sprite.position.set(loc.x + offset, loc.y + offset)
  }

  moveCrane (position) {
    this.cranePosition = position
    this.crane.setDirectorMember(MOVIE, this.craneMembers[position])
    this.hangItem()
  }

  goLeft () {
    if (this.cranePosition > 0) this.moveCrane(this.cranePosition - 1)
  }

  goRight () {
    if (this.cranePosition < 2) this.moveCrane(this.cranePosition + 1)
  }

  /**
   * Lift the top item of the stack under the crane, like GoUp in the Dir script
   */
  goUp () {
    if (this.item) {
      this.playSound('P36ef008')
      return
    }

    const stack = this.stacks[this.cranePosition]
    const item = this.top(stack)
    if (!item) {
      this.playSound('P36ef008')
      return
    }

    if (item.size === 1) {
      this.win()
      return
    }

    this.item = item
    this.itemHome = item.sprite.position.clone()
    this.itemStack = stack
    this.playSound('P36ef004')
    this.hangItem()
  }

  /**
   * Drop the lifted item, like drop in the movie script, the stack is chosen from where the item is
   */
  goDown () {
    if (!this.item) {
      this.playSound('P36ef008')
      return
    }

    const item = this.item
    this.item = null
    const x = item.sprite.x
    const index = x > 100 && x < 300 ? 0 : x > 300 && x < 380 ? 1 : x > 380 && x < 620 ? 2 : -1
    const stack = this.stacks[index]
    const top = stack ? this.top(stack) : null

    if (!stack || stack === this.itemStack || (top && top.size >= item.size)) {
      item.sprite.position.copyFrom(this.itemHome)
      this.playSound('P09ef001')
      return
    }

    this.playSound(top ? 'P09ef005' : 'P09ef004')
    this.pop(this.itemStack)
    this.push(stack, item)

    // Without a part to give Figge stops the game when the largest piece is moved
    if (!this.gotPart && item.size === 2) {
      this.noGive()
    }
  }

  /**
   * The part is free and Mulle gets it
   */
  win () {
    if (!this.partSprite) return
    this.playing = false
    this.partSprite.position.set(99, 457 - this.partSprite.height / 2)

    // GivePart in the score
    this.game.mulle.user.addPart('yard', this.partId)
    this.figge.talk('66d004v0', () => {
      this.mulle.talk('84d001v0', () => {
        this.game.time.events.add(14 * 1000 / 12, () => {
          new blinkThing(this.game, this.partSprite, () => this.leave(), this)
        })
      })
    })
  }

  noGive () {
    this.playing = false
    this.figge.talk('66d005v0', () => this.leave())
  }

  leave () {
    if (this.leaving) return
    this.leaving = true
    this.game.state.start('world')
  }

  shutdown () {
    super.shutdown()

    this.game.input.keyboard.removeKey(Phaser.KeyCode.LEFT)
    this.game.input.keyboard.removeKey(Phaser.KeyCode.RIGHT)
    this.game.input.keyboard.removeKey(Phaser.KeyCode.DOWN)
    this.game.input.keyboard.removeKey(Phaser.KeyCode.UP)
    this.game.input.keyboard.removeKeyCapture(Phaser.KeyCode.LEFT)
    this.game.input.keyboard.removeKeyCapture(Phaser.KeyCode.RIGHT)
    this.game.input.keyboard.removeKeyCapture(Phaser.KeyCode.DOWN)
    this.game.input.keyboard.removeKeyCapture(Phaser.KeyCode.UP)

    for (const sound of this.sounds) sound.stop()
    if (this.mulle) this.mulle.resetTalk()
    if (this.figge) this.figge.resetTalk()
  }
}

export default PluginState
