'use strict'

import MulleState from './base'

import MulleSprite from '../objects/sprite'
import MulleBuildCar from '../objects/buildcar'
// import MulleActor from '../objects/actor'
import MulleButton from '../objects/button'
import MulleCarPart from '../objects/carpart'
import MulleActor from '../objects/actor'
import SubtitleLoader from '../objects/SubtitleLoader'
import MulleBuffa from '../objects/buffa'

class YardState extends MulleState {
  preload () {
    super.preload()

    // game.load.pack('04.DXR', 'assets/04.DXR/pack.json', null, this);

    this.game.load.pack('yard', 'assets/yard.json', null, this)
    this.subtitles = new SubtitleLoader(this.game, 'yard', ['english'])
    this.subtitles.preload()
  }

  create () {
    this.giftNote = null
    super.create()
    this.game.mulle.addAudio('yard')
    this.subtitles.load()

    this.car = null
    this.junkParts = null

    this.door_side = null
    this.door_garage = null

    this.game.physics.startSystem(Phaser.Physics.ARCADE)
    this.game.physics.arcade.gravity.y = 800

    var background = new MulleSprite(this.game, 320, 240)
    background.setDirectorMember('04.DXR', 37)
    this.game.add.existing(background)

    // var this.door_side, door_garage;

    this.mailboxLayer = this.game.add.group()
    this.readingMail = false
    this.createMailbox(this.game.mulle.missions.getMission('#Mail'))

    if (this.game.mulle.user.toYardThroughDoor) {
      // without car

      this.door_side = new MulleButton(this.game, 320, 240, {
        imageDefault: ['04.DXR', 13],
        imageHover: ['04.DXR', 14],
        soundDefault: '02e015v0',
        soundHover: '02e016v0',
        click: (a) => {
          this.game.mulle.activeCutscene = '00b011v0'
          this.game.state.start('garage')
        }
      })
      this.game.add.existing(this.door_side)

      this.door_garage = new MulleButton(this.game, 320, 240, {
        imageDefault: ['04.DXR', 40],
        imageHover: ['04.DXR', 41],
        soundDefault: '02e015v0',
        soundHover: '02e016v0',
        click: (a) => {
          this.game.mulle.activeCutscene = '00b016v0'
          this.game.state.start('garage')
        }
      })
      this.game.add.existing(this.door_garage)

      this.door_side.cursor = 'Right'
      this.door_side.cursorHover = 'Right'
      this.door_side.cursorDrag = 'MoveRight'

      this.mulleActor = new MulleActor(this.game, 67, 173, 'mulleDefault')
      this.game.add.existing(this.mulleActor)
      // Buffa walks back and forth and sleeps, like BuffaYardBH
      this.buffaActor = new MulleBuffa(this.game, 330, 222, 'yard')
      this.game.add.existing(this.buffaActor)

      if(this.game.mulle.user.figgeBeenHere === 1)
      {
        this.game.mulle.user.figgeBeenHere = 0
        this.mulleActor.talk('04d021v0')
      }

    } else {
      // with car

      var go_road = new MulleButton(this.game, 320, 240, {
        imageDefault: ['04.DXR', 16],
        click: (a) => {
          this.game.mulle.activeCutscene = '00b008v0'

          this.game.mulle.lastSession = null

          this.game.mulle.user.Car.resetCache()

          this.game.state.start('world')
        }
      })
      this.game.add.existing(go_road)

      go_road.cursor = 'Click'

      // dummy door
      this.door_side = new MulleSprite(this.game, 320, 240)
      this.door_side.setDirectorMember('04.DXR', 13)
      this.game.add.existing(this.door_side)

      // garage door, drop zone
      this.door_garage = new MulleButton(this.game, 320, 240, {
        imageDefault: ['04.DXR', 41],
        imageHover: ['04.DXR', 41],
        click: (a) => {
          this.game.mulle.activeCutscene = '00b015v0'
          this.game.state.start('garage')
        }
      })

      this.door_garage.hitArea = new Phaser.Rectangle(220, -190, 100, 240)

      this.game.add.existing(this.door_garage)

      this.car = new MulleBuildCar(this.game, 368, 240, null, true, true)
      this.game.add.existing(this.car)
    }

    this.door_garage.cursor = 'Right'
    this.door_garage.cursorHover = 'Right'
    this.door_garage.cursorDrag = 'MoveRight'

    /*
    this.junkPile = this.game.mulle.user.Junk.yard

    this.junkParts = this.junkPile.makeContainer()

    this.junkPile.addJunkLocation(this.door_garage, 'shopFloor')
    this.junkPile.addJunkLocation(this.door_side, 'shopFloor')

    this.junkPile.spawnParts()
    */

    this.junkParts = this.game.add.group()
    this.junkParts.pileName = 'yard'

    for (let partId in this.game.mulle.user.Junk.yard) {
      this.addYardPart(partId, this.game.mulle.user.Junk.yard[partId])
    }

    this.checkGifts()

    this.game.mulle.playAudio('02e010v0')

    if (this.game.mulle.cheats) {
      document.getElementById('cheats').innerHTML = ''
      for (const scene of Object.values(this.game.mulle.scenes))   {
        const b = document.createElement('button')
        b.innerHTML = scene
        b.className = 'button'

        b.addEventListener('click', (e) => {
          this.game.state.start(scene, true, false, this.key)
        })

        document.getElementById('cheats').appendChild(b)
      }

      const b_mail = document.createElement('button')
      b_mail.innerHTML = 'Mail'
      b_mail.className = 'button'
      b_mail.addEventListener('click', () => {
        // The next mission comes when an even number of cars have been built
        const user = this.game.mulle.user
        user.NrOfBuiltCars = (user.NrOfBuiltCars || 0) + 2 - (user.NrOfBuiltCars || 0) % 2
        user.missionIsComing = true
        console.log('Next mission is coming', this.game.mulle.missions.checkMissions())
      })
      document.getElementById('cheats').appendChild(b_mail)
    }

    console.log('Yard', 'through door')
  }

  /**
   * Add a part lying in the yard, it can be dragged into the garage
   * @param {int} partId
   * @param {{x: number, y: number}} pos
   */
  addYardPart (partId, pos) {
    let cPart = new MulleCarPart(this.game, partId, pos.x, pos.y)
    cPart.junkParts = this.junkParts

    const toGarage = (d) => {
      // The garage floor holds 15 parts, like letGoOfPart in PartsCommon
      if (Object.keys(this.game.mulle.user.Junk.shopFloor).length >= 15) {
        if (this.yardMulle && !this.yardMulle.isTalking) {
          this.yardMulle.talk(this.game.rnd.pick(['04d016v0', '04d017v0', '04d018v0']))
        }
        return false
      }
      d.destroy()
      this.game.mulle.user.Junk.shopFloor[partId] = { x: this.game.rnd.integerInRange(0, 640), y: 240 }
      this.game.mulle.playAudio('00e004v0')
      return true
    }
    cPart.dropTargets.push([this.door_side, toGarage])
    cPart.dropTargets.push([this.door_garage, toGarage])

    this.junkParts.addChild(cPart)
    return cPart
  }

  /**
   * Show the gift package if there are gifts, like startMovie and packageBH in 04.DXR
   */
  checkGifts () {
    const gifts = this.game.mulle.user.gifts || []
    if (!gifts.length) return

    const giftPackage = new MulleButton(this.game, 180, 410, {
      imageDefault: ['04.DXR', 53],
      click: () => {
        if (this.giftNote) return
        this.showGiftNote(giftPackage)
      }
    })
    this.game.add.existing(giftPackage)

    if (this.yardMulle) {
      this.yardMulle.talk(this.game.rnd.pick(['04d013v0', '04d014v0', '04d015v0']))
    }
  }

  /**
   * Show the note in the package, the parts end up in the yard when it has been read
   * @param {MulleButton} giftPackage
   */
  showGiftNote (giftPackage) {
    this.giftNote = new MulleSprite(this.game, 320, 240)
    this.giftNote.setDirectorMember('04.DXR', 47)
    this.giftNote.inputEnabled = true
    this.giftNote.input.priorityID = 1000
    this.game.add.existing(this.giftNote)

    let finished = false
    this.game.mulle.playAudio('04d023v0', () => { finished = true })

    this.giftNote.events.onInputDown.add(() => {
      if (!finished) return
      for (const [partId, pos] of this.game.mulle.user.gifts) {
        this.game.mulle.user.addPart('yard', partId, new Phaser.Point(pos.x, pos.y))
        this.addYardPart(partId, pos)
      }
      this.game.mulle.user.gifts = []
      this.game.mulle.user.save()
      this.giftNote.destroy()
      this.giftNote = null
      giftPackage.destroy()
    })
  }

  /**
   * Mulle standing in the yard or sitting in the car
   * @return {MulleActor}
   */
  get yardMulle () {
    return this.mulleActor || (this.car && this.car.mulleSit)
  }

  /**
   * Create the mailbox, with mail if a mission comes by mail
   * @param {Object|null} mailMission
   */
  createMailbox (mailMission) {
    this.mailboxLayer.removeAll(true)

    let mailbox
    if (mailMission) {
      mailbox = new MulleButton(this.game, 320, 240, {
        imageDefault: ['04.DXR', 44],
        click: () => {
          if (this.readingMail) return
          this.readingMail = true
          // There is mail for you
          this.yardMulle.talk('04d020v0', () => this.readMail(mailMission))
        }
      })
    } else {
      mailbox = new MulleButton(this.game, 320, 240, {
        imageDefault: ['04.DXR', 42],
        imageHover: ['04.DXR', 43],
        soundDefault: '04e009v0',
        soundHover: '04e010v0',
        click: () => {
          // No mail today
          if (this.yardMulle && !this.yardMulle.isTalking) this.yardMulle.talk('04d001v0')
        }
      })
    }
    this.mailboxLayer.add(mailbox)
  }

  /**
   * Show the letter with a mission, like kickMail in the Missions script
   * @param {Object} mission
   */
  readMail (mission) {
    this.game.mulle.missions.missionGiven()

    const letter = new MulleSprite(this.game, 320, 240)
    letter.setDirectorMember('CDDATA.CXT', mission.image)
    letter.inputEnabled = true
    letter.input.priorityID = 1000
    this.game.add.existing(letter)

    let finished = false
    this.game.mulle.playAudio(mission.sound, () => { finished = true })

    // Click to put the letter away when it has been read
    letter.events.onInputDown.add(() => {
      if (!finished) return
      letter.destroy()
      this.readingMail = false
      this.createMailbox(null)
    })
  }

  shutdown () {
    this.game.mulle.stopAudio('02e010v0')

    console.log('shutdown yard')

    this.game.mulle.user.Junk.yard = {}

    this.junkParts.forEach((p) => {
      this.game.mulle.user.Junk.yard[ p.part_id ] = { x: p.x, y: p.y }
    })

    this.game.mulle.user.save()

    super.shutdown()
  }
}

export default YardState
