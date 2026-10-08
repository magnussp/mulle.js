import GiftSceneState from './giftscene'

/**
 * Doris Digital
 * 90.DXR
 *
 * Visiting Doris completes mission 4, the first visit gives a part.
 * 90e001v0: Game sound
 * 90d001v0: Doris intro by narrator
 * 90d003v0: After the game
 * 90d007v0: Revisit
 */
class DorisDigitalState extends GiftSceneState {
  get config () {
    return {
      dirResource: '90.DXR',
      pack: 'dorisdigital',
      missionId: 4,
      partId: 306,
      car: [446, 368],
      part: [82, 373],
      buffa: [275, 327],
      sounds: { background: '90e001v0', done: '90d007v0', gift: ['90d001v0', '90d003v0'] },
      framesAfterBlink: 4,
      // ComputerAnimChart blink, the third frame does not exist
      decoration: { x: 320, y: 240, frames: [18, 19, null], firstGiftOnly: true }
    }
  }
}

export default DorisDigitalState
