import MulleState from './base'
import MulleSprite from '../objects/sprite'

/**
 * Intro after login
 * 10.DXR, the score from the marker IntroStart (frame 5) to frame 106
 *
 * Mulle cycles home, digs a battery out of the junk pile and puts it on the chassis in
 * the garage. The narration 10e005v0 drives the first part with its cue points, the
 * rest follows the score and the anim charts of the original movie.
 * Clicking anywhere skips to the garage, like the mouseUp handler in 10.DXR.
 */
class IntroState extends MulleState {
  preload () {
    // The splash is in the menu pack, show it while the intro is loading
    this.splash = new MulleSprite(this.game, 320, 240)
    this.splash.setDirectorMember('10.DXR', 173)
    this.game.add.existing(this.splash)

    this.game.load.pack('intro', 'assets/intro.json', null, this)
  }

  create () {
    super.create()

    this.DirResource = '10.DXR'
    this.leaving = false
    this.sounds = []
    this.cues = []

    this.game.mulle.addAudio('menu')

    this.layer = this.game.add.group()
    this.layer.add(this.splash)

    this.game.input.onDown.addOnce(this.leave, this)

    // Frame 5, the narration starts on the splash
    this.narration = this.playSound('10e005v0')
    this.waitCue('Mulle', () => {
      // Frame 6
      this.show([this.member(93)])
      this.waitCue('Cykla', () => this.bike())
    })
  }

  update () {
    if (!this.narration || !this.narration.isPlaying) return
    for (const cue of this.cues) {
      if (!cue.done && this.narration.currentTime >= cue.time) {
        cue.done = true
        cue.callback.call(this)
      }
    }
  }

  /**
   * Wait for a cue point in the narration, like the frame scripts 7 and 8
   * @param {string} name Cue point name, the case differs between languages
   * @param {function} callback
   */
  waitCue (name, callback) {
    const data = this.narration ? this.narration.extraData : null
    const cue = data && data.cue ? data.cue.find(c => c[1].toLowerCase() === name.toLowerCase()) : null
    if (!cue) {
      console.warn('Cue point not found', name)
      this.game.time.events.add(0, callback, this)
      return
    }
    this.cues.push({ time: cue[0], callback, done: false })
  }

  playSound (id, onStop = null) {
    const sound = this.game.mulle.playAudio(id, onStop ? () => { if (!this.leaving) onStop.call(this) } : null)
    if (sound) this.sounds.push(sound)
    return sound
  }

  /**
   * Make a sprite from a cast member
   * @param {int} member
   * @param {int} x
   * @param {int} y
   * @param {string} dir
   * @return {MulleSprite}
   */
  member (member, x = 320, y = 240, dir = this.DirResource) {
    const sprite = new MulleSprite(this.game, x, y)
    sprite.setDirectorMember(dir, member)
    return sprite
  }

  /**
   * Replace the sprites on the stage, the first one is at the back
   * @param {MulleSprite[]} sprites
   */
  show (sprites) {
    this.layer.forEach(sprite => { if (sprite.animTimer) this.game.time.events.remove(sprite.animTimer) })
    this.layer.removeAll(true)
    for (const sprite of sprites) this.layer.add(sprite)
  }

  /**
   * Run score frames
   * @param {int} count Number of frames
   * @param {int} fps
   * @param {function} onFrame Called with the frame index, the first one at once
   * @param {function} onEnd
   */
  frames (count, fps, onFrame, onEnd) {
    let i = 0
    onFrame.call(this, 0)
    this.game.time.events.repeat(1000 / fps, count, () => {
      i++
      if (i < count) {
        onFrame.call(this, i)
      } else {
        onEnd.call(this)
      }
    })
  }

  /**
   * Play an anim chart action. The members are set one by one since they can be in different sprite sheets.
   * @param {MulleSprite} sprite
   * @param {int} firstFrame Member of frame 1 in the chart
   * @param {int[]} frames
   * @param {int} fps
   * @param {function} onEnd Called after the last frame, the action is repeated without it
   */
  animate (sprite, firstFrame, frames, fps, onEnd = null) {
    if (sprite.animTimer) this.game.time.events.remove(sprite.animTimer)
    let i = 0
    sprite.setDirectorMember(this.DirResource, firstFrame + frames[0] - 1)
    sprite.animTimer = this.game.time.events.loop(1000 / fps, () => {
      i++
      if (i < frames.length) {
        sprite.setDirectorMember(this.DirResource, firstFrame + frames[i] - 1)
      } else if (onEnd) {
        this.game.time.events.remove(sprite.animTimer)
        onEnd.call(this)
      } else {
        i = 0
        sprite.setDirectorMember(this.DirResource, firstFrame + frames[0] - 1)
      }
    })
  }

  /**
   * Frames 7 to 43, the small bike rides through the landscape. LillCykelLoop is a film
   * loop with members 97 to 99, its child is placed 1 pixel right and down from the loop location.
   */
  bike () {
    const xs = [-10, 0, 11, 21, 31, 42, 52, 62, 72, 83, 93, 103, 114, 124, 134, 145, 155, 165, 176,
      186, 196, 206, 217, 227, 237, 248, 258, 268, 279, 289, 299, 309, 320, 330, 340, 351, 361]
    const ys = [228, 228, 228, 228, 227, 227, 226, 226, 225, 225, 225, 224, 224, 223, 223, 222, 222, 221, 221,
      221, 220, 220, 219, 219, 218, 218, 217, 217, 217, 216, 216, 215, 215, 214, 214, 213, 212]
    const bike = this.member(97)
    this.show([this.member(94), bike])
    this.frames(xs.length, 12, (i) => {
      bike.setDirectorMember(this.DirResource, 97 + i % 3)
      bike.position.set(xs[i] + 1, ys[i] + 1)
    }, this.yard)
  }

  /**
   * Frames 44 to 70, Mulle rides into the garage behind the door. From frame 56 he is in
   * cykel_loop, a film loop with members 19 to 22 placed at (58, 101) from the loop location.
   */
  yard () {
    const ride = [
      [15, 196, 155], [15, 201, 162], [15, 206, 170], [15, 211, 177],
      [16, 244, 198], [16, 252, 204], [16, 260, 211], [16, 268, 217],
      [17, 310, 236], [17, 321, 239], [18, 310, 236], [18, 310, 236]
    ]
    const loop = [[237, 131], [258, 131], [279, 129], [301, 128], [322, 127], [343, 126], [364, 124], [386, 123],
      [407, 122], [428, 120], [449, 119], [470, 118], [492, 117], [513, 115], [534, 113]]
    loop.forEach(([x, y], i) => ride.push([19 + i % 4, x + 58, y + 101]))

    const mulle = this.member(15)
    this.show([this.member(1), mulle, this.member(14, 534, 151)])
    this.frames(ride.length, 12, (i) => {
      const [member, x, y] = ride[i]
      mulle.setDirectorMember(this.DirResource, member)
      mulle.position.set(x, y)
    }, this.junk)
  }

  /**
   * Frames 71 to 73, Mulle digs in the junk pile and finds a battery, DIgAnimChart and DogAnimChart
   */
  junk () {
    const mulle = this.member(196, 321, 217)
    const thing = this.member(208)
    thing.visible = false
    const dog = this.member(228, 135, 443)
    this.show([this.member(188), mulle, this.member(189, 439, 315), thing, dog])

    const look = [1, 2, 3, 2, 1, 2, 3, 2, 1, 2, 3, 2, 1, 2, 3, 4]
    this.animate(dog, 228, look, 12)

    const dig = [17, 17, 17, 17, 18, 18, 18, 17, 17, 18, 8, 8, 9, 9, 8, 8, 8, 9, 9, 8, 8, 9, 9, 10, 11, 12]
    this.animate(mulle, 196, dig, 12, () => {
      // Frame 72, Mulle throws something away along the Throw path
      this.animate(dog, 228, look, 12)
      const path = [[-16, -20], [-32, -33], [-48, -39], [-64, -38], [-80, -30], [-96, -15], [-112, 7],
        [-128, 36], [-144, 72], [-160, 115], [-186, 185]]
      thing.visible = true
      this.frames(path.length, 12, (i) => thing.position.set(320 + path[i][0], 240 + path[i][1]), () => {})

      const pull = [14, 15, 16, 17, 17, 17, 17, 17, 17, 18, 19, 18, 17, 16, 15, 16, 17, 18, 20, 19, 18, 19, 20]
      this.animate(mulle, 196, pull, 12, () => {
        // Frame 73, the dog sees the battery
        thing.visible = false
        this.animate(dog, 228, [5, 6, 7, 8, 8, 8, 8, 8, 8, 8, 7, 6, 6, 6, 6, 6, 6, 6, 6, 6], 12, () => {})
        const find = [1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 5, 5, 5, 5, 5, 5, 6, 7, 7, 7, 7, 7, 7, 7, 7, 21, 21, 7, 7, 7, 7, 7, 7, 7]
        this.animate(mulle, 196, find, 12, this.garage)
      })
    })
  }

  /**
   * Frames 79 to 87, marker Verkstad. Mulle brings the battery into the garage at 8 fps,
   * BatteryAnimChart
   */
  garage () {
    this.sound2 = this.playSound('10e006v0')

    const door = this.member(106)
    const mulle = this.member(25)
    mulle.visible = false
    const battery = this.member(50, 367, 252)
    battery.visible = false
    this.show([this.member(5), this.member(107), door, this.member(108), mulle, this.member(4, 372, 300), battery])

    // Frame 80 to 84, the door is open and Mulle comes in
    this.frames(6, 8, (i) => {
      if (i !== 1) return
      door.setDirectorMember(this.DirResource, 105)
      mulle.visible = true
    }, () => {
      // Frame 85, the door closes and Mulle carries the battery to the chassis in a channel in front of it
      door.setDirectorMember(this.DirResource, 106)
      this.layer.bringToTop(mulle)
      const walk = [1, 2, 3, 4, 4, 5, 6, 7, 7, 8, 9, 10, 11, 12, 12, 13, 14, 15, 16]
      this.animate(mulle, 25, walk, 8, () => {
        // Frame 86, the battery is on the chassis and Mulle goes back. Frame 87 sets 12 fps
        battery.visible = true
        mulle.position.set(318, 242)
        const goBack = [17, 18, 19, 20, 21, 22, 23, 24, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25]
        this.animate(mulle, 25, goBack, 12, this.sunset)
      })
    })
  }

  /**
   * Frames 88 and 89, the tempo channel waits 13 seconds and then the score waits for sound channel 2
   */
  sunset () {
    this.show([this.member(96)])
    this.game.time.events.add(13 * Phaser.Timer.SECOND, () => {
      if (this.sound2 && this.sound2.isPlaying) {
        this.sound2.onStop.addOnce(() => { if (!this.leaving) this.end() })
      } else {
        this.end()
      }
    })
  }

  /**
   * Frames 90 to 106, Mulle in the garage and the toolbox slides out before going to 03
   */
  end () {
    const toolbox = this.member(97, 621, 432, '00.CXT')
    this.show([this.member(12), this.member(271, 118, 188, '00.CXT'), toolbox])
    this.frames(17, 12, (i) => {
      if (i === 8) this.playSound('00e040v0')
      if (i >= 10) toolbox.x = 621 + (i - 9) * 7
    }, this.leave)
  }

  leave () {
    if (this.leaving) return
    this.leaving = true
    this.game.mulle.activeCutscene = '00b011v0'
    this.game.state.start('garage')
  }

  shutdown () {
    this.leaving = true
    for (const sound of this.sounds) sound.stop()
    this.game.input.onDown.remove(this.leave, this)
  }
}

export default IntroState
