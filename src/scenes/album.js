/* global Phaser */
import MulleState from './base'

import TextInput from '../objects/TextInput'
import MulleSprite from '../objects/sprite'
import MulleBuildCar from '../objects/buildcar'
import MulleButton from '../objects/button'
import MulleFileBrowser from '../objects/MulleFileBrowser'
import LoadSaveCar from '../util/LoadSaveCar'
import DirectorHelper from '../objects/DirectorHelper'

/**
 * Album UI
 */
class AlbumState extends MulleState {
  /**
   * Create a sprite with director position
   * @param {string} dir Director movie
   * @param {string|int} num Director number or name
   * @returns {Phaser.Sprite}
   */
  positionSprite (dir, num) {
    const image = this.game.mulle.getDirectorImage(dir, num)
    const x = 320 - image.frame.regpoint.x
    const y = 240 - image.frame.regpoint.y
    return new Phaser.Sprite(this.game, x, y, image.key, image.name)
  }

  init (mode) {
    this.mode = mode
  }

  preload () {
    this.DirResource = '06.DXR'
    super.preload()
    this.game.load.pack('album', 'assets/album.json', null, this)
    this.game.load.pack('fileBrowser', 'assets/fileBrowser.json', null, this)
  }

  buildPages () {
    let pageNumSprite

    for (let page = 1; page <= 12; page++) {
      if (this.loadSave.isSaved(page)) { // Is a car saved on this page?
        pageNumSprite = this.positionSprite(this.DirResource, page + 60)
      } else {
        pageNumSprite = this.positionSprite(this.DirResource, page + 48)
      }

      if (page === this.selectedPage) {
        if (this.pagenumSpriteSelected) {
          this.pagenumSpriteSelected.destroy()
        }

        this.pagenumSpriteSelected = this.positionSprite(this.DirResource, page + 72)
        this.game.add.existing(this.pagenumSpriteSelected)
      } else {
        const button = MulleButton.fromRectangle(this.game, pageNumSprite.x, pageNumSprite.y, 40, 40, {
          click: () => {
            this.setPage(page)
          }
        })

        this.game.add.existing(button)
      }

      this.game.add.existing(pageNumSprite)
    }
  }

  /**
   * Select album page
   * @param page
   */
  setPage (page) {
    if (this.selectedPage !== undefined && this.selectedPage !== page) {
      this.game.mulle.playAudio('06e003v0')
    }
    this.saveName()
    this.selectedPage = page
    this.showSavedCar(page)
    this.buildPages()
  }

  /**
   * The name of a pasted car is saved when changing page or closing the album,
   * like saveIfNecessary in the Dir script of 06.DXR
   */
  saveName () {
    if (this.namePage === undefined || this.namePage === null) return
    const name = this.carName.value()
    this.loadSave.setName(this.namePage, name)
    if (this.namePageIsCurrentCar) this.game.mulle.user.Car.Name = name
    this.namePage = null
  }

  /**
   * First page to show, the first free page when saving
   * @return {int}
   */
  startPage () {
    if (this.mode !== 'save') return 1
    for (let page = 1; page <= 12; page++) {
      if (!this.loadSave.isSaved(page)) return page
    }
    return 1
  }

  /**
   * Show a car in the album
   */
  albumCar (parts = null) {
    if (this.albumCarImage) {
      this.albumCarImage.destroy()
    }

    this.albumCarImage = new MulleBuildCar(this.game, 320, 240, parts, true, false)
    this.background_layer.add(this.albumCarImage)
  }

  /**
   * Picture in the left corner ready for pasting
   */
  showPasteFrame () {
    this.imageFrame = new MulleButton(this.game, 67, 401, {
      imageDefault: [this.DirResource, 159],
      click: () => { this.pasteCar() }
    })

    this.game.add.existing(this.imageFrame)

    this.pasting_car = new MulleBuildCar(this.game, 0, 400, null, true, false)
    this.pasting_car.height = this.pasting_car.height / 2
    this.pasting_car.width = this.pasting_car.width / 2
    this.game.add.existing(this.pasting_car)
  }

  /**
   * Paste a car in the album
   */
  pasteCar () {
    if (this.confirmDialog) return
    if (this.loadSave.isSaved(this.selectedPage)) {
      this.confirmOverwrite(() => this.doPasteCar())
    } else {
      this.doPasteCar()
    }
  }

  doPasteCar () {
    this.imageFrame.destroy()
    this.imageFrame.displaySprite.visible = false
    this.pasting_car.destroy()
    this.albumCar()
    this.showMedals(this.game.mulle.user.Car.Medals)

    this.game.mulle.playAudio('06e001v0', () => this.game.mulle.playAudio('06d002v0'))

    // Write the name, it is saved when changing page or closing the album
    this.carName.text('')
    this.loadSave.saveCurrentCar(this.selectedPage)
    this.loadSave.setName(this.selectedPage, '')
    this.namePage = this.selectedPage
    this.namePageIsCurrentCar = true
    this.buildPages()
  }

  /**
   * Ask before a saved car is replaced, like ReplaceScript in 06.DXR
   * @param {function} onYes
   */
  confirmOverwrite (onYes) {
    const dialog = this.game.add.group()
    this.confirmDialog = dialog
    const background = new MulleSprite(this.game, 528, 437)
    background.setDirectorMember(this.DirResource, 160)
    dialog.add(background)

    const close = () => {
      dialog.destroy()
      this.confirmDialog = null
    }
    const yes = MulleButton.fromRectangle(this.game, 469, 433, 55, 31, { click: () => { close(); onYes() } })
    const no = MulleButton.fromRectangle(this.game, 530, 432, 55, 31, { click: close })
    dialog.add(yes)
    dialog.add(no)

    this.game.mulle.playAudio('06d004v0')
  }

  /**
   * Download the car on the page as a file in the format of the original game
   */
  exportCar () {
    if (!this.loadSave.isSaved(this.selectedPage)) return
    this.saveName()
    const [, , name] = this.loadSave.loadCar(this.selectedPage)
    const blob = new Blob([this.loadSave.exportCar(this.selectedPage)], { type: 'text/plain' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = (name || 'mulle') + '.car'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  /**
   * Build the saved car
   * @param {int} page Album page
   */
  buildSavedCar (page) {
    let partId
    const [parts, medals, name, cacheList] = this.loadSave.loadCar(page)
    const savedParts = parts.map(String)
    // Place parts of the old car that are not used in a random junk pile, like trash()
    const pile = 'Pile' + this.game.rnd.integerInRange(1, 6)
    for (partId of this.game.mulle.user.Car.Parts) {
      if (!savedParts.includes(String(partId))) {
        if (this.game.mulle.PartsDB[partId].master) { // Un-morph parts
          partId = this.game.mulle.PartsDB[partId].master
        }

        // Place the part in the junk yard
        this.game.mulle.user.addPart(pile, partId, null, true)
      }
    }

    this.removeParts(parts) // Remove the parts from wherever they are
    this.game.mulle.user.Car.Parts = []
    for (partId of parts) {
      this.game.mulle.user.Car.Parts.push(partId)
    }
    this.game.mulle.user.Car.Medals = [...medals]
    this.game.mulle.user.Car.Name = name
    this.game.mulle.user.Car.CacheList = [...cacheList]
    this.game.mulle.user.Car.updateStats()
    this.close()
  }

  /**
   * Show the saved car in the album
   * @param {int} page Album page
   */
  showSavedCar (page) {
    if (this.loadSave.isSaved(page)) {
      const [parts, medals, name] = this.loadSave.loadCar(page)
      this.albumCar(parts)
      this.parts = parts
      this.carName.text(name)
      this.showMedals(medals)
      if (this.mode === 'load') this.fetchButton.show()
    } else {
      if (this.albumCarImage) { this.albumCarImage.destroy() }
      if (this.mode === 'load') { this.fetchButton.hide() }
      if (this.medals) { this.medals.destroy(true) }
    }
  }

  /**
   * Remove a part from junk piles, shop floor and yard
   * @param {int} partId Part id
   */
  removePart (partId) {
    if (this.game.mulle.PartsDB[partId].master) { // Un-morph parts
      partId = this.game.mulle.PartsDB[partId].master
    }

    for (const pile in this.game.mulle.user.Junk) {
      if (partId in this.game.mulle.user.Junk[pile]) {
        console.log(`Remove part ${partId} from ${pile}`)
        delete this.game.mulle.user.Junk[pile][partId]
      }
    }
  }

  /**
   * Remove multiple parts from junk piles, shop floor and yard
   * @param {array} parts Array with part ids
   */
  removeParts (parts) {
    for (const part of parts) {
      this.removePart(part)
    }
  }

  importCar () {
    this.browser = new MulleFileBrowser(this.game, (data) => {
      this.loadSave.importCar(this.selectedPage, data)
      this.showSavedCar(this.selectedPage)
    })
    this.album_ui.add(this.browser)
  }

  showMedals (medals) {
    if (this.medals) { this.medals.destroy(true) }
    this.medals = this.game.add.group()
    // Medal images in the same order as MedalBH in 05.DXR
    const members = [21, 22, 23, 24, 27, 26]
    for (const medal of medals) {
      const sprite = new MulleSprite(this.game, 570, 65 + 62 * (medal - 1))
      sprite.setDirectorMember(this.DirResource, members[medal - 1])
      this.medals.add(sprite)
    }
  }

  create () {
    this.game.mulle.addAudio('album')
    super.create()
    this.loadSave = new LoadSaveCar(this.game)

    this.background_layer = this.game.add.group()
    this.album_ui = this.game.add.group()
    this.background = new MulleSprite(this.game, 320, 240)
    this.background.setDirectorMember(this.DirResource, 93)
    this.background_layer.add(this.background)

    // Car name
    this.name_input = DirectorHelper.sprite(this.game, 210, 427, this.DirResource, 101, false, false)
    this.album_ui.add(this.name_input)
    this.carName = new TextInput(this.game, this.name_input.x + 5, this.name_input.y + 5, 203, 20)
    this.carName.id('car_name')

    if (this.mode === 'save') {
      this.game.mulle.playAudio('06e002v0', () => {
        this.game.mulle.playAudio('06d001v0')
      })

      this.showPasteFrame()

      this.export_button = new MulleButton(this.game, 487, 413, {
        imageDefault: ['06.DXR', 164],
        click: () => this.exportCar()
      })

      this.game.add.existing(this.export_button)
    } else { // Show picture
      // The album is empty
      this.game.mulle.playAudio(this.loadSave.count() ? '07d001v0' : '07d003v0')

      this.fetchButton = new MulleButton(this.game, 76, 400, {
        imageDefault: [this.DirResource, 162],
        click: () => {
          this.buildSavedCar(this.selectedPage)
        }
      })

      this.album_ui.add(this.fetchButton)
      this.carName.input.readOnly = true

      this.importButton = new MulleButton(this.game, 487, 413, {
        imageDefault: ['06.DXR', 161],
        click: () => {
          this.importCar()
        }
      })
      this.album_ui.add(this.importButton)
    }

    this.close_button = new MulleButton(this.game, 554, 414, {
      imageDefault: ['06.DXR', 153],
      click: () => {
        console.log('Close album')
        this.close()
      }
    })

    this.album_ui.add(this.close_button)

    // Mulle explains the photo after 15 frames over it
    const photo = this.mode === 'save' ? this.imageFrame : this.fetchButton
    let hoverTimer = null
    photo.events.onInputOver.add(() => {
      hoverTimer = this.game.time.events.add(15 * 1000 / 12, () => {
        this.game.mulle.playAudio(this.mode === 'save' ? '06d007v0' : '07d005v0')
      })
    })
    photo.events.onInputOut.add(() => {
      if (hoverTimer) this.game.time.events.remove(hoverTimer)
    })
    photo.events.onInputDown.add(() => {
      if (hoverTimer) this.game.time.events.remove(hoverTimer)
    })

    this.setPage(this.startPage())
  }

  close () {
    this.saveName()
    this.game.mulle.playAudio('06e003v0')
    this.game.state.start('garage')
  }

  shutdown (game) {
    // The state is reused, a cutscene from this visit must not be destroyed again next time
    this.cutscene = null
    this.carName.remove()
    super.shutdown(game)
  }
}

export default AlbumState
