import MulleState from './base'
import MulleSprite from '../objects/sprite'
import MulleActor from '../objects/actor'
import partUtil from '../util/partUtil'
import blinkThing from '../util/blinkThing'

/**
 * Tree in the road
 * 83.DXR
 *
 * A car is blocked by a fallen tree. If Mulle's car is strong enough the tree
 * is pulled away and the driver gives Mulle a part, otherwise Mulle gives up.
 * Positions and timings are taken from the score of the original movie.
 */
class TreeCarState extends MulleState {
  preload () {
    super.preload()

    this.game.load.pack('roadtree', 'assets/roadtree.json', null, this)
    this.game.load.json('RoadTreeAnimations', 'assets/roadtree-animations.json')
  }

  create () {
    super.create()

    this.DirResource = '83.DXR'
    this.frameTime = 1000 / 12

    this.game.mulle.addAudio('roadtree')
    this.charts = this.game.cache.getJSON('RoadTreeAnimations')
    this.sounds = []
    this.mulleActor = null
    this.leaving = false

    if (!this.game.mulle.SetWhenDone) {
      this.game.mulle.SetWhenDone = {
        Cache: ['#TreeInRoad'],
        Parts: ['#Random']
      }
    }

    this.sprite(1, 320, 240)

    // Clicking skips the scene, like the mouseUp handler in the original movie
    this.game.input.onDown.addOnce(this.leave, this)

    const strength = this.game.mulle.user.Car.getProperty('strength', 0)
    console.log('Car strength is', strength)
    if (strength > 3) {
      this.justDoIt()
    } else {
      this.cantDoIt()
    }
  }

  /**
   * Add a sprite with a member from this movie
   * @param {int} member
   * @param {int} x
   * @param {int} y
   * @param {string} movie
   * @return {MulleSprite}
   */
  sprite (member, x, y, movie = this.DirResource) {
    const sprite = new MulleSprite(this.game, x, y)
    sprite.setDirectorMember(movie, member)
    this.game.add.existing(sprite)
    return sprite
  }

  /**
   * Convert frames in an anim chart to cast members
   * @param {string} chart Anim chart name
   * @param {string} action Action in the chart
   * @param {int} firstFrame Cast number of the first frame
   * @param {string} movie
   * @return {Array} Members for MulleSprite.addAnimation
   */
  chartMembers (chart, action, firstFrame, movie = this.DirResource) {
    return this.charts[chart][action].map(frame => [movie, firstFrame + frame - 1])
  }

  /**
   * Run a callback after a number of score frames
   * @param {int} frames
   * @param {function} callback
   */
  wait (frames, callback) {
    this.game.time.events.add(frames * this.frameTime, callback, this)
  }

  /**
   * Change member and position of a sprite at given score frames
   * @param {MulleSprite} sprite
   * @param {int} startFrame Score frame the list is relative to
   * @param {Array} keyFrames List of [frame, member, x, y], member null hides the sprite
   */
  keyFrames (sprite, startFrame, keyFrames) {
    for (const [frame, member, x, y] of keyFrames) {
      this.wait(frame - startFrame, () => {
        if (member === null) {
          sprite.visible = false
          return
        }
        sprite.setDirectorMember(this.DirResource, member)
        sprite.position.set(x, y)
        sprite.visible = true
      })
    }
  }

  playSound (id, onStop = null) {
    const sound = this.game.mulle.playAudio(id, onStop)
    if (sound) this.sounds.push(sound)
    return sound
  }

  /**
   * The driver of the stuck car calls for help
   * @param {int} x
   * @param {int} y
   * @param {function} onEnd
   */
  driverHelp (x, y, onEnd) {
    const driver = new MulleActor(this.game, x, y, 'treeCarDriver', true)
    driver.setDirectorMember(this.DirResource, 93)
    driver.addAnimation('idle', [[this.DirResource, 93]], 12, false)
    driver.addAnimation('talk', this.chartMembers('HelpAnimChart', 'talk', 93), 12, true)
    driver.talkAnimation = 'talk'
    this.game.add.existing(driver)

    driver.talk('83d009v0', () => {
      driver.destroy()
      onEnd.call(this)
    })
  }

  /**
   * Mulle walks in from the right, Buffa follows
   * @param {int} buffaX Buffa x position while walking in
   * @param {int} mulleY Mulle y position when standing
   * @param {function} onEnd Called when Mulle has stopped
   */
  mulleEnter (buffaX, mulleY, onEnd) {
    this.mulleActor = new MulleActor(this.game, 384, 253, 'treeCarMulle', true)
    this.mulleActor.setDirectorMember(this.DirResource, 46)
    this.mulleActor.addAnimation('idle', [[this.DirResource, 46]], 12, false)
    this.mulleActor.addAnimation('talk', this.chartMembers('SpegelAnimChart', 'Talk', 46), 12, true)
    this.mulleActor.addAnimation('point', this.chartMembers('SpegelAnimChart', 'Pek', 46), 12, true)
    const enter = this.mulleActor.addAnimation('in', this.chartMembers('SpegelAnimChart', 'in', 46), 12, false)
    this.mulleActor.talkAnimation = 'talk'
    this.game.add.existing(this.mulleActor)

    // Buffa uses the shared walking frames counted from 00a006v0
    this.buffa = this.sprite(174, buffaX, 180, '00.CXT')
    const sitt = this.buffa.addAnimation('sitt', this.chartMembers('SittAnimChart', 'sitt', 174, '00.CXT'), 12, false)
    sitt.onComplete.addOnce(() => {
      this.buffa.setDirectorMember('00.CXT', 174)
      this.buffa.position.set(776, 179)
    })
    this.buffa.animations.play('sitt')

    enter.onComplete.addOnce(() => {
      this.mulleActor.position.set(573, mulleY)
      this.mulleActor.animations.play('idle')
      onEnd.call(this)
    })
    this.mulleActor.animations.play('in')
  }

  /**
   * The car is too weak to pull the tree away
   */
  cantDoIt () {
    this.sprite(2, 163, 309)
    this.sprite(27, 320, 240)
    const rope = this.sprite(22, 320, 240)

    this.driverHelp(169, 228, () => {
      // Engine strains, but the rope does not move the tree
      rope.addAnimation('weak', this.chartMembers('WeakCarAnimChart', 'Svag', 22), 12, true)
      rope.animations.play('weak')
      this.playSound('83e001v0', () => {
        rope.animations.stop('weak')
        rope.setDirectorMember(this.DirResource, 22)

        this.wait(12, () => {
          this.mulleEnter(642, 157, () => {
            this.mulleActor.talk('83d003v0', () => this.wait(14, this.leave))
          })
        })
      })
    })
  }

  /**
   * The car pulls the tree away and the driver gives Mulle a part
   */
  justDoIt () {
    const part = new partUtil(this.game)
    const partId = part.getPart()
    console.log('given part', partId)
    this.game.mulle.user.Car.addCache(this.game.mulle.SetWhenDone.Cache[0])

    const car = this.sprite(2, 188, 302)

    let partSprite = null
    if (partId) {
      this.game.mulle.user.addPart('yard', partId)
      partSprite = part.showPart(partId, 312, 107, true)
      partSprite.y -= partSprite.height / 2
      this.game.add.existing(partSprite)
    }

    const tree = this.sprite(27, 320, 240)
    const rope = this.sprite(22, 320, 240)
    const driverHead = this.sprite(13, 194, 221)
    driverHead.visible = false

    this.driverHelp(194, 221, () => {
      const start = 41

      this.wait(52 - start, () => this.playSound('83e002v0'))

      this.keyFrames(rope, start, [
        [83, 23, 320, 240], [84, 24, 321, 240], [85, 25, 321, 240], [86, 26, 321, 239],
        [88, 25, 322, 239], [89, 25, 320, 240], [91, 26, 320, 240], [92, null]
      ])

      // The tree is pulled up the road
      const treePath = [
        [86, 27, 321, 239], [89, 27, 320, 240], [92, 28, 320, 240],
        [93, 28, 322, 239], [94, 28, 324, 238], [95, 28, 326, 237], [96, 28, 328, 235],
        [97, 28, 332, 234], [98, 28, 335, 232], [99, 28, 339, 229], [100, 28, 344, 227],
        [101, 28, 349, 224], [102, 28, 356, 220], [103, 28, 363, 216], [104, 28, 372, 212],
        [105, 28, 383, 207], [106, 28, 395, 202], [107, 28, 409, 196], [108, 28, 425, 188],
        [109, 28, 442, 181], [110, 28, 445, 180], [111, 28, 448, 179], [112, 28, 450, 177],
        [113, 28, 453, 176], [114, 28, 455, 175], [115, 28, 458, 174], [116, 28, 460, 173],
        [117, 28, 463, 172], [118, 28, 465, 171], [119, 28, 474, 166], [120, 28, 483, 162],
        [121, 28, 490, 159], [122, 28, 497, 155], [123, 28, 502, 152], [124, 28, 507, 150],
        [125, 28, 512, 147], [126, 28, 516, 145], [127, 28, 520, 144], [128, 28, 523, 142],
        [129, 28, 526, 141], [130, 28, 528, 139], [131, 28, 530, 138], [132, 28, 532, 137],
        [133, 28, 534, 136], [134, 28, 536, 136], [135, 28, 537, 135], [136, null]
      ]
      this.keyFrames(tree, start, treePath)

      // The driver looks after the tree
      this.keyFrames(driverHead, start, [
        [109, 13, 194, 221], [113, null], [116, 13, 194, 221], [118, null], [119, 14, 194, 221]
      ])

      this.wait(155 - start, () => this.mulleEnter(637, 159, () => this.mulleTalk(partSprite, car, driverHead)))
    })
  }

  /**
   * Mulle talks about the tree and finds the part
   * @param {Phaser.Sprite|null} partSprite
   * @param {MulleSprite} car
   * @param {MulleSprite} driverHead
   */
  mulleTalk (partSprite, car, driverHead) {
    this.mulleActor.talk('83d006v0', () => {
      this.mulleActor.talkAnimation = 'point'
      this.mulleActor.talk('83d007v0', () => {
        this.mulleActor.talkAnimation = 'talk'
        this.mulleActor.talk('83d008v0', () => {
          const done = () => {
            driverHead.destroy()
            this.carStart(car)
          }
          if (partSprite) {
            new blinkThing(this.game, partSprite, done, this)
          } else {
            done()
          }
        })
      })
    })
  }

  /**
   * The car drives away
   * @param {MulleSprite} car
   */
  carStart (car) {
    const start = 184
    this.playSound('83e004v0')
    this.keyFrames(car, start, [
      [184, 3, 188, 302], [185, 3, 192, 300], [186, 3, 197, 297], [187, 3, 204, 293],
      [188, 3, 214, 288], [189, 3, 228, 280], [190, 3, 248, 269], [191, 3, 276, 255],
      [192, 3, 307, 239], [193, 3, 338, 223], [194, 3, 370, 207], [195, 3, 401, 192],
      [196, 3, 441, 173], [197, 3, 482, 154], [198, 3, 522, 135], [199, 3, 563, 116],
      [200, 3, 603, 97], [201, 3, 644, 78], [202, 3, 684, 59], [203, 3, 725, 40],
      [204, 3, 765, 21], [205, 3, 806, 3], [206, 3, 846, -16], [207, 3, 887, -35],
      [208, null]
    ])
    this.wait(224 - start, this.leave)
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
    if (this.mulleActor) this.mulleActor.resetTalk()
  }
}

export default TreeCarState
