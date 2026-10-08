'use strict'

import MulleState from './base'

import MulleSprite from '../objects/sprite'
import MulleBuildCar from '../objects/buildcar'
import MulleActor from '../objects/actor'

/**
 * Car show
 * 94.DXR
 *
 * The judge rates how funny the car is, a very funny car gets a medal.
 * Positions and timings are taken from the score of the original movie.
 *
 * 94d003v0: Welcome
 * 94d004v0 - 94d008v0: Rating 5 to 1
 * 94d009v0: Mulle got a medal
 */
class CarShowState extends MulleState {
  preload () {
    super.preload()

    this.game.load.pack('carshow', 'assets/carshow.json', null, this)
  }

  create () {
    super.create()

    this.DirResource = '94.DXR'
    this.frameTime = 1000 / 12
    this.car = null
    this.leaving = false

    this.game.mulle.addAudio('carshow')

    const background = new MulleSprite(this.game, 320, 240)
    background.setDirectorMember(this.DirResource, 200)
    this.game.add.existing(background)

    this.judge = this.addJudge()

    this.score = new MulleSprite(this.game, 177, 93)
    this.score.setDirectorMember(this.DirResource, 17)
    this.game.add.existing(this.score)
    this.score.visible = false

    const b = '00.CXT'
    const mulle = new MulleActor(this.game, 89, 337, 'mulleDefault')
    mulle.talkAnimation = 'talkRegular'
    mulle.silenceAnimation = 'idle'
    // MulleTurnAnimChart, Mulle turns to look at the judge
    const turn = []
    for (let i = 0; i < 13; i++) turn.push([b, 271])
    for (let i = 0; i < 4; i++) turn.push([b, 283])
    mulle.addAnimation('turn', turn, 12, false)
    this.game.add.existing(mulle)
    this.game.mulle.actors.mulle = mulle
    this.mulle = mulle

    this.car = new MulleBuildCar(this.game, 321, 288, null, true, false)
    this.game.add.existing(this.car)

    this.game.mulle.playAudio('94e001v0')

    if (!this.game.mulle.SetWhenDone) {
      this.game.mulle.SetWhenDone = {
        Medals: [4],
        Cache: ['#Exhibition'],
        Missions: [2]
      }
    }

    // Like init in the Dir script of 94.DXR
    const medalId = this.game.mulle.SetWhenDone.Medals[0]
    this.game.mulle.user.Car.addCache(this.game.mulle.SetWhenDone.Cache[0])
    this.game.mulle.user.addCompletedMission(this.game.mulle.SetWhenDone.Missions[0])
    const funnyFactor = this.game.mulle.user.Car.getProperty('funnyfactor', 0)

    let rating
    if (funnyFactor < 2) {
      rating = 1
    } else if (funnyFactor < 3) {
      rating = 2
    } else if (funnyFactor < 5) {
      rating = 3
    } else if (funnyFactor < 7) {
      rating = 4
    } else {
      rating = 5
    }

    const medal = funnyFactor > 8 && !this.game.mulle.user.Car.hasMedal(medalId)
    if (medal) this.game.mulle.user.Car.addMedal(medalId)

    console.log('funnyfactor', funnyFactor, rating, medal)

    const scoreTalk = { 1: '94d008v0', 2: '94d007v0', 3: '94d006v0', 4: '94d005v0', 5: '94d004v0' }

    // Welcome to the car show
    this.judge.talk('94d003v0', () => {
      mulle.animations.play('turn').onComplete.addOnce(() => {
        mulle.setDirectorMember(b, 283)

        // The judge raises the sign with the rating
        this.judge.animations.play('up').onComplete.addOnce(() => {
          this.score.setDirectorMember(this.DirResource, 17 + rating - 1)
          this.score.visible = true

          this.judge.talkAnimation = 'talkUp'
          this.judge.silenceAnimation = 'stillUp'
          // Wait until the actor has played its idle animation after talking
          this.judge.talk(scoreTalk[rating], () => this.game.time.events.add(0, () => {
            this.score.visible = false
            this.judge.animations.play('down').onComplete.addOnce(() => {
              this.judge.setDirectorMember(this.DirResource, 31)
              if (medal) {
                this.medal()
              } else {
                this.leave()
              }
            })
          }))
        })
      })
    })

    console.log('Car show')
  }

  /**
   * The judge with JudgeAnimChart and JudgeUpAnimChart
   * @return {MulleActor}
   */
  addJudge () {
    const m = this.DirResource
    const frames = (list) => list.map(f => [m, 31 + f - 1])
    const judge = new MulleActor(this.game, 155, 210, 'judge')
    judge.addAnimation('talkWelcome', frames([13, 14, 13, 13, 15, 15, 16, 13, 17]), 12, true)
    judge.addAnimation('up', frames([1, 2, 3, 4, 5, 6, 7]), 12, false)
    judge.addAnimation('stillUp', frames([7]), 12, false)
    judge.addAnimation('talkUp', frames([8, 9, 10, 9, 11]), 12, true)
    judge.addAnimation('down', frames([7, 6, 5, 4, 3, 2, 1]), 12, false)
    judge.talkAnimation = 'talkWelcome'
    judge.silenceAnimation = 'idle'
    this.game.add.existing(judge)
    this.game.mulle.actors.judge = judge
    return judge
  }

  /**
   * Mulle got a medal, it blinks while it is put on the car
   */
  medal () {
    this.mulle.talk('94d009v0', () => {
      const thing = new MulleSprite(this.game, 600, 444)
      thing.setDirectorMember(this.DirResource, 61)
      this.game.add.existing(thing)

      // ThingAnimChart blink
      const frames = [2, 2, 1, 1, 2, 2, 1, 1, 2, 2, 1, 1, 2, 2]
      let i = 0
      const blink = this.game.time.events.loop(this.frameTime, () => {
        thing.setDirectorMember(this.DirResource, 60 + frames[i++ % frames.length])
      })
      this.game.mulle.playAudio('00e028v0', () => {
        this.game.time.events.remove(blink)
        this.leave()
      })
    })
  }

  leave () {
    if (this.leaving) return
    this.leaving = true
    this.game.state.start('world')
  }

  shutdown () {
    this.game.mulle.stopAudio('94e001v0')
    if (this.mulle) this.mulle.resetTalk()
    if (this.judge) this.judge.resetTalk()

    this.game.mulle.actors.mulle = null
    this.game.mulle.actors.judge = null

    super.shutdown()
  }
}

export default CarShowState
