/**
 * Buffa, the dog
 * @module objects/buffa
 */
'use strict'

import MulleSprite from './sprite'

/**
 * BuffaAnimChart from 00.CXT, frames are relative to 00a006v0 (member 174)
 * [hold, frame, min, max] holds a frame a random number of frames
 */
const CHART = {
  Still: [1],
  Wait: [['hold', 1, 20, 40], 'Shrug', 'Shrug', 'Shrug', 'Shrug', 'Shrug', 'Shrug', 'Shrug', 'Shrug', 'Shrug', 'Talk'],
  Talk: [49, 50, 50, 49, 49, 49, 50, 50, ['hold', 49, 10, 20]],
  Shrug: [41, 41, 42, 42, 41, 41, 42, 42, 41, 41, 42, 42, 41, 41, 42, 42],
  GetDown: [41, 41, 42, 42, 42, 42, 43, 43, 44, 44, 45, 45],
  GetUp: [45, 45, 44, 44, 43, 43, 42, 42, 41, 41],
  Sleep: [['hold', 46, 12, 18], 47, 47, 47, 47],
  WalkRightStart: [1, 2, 3, 4, 5, 6, 7, 8],
  WalkRight: [9, 10, 11, 12, 13, 14, 15, 16],
  WalkRightStop: [17, 18, 19, 20],
  WalkLeftStart: [21, 22, 23, 24, 25, 26, 27, 28],
  WalkLeft: [29, 30, 31, 32, 33, 34, 35, 36],
  WalkLeftStop: [37, 38, 39, 40]
}

const FIRST_FRAME = 174
const BARK_SOUNDS = ['00e017v0', '00e018v0', '00e019v0']

/**
 * Buffa waiting, shrugging, barking, walking around and sleeping.
 * Ported from SpriteAnimBH and BuffaBH in 00.CXT and BuffaYardBH in 04.DXR,
 * runs at the 12 fps of the movies
 * @extends MulleSprite
 */
class MulleBuffa extends MulleSprite {
  /**
   * @param {Phaser.Game} game
   * @param {number} x Location of the sprite in the score
   * @param {number} y
   * @param {string|null} behavior 'junk' to walk around the junk yard like BuffaBH,
   *   'yard' to walk back and forth in the yard like BuffaYardBH, null to only wait
   */
  constructor (game, x, y, behavior = null) {
    super(game, x, y)

    this.behavior = behavior
    this.roaming = behavior !== null
    this.leftBorder = 150 + 200
    this.rightBorder = 350 + 200
    this.okToGoLeft = false
    this.waitState = 'move'
    this.frames = []
    this.counter = 0

    this.setAction('Wait')
    this.timer = this.game.time.events.loop(1000 / 12, this.step, this)
    this.events.onDestroy.addOnce(() => this.game.time.events.remove(this.timer))

    if (this.roaming) {
      this.inputEnabled = true
      this.input.pixelPerfectClick = true
      this.events.onInputUp.add(this.mouseUp, this)
    }
  }

  /**
   * Random number from 1 to n like random() in Lingo
   * @param {int} n
   */
  random (n) {
    return this.game.rnd.integerInRange(1, n)
  }

  /**
   * Set the action and build its frame list, like setAnimAction in SpriteAnimBH
   * @param {string} action
   */
  setAction (action) {
    this.mode = action
    let chart = CHART[action]

    if (action === 'Wait') {
      // Alternate between holding still and a random wait action
      if (this.waitState === 'move') {
        chart = [chart[0]]
        this.waitState = 'still'
      } else {
        const option = chart[this.random(chart.length - 1)]
        chart = CHART[option]
        this.waitState = 'move'
        if (option === 'Talk') this.bark()
      }
    } else if (action === 'Talk') {
      this.bark()
    }

    this.frames = []
    for (const entry of chart) {
      if (Array.isArray(entry)) {
        const [, frame, min, max] = entry
        const hold = min + this.random(max - min)
        for (let i = 0; i < hold; i++) this.frames.push(frame)
      } else {
        this.frames.push(entry)
      }
    }
    this.counter = 0
  }

  bark () {
    this.game.mulle.playAudio(this.game.rnd.pick(BARK_SOUNDS))
  }

  /**
   * Move the location, like setAnimLoc in SpriteAnimBH
   * @param {number|null} x
   * @param {number|null} y
   * @param {boolean} relative
   */
  setLoc (x, y, relative) {
    if (relative) {
      this.position.add(x, y)
    } else {
      if (x !== null) this.x = x
      if (y !== null) this.y = y
    }
  }

  step () {
    if (this.roaming && this.mode === 'Wait' && this.random(100) === 1) {
      this.randomMove(this.behavior === 'yard' ? 3 : 4)
    }

    const frame = this.frames[this.counter]
    this.setDirectorMember('00.CXT', FIRST_FRAME + frame - 1)
    this.counter++

    if (this.counter >= this.frames.length) {
      if (this.mode === 'Wait' || this.mode === 'Still') {
        this.setAction(this.mode)
      } else {
        this.stopped()
      }
    }
  }

  randomMove (maxRnd) {
    if (this.behavior === 'yard') {
      this.yardRandomMove()
      return
    }

    for (;;) {
      switch (this.random(maxRnd)) {
        case 1:
          if (this.x < this.rightBorder) {
            this.setAction('WalkRightStart')
            return
          }
          break
        case 2:
          if (this.x > this.leftBorder) {
            this.setLoc(-330, 0, true)
            this.setAction('WalkLeftStart')
            return
          }
          break
        case 3:
          this.setAction('Talk')
          return
        case 4:
          this.setAction('GetDown')
          return
      }
    }
  }

  /**
   * Walk one step to the right and back or lie down, like randomMove in BuffaYardBH
   */
  yardRandomMove () {
    for (;;) {
      switch (this.random(3)) {
        case 1:
          if (!this.okToGoLeft) {
            this.setAction('WalkRightStart')
            return
          }
          break
        case 2:
          if (this.okToGoLeft) {
            this.setLoc(-330, 0, true)
            this.setAction('WalkLeftStart')
            return
          }
          break
        case 3:
          this.setAction('GetDown')
          return
      }
    }
  }

  mouseUp () {
    if (this.mode === 'Wait') {
      this.randomMove(3)
    } else if (this.mode === 'Sleep') {
      this.setAction('GetUp')
    }
  }

  /**
   * Choose the next action when an action has finished, like Stopped in BuffaBH
   */
  stopped () {
    let next = 'Wait'
    switch (this.mode) {
      case 'WalkRightStart':
        next = 'WalkRight'
        break
      case 'WalkRight':
        if (this.behavior === 'yard') {
          next = 'WalkRightStop'
        } else if (this.random(2) === 1 && this.x < this.rightBorder) {
          this.setLoc(80, 0, true)
          next = 'WalkRight'
        } else {
          next = 'WalkRightStop'
        }
        break
      case 'WalkRightStop':
        this.okToGoLeft = true
        this.setLoc(200, 0, true)
        break
      case 'WalkLeftStart':
        next = 'WalkLeft'
        break
      case 'WalkLeft':
        if (this.behavior === 'yard') {
          next = 'WalkLeftStop'
        } else if (this.random(2) === 1 && this.x > this.leftBorder) {
          this.setLoc(-80, 0, true)
          next = 'WalkLeft'
        } else {
          next = 'WalkLeftStop'
        }
        break
      case 'WalkLeftStop':
        this.okToGoLeft = false
        this.setLoc(140, 0, true)
        break
      case 'GetDown':
        next = 'Sleep'
        break
      case 'Sleep':
        next = this.random(30) === 1 ? 'GetUp' : 'Sleep'
        break
    }
    if (next === 'Wait') this.waitState = 'move'
    this.setAction(next)
  }
}

export default MulleBuffa
