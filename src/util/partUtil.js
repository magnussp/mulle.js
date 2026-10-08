import MulleCarPart from '../objects/carpart'

class partUtil {

  /**
   *
   * @param {MulleGame|Phaser.Game} game
   */
  constructor (game) {
    this.game = game
  }

  /**
   *
   * @returns int
   */
  getPart () {
    console.log(this.game.mulle)
    if (this.game.mulle.SetWhenDone === undefined) {
      console.error('SetWhenDone is not defined, state not started from MapObject?')
      return 0
    }
    for (const partId of this.game.mulle.SetWhenDone.Parts) {
      if (partId === '#Random') {
        return this.game.mulle.user.getRandomPart()
      } else {
        if (!this.game.mulle.user.hasPart(partId)) return partId
      }
    }
  }

  /**
   *
   * @param partId
   * @param x
   * @param y
   * @param {boolean} noPhysics Disable physics, the part will not fall to the ground
   * @returns {MulleCarPart}
   */
  showPart (partId, x, y, noPhysics = false) {
    const part = new MulleCarPart(this.game, partId, x, y, noPhysics)
    part.input.inputEnabled = false
    part.input.disableDrag()
    return part
  }
}

export default partUtil
