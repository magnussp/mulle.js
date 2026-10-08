import GiftSceneState from './giftscene'
import SubtitleLoader from '../objects/SubtitleLoader'

/**
 * Viola
 * 89.DXR
 *
 * Visiting Viola completes mission 7, the first visit gives a part.
 */
class ViolaState extends GiftSceneState {
  get config () {
    return {
      dirResource: '89.DXR',
      pack: 'viola',
      missionId: 7,
      partId: 172,
      car: [446, 368],
      part: [3, 456],
      buffa: [358, 319],
      sounds: { background: '89e001v0', done: '89d007v0', gift: ['89d001v0', '89d003v0'] },
      framesAfterBlink: 1,
      // FireAnimChart blink
      decoration: { x: 245, y: 154, frames: [18, 18, 19, 19, 19], firstGiftOnly: false }
    }
  }

  preload () {
    super.preload()
    this.subtitles = new SubtitleLoader(this.game, 'viola', ['english'])
    this.subtitles.preload()
  }

  create () {
    this.subtitles.load()
    super.create()
  }
}

export default ViolaState
