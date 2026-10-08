import GiftSceneState from './giftscene'

/**
 * Ludde Labb
 * 91.DXR
 *
 * Visiting Ludde completes mission 6, the first visit gives a part.
 */
class LuddeLabbState extends GiftSceneState {
  get config () {
    return {
      dirResource: '91.DXR',
      pack: 'luddelabb',
      missionId: 6,
      partId: 99,
      car: [524, 414],
      part: [372, 368],
      buffa: [432, 355],
      sounds: { background: '91e001v0', done: '91d007v0', gift: ['91d001v0', '91d003v0'] },
      framesAfterBlink: 10
    }
  }
}

export default LuddeLabbState
