class LoadSaveCar {
  /**
   * @param {Phaser.Game} game
   */
  constructor (game) {
    this.game = game
    if (!this.game.mulle.user.savedCars) {
      this.game.mulle.user.savedCars = []
    }
  }

  /**
   * Parse a string from an exported car file from the original game
   * @param {string} carDataString Car file string content
   * @return {array}
   */
  static parseOriginalGame (carDataString) {
    carDataString = carDataString.replace(/#([a-zA-Z0-9]+):/g, '"$1":')
    carDataString = '{' + carDataString.substring(1, carDataString.length - 1) + '}'
    carDataString = carDataString.replace('[:]', '[]')
    carDataString = carDataString.replace(/("cacheList": )\[(.+)]/, '$1{$2}')
    console.log(carDataString)
    return JSON.parse(carDataString)
  }

  /**
   * Make a car file in the format of the original game
   * @param {int} page Album page
   * @return {string}
   */
  exportCar (page) {
    const [parts, medals, name, cacheList] = this.loadCar(page)
    const cache = cacheList.length ? '[' + cacheList.map(c => c + ': 1').join(', ') + ']' : '[:]'
    return `[#parts: [${parts.join(', ')}], #name: "${name.replace(/"/g, '')}", #medals: [${medals.join(', ')}], #cacheList: ${cache}]`
  }

  /**
   * Save a car
   * @param {int} page Album page to save the car
   * @param {array} parts Parts on car
   * @param {array} medals Car medals
   * @param {string} name Car name
   * @param {array} cacheList Things the car has done, like #ExtraTank
   */
  saveCar (page, parts, medals, name = '', cacheList = []) {
    console.log(`Save car to page ${page}`)
    this.game.mulle.user.savedCars[page] = { parts: [...parts], medals: [...medals], name, cacheList: [...cacheList] }
    this.game.mulle.user.save()
  }

  /**
   * Save the current car
   * @param {int} page Album page to save the car
   */
  saveCurrentCar (page) {
    this.saveCar(page,
      this.game.mulle.user.Car.Parts,
      this.game.mulle.user.Car.Medals,
      this.game.mulle.user.Car.Name,
      this.game.mulle.user.Car.CacheList)
  }

  /**
   * Set the name of a saved car
   * @param {int} page
   * @param {string} name
   */
  setName (page, name) {
    if (!this.isSaved(page)) return
    this.game.mulle.user.savedCars[page].name = name
    this.game.mulle.user.save()
  }

  loadCar (page) {
    if (!this.isSaved(page)) throw new Error('No car saved on page ' + page)

    console.log(this.game.mulle.user.savedCars[page])
    if (!('parts' in this.game.mulle.user.savedCars[page])) {
      this.saveCar(page, this.game.mulle.user.savedCars[page], [])
    }

    const { parts, medals, name, cacheList } = this.game.mulle.user.savedCars[page]
    return [parts, medals, name || '', cacheList || []]
  }

  /**
   * Import a car from a saved file
   * @param {int} page Album page to save the car
   * @param {string} carDataString String content from an exported car file
   */
  importCar (page, carDataString) {
    const { parts, name, medals, cacheList } = LoadSaveCar.parseOriginalGame(carDataString)
    const cache = cacheList && !Array.isArray(cacheList) ? Object.keys(cacheList).map(c => '#' + c.replace(/^#/, '')) : []
    this.saveCar(page, parts, medals, name, cache)
  }

  /**
   * Is a car saved on this page?
   * @param {int} page Page number
   * @return {boolean}
   */
  isSaved (page) {
    return !!this.game.mulle.user.savedCars[page]
  }

  /**
   * Number of saved cars
   * @return {int}
   */
  count () {
    let count = 0
    for (let page = 1; page <= 12; page++) {
      if (this.isSaved(page)) count++
    }
    return count
  }
}

export default LoadSaveCar
