/* global alert, Phaser */
/**
 * GarageState
 * @module GarageState
 */
'use strict'

import MulleState from './base'

import MulleSprite from '../objects/sprite'
import MulleBuildCar from '../objects/buildcar'
import MulleActor from '../objects/actor'
import MulleButton from '../objects/button'
import MulleCarPart from '../objects/carpart'
import MulleToolbox from '../objects/toolbox'
import SubtitleLoader from '../objects/SubtitleLoader'


/**
 * GarageState
 * @extends MulleState
 * @property {array} enterParts Part on the car when entering the garage
 */
class GarageState extends MulleState {
  preload () {
    this.DirResource = '03.DXR'
    super.preload()

    this.game.load.pack('garage', 'assets/garage.json', null, this)
    this.game.load.json('partNames', 'data/part_names.json')
    this.subtitles = new SubtitleLoader(this.game, 'garage', ['english'])
    this.subtitles.preload()
    this.subtitles.preload('carparts')
  }

  /**
   * Has the car changed in the garage?
   * @returns {boolean}
   */
  hasCarChanged () {
    const currentParts = this.game.mulle.user.Car.Parts
    if (currentParts.length !== this.enterParts.length)
      return true

    for (var i = 0, l = currentParts.length; i < l; i++)
      if (currentParts[i] !== this.enterParts[i]) {
        console.log('Car has changed, different parts', i, currentParts[i], this.enterParts[i])
        return true
      }
    return false
  }

  /**
   * Figge visits the garage with parts, like checkFigge and FiggeShopBH in 03.DXR.
   * A click interrupts the visit, Figge then says goodbye and leaves.
   */
  figge () {
    const b = '03.DXR'
    const visit = { sounds: [], figge: null, interrupted: false, partsGiven: false, leaving: false }

    const play = (id, onStop) => {
      const sound = this.game.mulle.playAudio(id, () => { if (!visit.interrupted) onStop() })
      if (sound) visit.sounds.push(sound)
    }

    const giveParts = () => {
      if (visit.partsGiven) return
      visit.partsGiven = true
      this.figgeGiveParts()
    }

    // Other input is blocked during the visit, a click interrupts it
    const blocker = this.game.add.graphics(0, 0)
    blocker.beginFill(0x000000, 0)
    blocker.drawRect(0, 0, 640, 480)
    blocker.endFill()
    blocker.inputEnabled = true
    blocker.input.priorityID = 1000

    const leave = () => {
      if (visit.leaving) return
      visit.leaving = true
      const figge = visit.figge
      const close = () => {
        if (figge) figge.destroy()
        this.game.mulle.actors.figge = null
        this.door_junk.onInputOutHandler()
        // door, then the truck drives away
        this.game.mulle.playAudio('02e015v0', () => {
          this.game.mulle.playAudio('03e010v0')
          blocker.destroy()
        })
      }
      if (figge) {
        figge.animations.play('goOut').onComplete.addOnce(close)
      } else {
        close()
      }
    }

    const bye = () => {
      // jajamänsan
      visit.figge.talk('03d046v0', () => leave())
    }

    blocker.events.onInputDown.addOnce(() => {
      if (visit.leaving) return
      visit.interrupted = true
      for (const sound of visit.sounds) sound.stop()
      if (visit.figge) visit.figge.resetTalk()
      this.game.mulle.actors.mulle.resetTalk()
      giveParts()
      visit.interrupted = false
      if (visit.figge) {
        bye()
      } else {
        leave()
      }
    })

    // the truck arrives
    play('03e009v0', () => {
      // narrator
      play('03d043v0', () => {
        giveParts()

        const figge = new MulleActor(this.game, 320, 240, 'figgeDoor')
        // FiggeAnimChart, frame 1 is member 81
        const frames = (list) => list.map(f => [b, 81 + f - 1])
        figge.addAnimation('freeze', frames([5]), 12, false)
        figge.addAnimation('talkFigge', frames([9, 8, 7, 6, 7, 8, 9, 10, 11, 10, 9, 10, 9, 12, 13]), 12, true)
        figge.addAnimation('goOut', frames([5, 4, 3, 3, 2, 1]), 12, false)
        figge.talkAnimation = 'talkFigge'
        figge.silenceAnimation = 'freeze'
        this.game.add.existing(figge)
        this.game.world.bringToTop(blocker)
        this.game.mulle.actors.figge = figge
        visit.figge = figge

        this.door_junk.onInputOverHandler()

        // door
        play('02e016v0', () => {
          figge.animations.play('enter').onComplete.addOnce(() => {
            figge.animations.play('freeze')
            // hörru
            figge.talk('03d044v0', () => {
              const mulle = this.game.mulle.actors.mulle
              mulle.silenceAnimation = 'idle'
              mulle.talkAnimation = 'talkRegular'

              // ser man på
              mulle.talk('03d045v0', () => {
                mulle.silenceAnimation = 'lookPlayer'
                mulle.talkAnimation = 'talkPlayer'
                bye()
              })
            })
          })
        })
      })
    })
  }

  /**
   * The telephone rings and Mulle gets a mission, like kickTelephone in the Missions script
   * @param {Object} mission
   */
  telephoneMission (mission) {
    console.log('Telephone mission', mission)
    this.game.input.enabled = false

    // The small phone on the wall shakes while it rings
    const phone = new MulleSprite(this.game, 319, 240)
    phone.setDirectorMember('03.DXR', 102)
    this.game.add.existing(phone)
    const shake = this.game.time.events.loop(1000 / 12, () => {
      phone.x = phone.x === 319 ? 317 : 319
    })

    this.game.mulle.playAudio('03e001v0', () => {
      this.game.time.events.remove(shake)
      phone.destroy()

      const bigPhone = new MulleSprite(this.game, 320, 240)
      bigPhone.setDirectorMember('03.DXR', 100)
      this.game.add.existing(bigPhone)

      this.game.mulle.playAudio(mission.sound, () => {
        bigPhone.destroy()
        this.game.mulle.missions.missionGiven()
        this.game.input.enabled = true
      })
    })
  }

  figgeHasParts () {
    this.game.mulle.user.calculateParts()
    return this.game.mulle.user.availableParts.JunkMan.length > 0
  }

  figgeGiveParts () {
    if (this.game.mulle.user.availableParts.JunkMan.length > 0) {
      for (let i = 0; i < 3; i++) {
        const partId = this.game.mulle.user.availableParts.JunkMan[i]

        if (!partId) break

        this.game.mulle.user.addPart('yard', partId, null, true)

        console.log('figge add part', partId)
      }

      this.game.mulle.user.save()

      return true
    }

    return false
  }

  makePart (partId, x, y) {
    const cPart = new MulleCarPart(this.game, partId, x, y)

    cPart.car = this.car
    cPart.junkParts = this.junkParts

    cPart.dropTargets.push([this.door_junk, (d) => {
      d.destroy()
      this.game.mulle.user.Junk.Pile1[partId] = { x: this.game.rnd.integerInRange(0, 640), y: 240 }
      this.game.mulle.playAudio('00e004v0')
      return true
    }])

    cPart.dropTargets.push([this.door_side, (d) => {
      d.destroy()
      this.game.mulle.user.Junk.yard[partId] = { x: this.game.rnd.integerInRange(0, 640), y: 240 }
      this.game.mulle.playAudio('00e004v0')
      return true
    }])

    cPart.dropTargets.push([this.door_garage, (d) => {
      d.destroy()
      this.game.mulle.user.Junk.yard[partId] = { x: this.game.rnd.integerInRange(0, 640), y: 240 }
      this.game.mulle.playAudio('00e004v0')
      return true
    }])

    this.junkParts.addChild(cPart)

    return cPart
  }

  create () {
    super.create()

    this.car = null
    this.junkPile = null
    this.junkParts = null

    this.door_junk = null

    this.mulleActor = null

    this.toolbox = null
    this.popupMenu = null

    this.door_junk = null
    this.door_garage = null
    this.door_side = null

    this.game.physics.startSystem(Phaser.Physics.ARCADE)
    this.game.physics.arcade.gravity.y = 800

    this.game.mulle.addAudio('garage')
    this.subtitles.load()
    this.subtitles.load('carparts')

    // this.game.mulle.user.calculateParts();
    this.enterParts = [...this.game.mulle.user.Car.Parts]

    const background = new MulleSprite(this.game, 320, 240)
    // background.setFrameId('03b001v0');
    background.setDirectorMember('03.DXR', 33)

    this.game.add.existing(background)

    this.door_junk = new MulleButton(this.game, 320, 240, {
      imageDefault: ['03.DXR', 34],
      imageHover: ['03.DXR', 35],
      soundDefault: '02e015v0',
      soundHover: '02e016v0',
      click: () => {
        this.game.mulle.activeCutscene = 70
        this.game.state.start('junk')
      }
    })

    this.door_junk.cursor = 'Click'
    this.door_junk.cursorHover = 'Click'
    this.door_junk.cursorDrag = 'MoveIn'

    /*
    this.game.mulle.cursor.addHook(door_junk, function( obj, state, event) {

      this.game.add.existing(this.door_junk)

      if (event.dragging) return 'cursor-drag_forward'

      if (state == 'over') {
        return 'point'
      }

      return false
    })
    */

    this.game.add.existing(this.door_junk)

    this.door_garage = new MulleButton(this.game, 320, 240, {
      imageDefault: ['03.DXR', 36],
      imageHover: ['03.DXR', 37],
      soundDefault: '02e015v0',
      soundHover: '02e016v0',
      click: () => {
        if (!this.game.mulle.user.Car.isRoadLegal(true)) return

        this.game.mulle.activeCutscene = 67
        this.game.mulle.user.toYardThroughDoor = false
        this.game.state.start('yard')

        if (this.hasCarChanged()) {
          if (isNaN(this.game.mulle.user.NrOfBuiltCars)) {
            this.game.mulle.user.NrOfBuiltCars = 0
          }

          this.game.mulle.user.NrOfBuiltCars += 1
          this.game.mulle.user.figgeIsComing = true
          this.game.mulle.user.missionIsComing = true
          console.log('Increase NrOfBuiltCars to ', this.game.mulle.user.NrOfBuiltCars)
        }
      }
    })

    this.door_garage.cursor = 'Left'
    this.door_garage.cursorHover = 'Left'
    this.door_garage.cursorDrag = 'MoveLeft'

    // door_garage.moveJunk = 'yard';

    this.game.add.existing(this.door_garage)

    this.door_side = new MulleButton(this.game, 320, 240, {
      imageDefault: ['03.DXR', 38],
      imageHover: ['03.DXR', 39],
      soundDefault: '02e015v0',
      soundHover: '02e016v0',
      click: () => {
        this.game.mulle.activeCutscene = 68
        this.game.mulle.user.toYardThroughDoor = true
        this.game.state.start('yard')
      }
    })

    this.door_side.cursor = 'Left'
    this.door_side.cursorHover = 'Left'
    this.door_side.cursorDrag = 'MoveLeft'

    // door_side.moveJunk = 'yard';

    this.game.add.existing(this.door_side)

    this.car_camera = MulleButton.fromRectangle(this.game, 589, 62, 41, 117, {
      imageHover: ['03.DXR', 104],
      soundHover: '02e011v0',
      click: () => {
        this.game.mulle.activeCutscene = 86
        this.game.state.start('album', true, false, 'save')
      }
    })
     this.game.add.existing(this.car_camera)

    this.album = MulleButton.fromRectangle(this.game, 383, 41, 50, 28, {
      imageHover: ['03.DXR', 103],
      soundHover: '02e011v0',
      click: () => {
        this.game.mulle.activeCutscene = 83
        this.game.state.start('album', true, false, 'load')
      }
    })
    this.game.add.existing(this.album)

    this.car = new MulleBuildCar(this.game, 368, 240, null, false)
    this.game.add.existing(this.car)

    this.car.onDetach.add((partId, newId, newPos) => {
      const part = this.makePart(newId, newPos.x, newPos.y)

      part.justDetached = true

      part.position.add(part.regPoint.x, part.regPoint.y)

      part.input.startDrag(this.game.input.activePointer)

      this.game.mulle.playAudio(part.sound_attach)
    })

    this.mulleActor = new MulleActor(this.game, 118, 188, 'mulleDefault')
    this.game.add.existing(this.mulleActor)
    this.game.mulle.actors.mulle = this.mulleActor

    // this.mulleActor.talk('20d001v0');
    // console.log('actor', this.mulleActor);

    // spawn junk parts
    this.junkParts = this.game.add.group()
    this.junkParts.pileName = 'shopFloor'
    this.car.junkParts = this.junkParts

    for (const partId in this.game.mulle.user.Junk.shopFloor) {
      const pos = this.game.mulle.user.Junk.shopFloor[partId]

      this.makePart(partId, pos.x, pos.y)
    }

    console.log('Built cars', this.game.mulle.user.NrOfBuiltCars)
    console.log('Built cars mod', this.game.mulle.user.NrOfBuiltCars % 3)
    // Missions by telephone, Figge comes first if it is his turn, like startMovie in 03.DXR
    const figgeTurn = this.game.mulle.user.NrOfBuiltCars % 3 === 0 && this.game.mulle.user.figgeIsComing
    const phoneMission = figgeTurn ? null : this.game.mulle.missions.getMission('#Telephone')
    if (phoneMission) {
      this.telephoneMission(phoneMission)
    } else if (figgeTurn && this.game.mulle.user.hasStuff('#Visited92') && this.figgeHasParts()) {
      // Figge only comes when Mulle has visited him and he has parts left, like checkFigge
      console.log('Figge is coming!')
      this.game.mulle.user.figgeIsComing = 0
      this.game.mulle.user.figgeBeenHere = 1
      this.figge()
    }

    // toolbox, manual
    this.toolbox = new MulleToolbox(this.game, 657, 432)
    this.game.add.existing(this.toolbox)

    this.toolbox.showToolbox = () => {
      this.blockSprite = new MulleSprite(this.game, 0, 0)
      this.blockSprite.width = 640
      this.blockSprite.height = 480
      this.blockSprite.inputEnabled = true
      this.blockSprite.input.useHandCursor = false
      this.game.add.existing(this.blockSprite)

      this.popupMenu = new MulleSprite(this.game, 320, 200)
      this.popupMenu.setDirectorMember('00.CXT', 84)
      this.game.add.existing(this.popupMenu)

      const rectList = {
        Trash: [165, 125, 245, 260],
        Diploma: [265, 127, 345, 264],
        quit: [365, 125, 445, 266],
        Cancel: [460, 210, 528, 365]
      }

      const soundList = {
        Trash: '09d001v0',
        quit: '09d003v0',
        Diploma: '09d002v0',
        Cancel: '09d004v0'
      }

      let currentAudio

      const funcList = {
        Trash: () => {
          this.car.trash()
        },
        Diploma: () => {
          this.game.mulle.activeCutscene = 81
          this.game.state.start('diploma', true, false, this.key)
        },
        Cancel: () => {
          this.toolbox.toggleToolbox(this.toolbox)
        },
        quit: () => {
          this.game.state.start('credits')
        }
      }

      this.popupMenuButtons = this.game.add.group()

      for (const n in rectList) {
        const r = rectList[n]

        const b = new Phaser.Button(this.game, r[0], r[1] - 40)
        b.width = r[2] - r[0]
        b.height = r[3] - r[1]

        b.onInputOver.add(() => {
          if (currentAudio) currentAudio.stop()
          currentAudio = this.game.mulle.playAudio(soundList[n])
        })

        b.onInputDown.add(() => {
          if (currentAudio) currentAudio.stop()
          funcList[n]()
        })

        this.popupMenuButtons.addChild(b)
      }

      return true
    }

    this.toolbox.hideToolbox = () => {
      this.blockSprite.destroy()

      this.popupMenu.destroy()

      this.popupMenuButtons.destroy()

      return true
    }

    // spawn parts cheat

    if (this.game.mulle.cheats) {
      const partNames = this.game.cache.getJSON('partNames')
      document.getElementById('cheats').innerHTML = ''

      const b_figge = document.createElement('button')
      b_figge.innerHTML = 'Figge'
      b_figge.className = 'button'
      b_figge.addEventListener('click', () => {
        this.figge()
      })
      document.getElementById('cheats').appendChild(b_figge)

      for (const partId in this.game.mulle.PartsDB) {
        const partData = this.game.mulle.PartsDB[partId]

        if (partData.master) continue

        const has = this.game.mulle.user.hasPart(partId)

        const b = document.createElement('button')
        b.innerHTML = (partNames && partNames[partId]) ? '(' + partId + ') ' + partNames[partId] : partId
        b.className = 'button'

        if (has) b.setAttribute('style', 'background: #222')

        b.addEventListener('click', () => {
          if (has) {
            for (const pile in this.game.mulle.user.Junk) {
              if (partId in this.game.mulle.user.Junk[pile]) {
                console.log(`Remove part ${partId} from ${pile}`)
                delete this.game.mulle.user.Junk[pile][partId]
              }
            }
          }

          this.makePart(partId, 320, 240)
        })

        document.getElementById('cheats').appendChild(b)
      }
    }
  }

  shutdown () {
    console.log('shutdown garage')

    this.game.input.enabled = true

    this.game.mulle.user.Junk.shopFloor = {}

    this.junkParts.forEach((p) => {
      this.game.mulle.user.Junk.shopFloor[p.part_id] = { x: p.x, y: p.y }
    })

    this.game.mulle.user.save()

    this.game.mulle.net.send({ parts: this.game.mulle.user.Car.Parts })

    this.game.mulle.actors.mulle = null

    document.getElementById('cheats').innerHTML = ''

    super.shutdown()
  }
}

export default GarageState
