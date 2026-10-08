/**
 * BootState
 * @module boot
 */

class BootState extends Phaser.State {
  preload () {
    this.game.load.image('loading', 'loading.png')
  }

  create () {
    this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL

    this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL
    this.game.scale.refresh()

    this.game.state.start('load')
  }
}

export default BootState
