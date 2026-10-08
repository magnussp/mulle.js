/**
 * Idle animation like #Wait in SpriteAnimBH: hold the still frame for a random
 * number of frames, then play one of the actions, and repeat while not talking.
 * Runs at the 12 fps of the movies.
 *
 * @param {Phaser.Game} game
 * @param {MulleSprite|MulleActor} sprite
 * @param {Object} options
 * @param {string} options.still Animation with the still frame
 * @param {Array<{animation: string, sound: (string|undefined)}>} options.actions Actions to choose from
 * @param {int} options.min Minimum number of frames to hold
 * @param {int} options.max Maximum number of frames to hold
 */
function idleLoop (game, sprite, { still, actions, min, max }) {
  const frame = 1000 / 12

  const next = () => {
    if (!sprite.alive) return
    game.time.events.add(game.rnd.integerInRange(min + 1, max) * frame, () => {
      if (!sprite.alive) return
      if (sprite.isTalking) {
        next()
        return
      }
      const action = game.rnd.pick(actions)
      if (action.sound) game.mulle.playAudio(action.sound)
      const animation = sprite.animations.play(action.animation)
      animation.onComplete.addOnce(() => {
        if (!sprite.isTalking) sprite.animations.play(still)
        next()
      })
    })
  }

  sprite.animations.play(still)
  next()
}

export default idleLoop
