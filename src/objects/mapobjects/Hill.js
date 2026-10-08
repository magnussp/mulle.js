'use strict'

const MapObject = {}

MapObject.onEnterInner = function () {
  console.log('enter hill, custom object', this)

  const bigHill = this.opt.HillType === '#BigHill'
  const okToPass = this.game.mulle.user.Car.criteria[bigHill ? 'BigHill' : 'SmallHill']

  if (!okToPass) {
    // Engine too weak
    if (!this.hillSound || !this.hillSound.isPlaying) {
      this.hillSound = this.game.mulle.playAudio(this.def.Sounds[bigHill ? 0 : 1])
    }
  } else if (bigHill) {
    this.game.state.getCurrentState().awardMedal(this.def.SetWhenDone.Medals[0])
  }
}

export default MapObject
