import MulleState from './base'

import MulleSprite from '../objects/sprite'
import MulleActor from '../objects/actor'
// import MulleAudio from '../objects/audio'

import MulleSave from '../struct/savedata'

class MenuState extends MulleState {
  preload () {
    // this.game.load.pack('menu', 'assets/menu.json', null, this);
    this.game.load.pack('menu', 'assets/menu.json', null, this)
  }

  create () {
    this.game.mulle.addAudio('menu')

    var background = new MulleSprite(this.game, 320, 240)
    // background.setFrameId('11b001v0');
    background.setDirectorMember('10.DXR', 2)
    this.game.add.existing(background)

    var mulleBase = new MulleSprite(this.game, 139, 296)
    mulleBase.setDirectorMember('10.DXR', 125)
    this.game.add.existing(mulleBase)

    const m = '10.DXR'
    // MulleLoggAnimChart, frame 1 is member 127
    const logg = (list) => list.map(f => [m, 127 + f - 1])
    var mulleHead = new MulleActor(this.game, 139, 296, 'mulleMenuHead')
    mulleHead.addAnimation('pek', logg([8, 7, 6, 5, 10, 11, 11, 11, 11, 12, 11, 11, 10, 5, 6, 7, 8]), 12, false)
    mulleHead.addAnimation('kli', logg([8, 7, 6, 5, 4, 3, 2, 1, 2, 3, 2, 1, 2, 3, 2, 1, 2, 3, 4, 5, 6, 7, 8]), 12, false)
    mulleHead.animations.play('idle')
    this.game.add.existing(mulleHead)
    this.mulleHead = mulleHead

    // MullePratAnimChart, frame 1 is member 115
    var mulleMouth = new MulleActor(this.game, 139, 296, 'mulleMenuMouth')
    mulleMouth.addAnimation('talk', [116, 117, 120, 118, 119].map(f => [m, f]), 12, true)
    mulleMouth.addAnimation('blinkOnce', [[m, 123], [m, 123]], 12, false)
    mulleMouth.talkAnimation = 'talk'
    mulleMouth.animations.play('idle')
    this.game.add.existing(mulleMouth)

    // Clicking Mulle is the same as pressing enter, like ClickMulle in 10.DXR
    const clickMulle = this.game.add.graphics(6, 145)
    clickMulle.beginFill(0x000000, 0)
    clickMulle.drawRect(0, 0, 282, 332)
    clickMulle.endFill()
    clickMulle.inputEnabled = true
    clickMulle.events.onInputUp.add(() => this.tryToLeave())

    this.addBuffa()

    // Drag a name to the trash to delete the user, like TrashBH in 10.DXR
    this.trash = new MulleSprite(this.game, 550, 375)
    this.trash.setDirectorMember('10.DXR', 169)
    this.game.add.existing(this.trash)
    this.mulleMouth = mulleMouth

    this.nameInput = document.createElement('input')
    this.nameInput.style.position = 'absolute'
    this.nameInput.style.top = '60px'
    this.nameInput.style.left = '90px'
    this.nameInput.style.border = 'none'
    this.nameInput.style.font = '28px serif'
    this.nameInput.style.padding = '4px'
    this.nameInput.style.background = 'none'
    this.nameInput.style.width = '180px'

    this.nameInput.addEventListener('keyup', (ev) => {
      if (ev.keyCode === 13) this.tryToLeave()
    })

    document.getElementById('player').appendChild(this.nameInput)

    this.userList = this.game.add.group()
    this.drawUserList()

    this.game.mulle.subtitle.setLines('11d001v0', 'swedish', [
      '- Hej!',
      '- Jag heter {Mulle Meck}!',
      '- Vill du bygga bilar med mig?',
      '- Skriv ditt namn så kan vi sätta igång.',
      '- Har du byggt förr så klickar du på ditt namn i {listan}.'
    ], 'mulle')

    this.game.mulle.subtitle.setLines('11d001v0', 'english', [
      '- Hello!',
      '- My name is {Mulle Meck}!',
      '- Do you want to build cars with me?',
      '- Write down your name so we can start.',
      "- If you've been here before, click your name in the {list}."
    ], 'mulle')

    this.game.mulle.playAudio('10e001v0', () => {
      if (!mulleMouth) return

      this.game.mulle.playAudio('10e002v0')

      mulleMouth.talk('11d001v0', null, c => {
        if (c[1] === 'silence') mulleMouth.animations.play('idle', 0)
        if (c[1] === 'talk') mulleMouth.animations.play('talkPlayer')

        if (c[1] === 'point') {
          mulleHead.animations.play('pek')
          console.log('do point')
        }
      })
      this.startIdle()
    })
  }

  /**
   * Start with the name in the field, a new user is created if the name is new.
   * The list holds 6 names, like AddLine in ScrollFieldBH
   */
  tryToLeave () {
    const name = this.nameInput.value.trim()
    if (!name) return

    if (!this.game.mulle.UsersDB[name]) {
      if (Object.keys(this.game.mulle.UsersDB).length >= 6) {
        // The list is full
        if (!this.mulleMouth.isTalking) this.mulleMouth.talk('11d008v0')
        return
      }
      const save = new MulleSave(this.game)
      save.UserId = name
      this.game.mulle.UsersDB[name] = save
      this.game.mulle.saveData()
    }

    this.selectUser(name)
  }

  /**
   * Mulle waits, blinks, scratches himself and says something now and then, like MulleLogBH
   */
  startIdle () {
    const talks = ['11d002v0', '11d003v0', '11d004v0', '11d005v0', '11d006v0']
    let lastTalk = null
    let busy = false
    this.game.time.events.loop(1000 / 12, () => {
      if (busy || this.mulleMouth.isTalking || this.game.rnd.integerInRange(1, 50) !== 1) return
      const choice = this.game.rnd.integerInRange(1, 8)
      busy = true
      if (choice === 1) {
        // Scratch, the head is hidden while the body moves
        this.mulleMouth.visible = false
        this.mulleHead.animations.play('kli').onComplete.addOnce(() => {
          this.mulleHead.animations.play('idle')
          this.mulleMouth.visible = true
          busy = false
        })
      } else if (choice <= 4) {
        this.mulleMouth.animations.play('blinkOnce').onComplete.addOnce(() => {
          this.mulleMouth.animations.play('idle')
          busy = false
        })
      } else {
        const sound = this.game.rnd.pick(talks.filter(t => t !== lastTalk))
        lastTalk = sound
        this.mulleMouth.talk(sound, () => { busy = false })
      }
    })
  }

  /**
   * Buffa sleeps next to Mulle, BuffaAnimChart Sleep with frame 1 as member 156
   */
  addBuffa () {
    const m = '10.DXR'
    const buffa = new MulleSprite(this.game, 491, 380)
    buffa.setDirectorMember(m, 161)
    this.game.add.existing(buffa)
    const sleep = () => {
      buffa.setDirectorMember(m, 161)
      this.game.time.events.add(this.game.rnd.integerInRange(13, 18) * 1000 / 12, () => {
        this.game.mulle.playAudio(this.game.rnd.pick(['00e037v0', '00e038v0']))
        const frames = [162, 162, 163, 163, 163, 163, 163, 163, 163, 162, 162]
        let i = 0
        this.game.time.events.repeat(1000 / 12, frames.length, () => {
          buffa.setDirectorMember(m, frames[i++])
          if (i === frames.length) sleep()
        })
      })
    }
    sleep()
  }

  selectUser (name) {
    this.game.mulle.user = this.game.mulle.UsersDB[name]

    // Like resultsFromScroller in 10.DXR, the intro is played after every login
    this.game.state.start('intro')
  }

  drawUserList () {
    this.userList.removeAll(true)

    let y = 60
    for (let name in this.game.mulle.UsersDB) {
      let text = this.game.add.text(350, y, name, { font: '24px serif' }, this.userList)
      text.inputEnabled = true
      text.input.enableDrag()
      const home = new Phaser.Point(text.x, text.y)

      text.events.onInputOver.add((e) => {
        this.game.canvas.className = 'cursor-point'
      }, this)

      text.events.onInputOut.add((e) => {
        this.game.canvas.className = ''
      }, this)

      text.events.onDragUpdate.add(() => {
        const overTrash = this.trash.getBounds().contains(this.game.input.x, this.game.input.y)
        if (overTrash && !this.overTrash) {
          this.game.mulle.playAudio('11e001v0')
          // Mulle warns about throwing the name away
          if (!this.mulleMouth.isTalking) this.mulleMouth.talk('11d007v0')
          this.trash.setDirectorMember('10.DXR', 170)
        } else if (!overTrash && this.overTrash) {
          this.trash.setDirectorMember('10.DXR', 169)
        }
        this.overTrash = overTrash
      }, this)

      text.events.onDragStop.add(() => {
        this.game.canvas.className = ''
        this.trash.setDirectorMember('10.DXR', 169)

        if (this.overTrash) {
          this.overTrash = false
          this.game.mulle.playAudio('11e002v0')
          if (this.game.mulle.user === this.game.mulle.UsersDB[name]) this.game.mulle.user = null
          delete this.game.mulle.UsersDB[name]
          this.game.mulle.saveData()
          // Redraw after the drag has ended
          this.game.time.events.add(0, this.drawUserList, this)
          return
        }

        if (home.distance(text.position) < 5) {
          // A click, not a drag
          this.selectUser(name)
        } else {
          text.position.copyFrom(home)
        }
      }, this)

      y += 25
    }
  }

  shutdown () {
    if (this.nameInput) this.nameInput.parentNode.removeChild(this.nameInput)

    this.game.sound.stopAll()

    // this.game.mulle.stopAudio('10e002v0');

    this.nameInput = null

    // this.game.mulle.stopAudio('02e010v0');
  }
}

export default MenuState
