/**
 * Missions given by telephone in the garage or by mail in the yard.
 * Ported from the Missions parent script in 00.CXT
 */
class MulleMissions {
  /**
   * @param {MulleGame} game
   * @param {Object} missionsDB Missions by id, from data/missions.hash.json
   */
  constructor (game, missionsDB) {
    this.game = game
    this.missionsDB = missionsDB

    /**
     * Order the missions are given in, MissionsDB in DATA.CST
     * @type {number[]}
     */
    this.missionList = [1, 2, 5, 7, 3, 8, 4, 6]

    /**
     * Mission waiting to be given
     * @type {Object|null}
     */
    this.currentMission = null
  }

  /**
   * A new mission comes every second time a new car has been built, like checkMissions
   * @return {Object|null} Mission waiting to be given
   */
  checkMissions () {
    const user = this.game.mulle.user
    if (this.user !== user) {
      // Another user has been loaded
      this.user = user
      this.currentMission = null
    }

    const builtCars = user.NrOfBuiltCars || 0
    if (this.currentMission || builtCars === 0 || builtCars % 2 !== 0 || !user.missionIsComing) {
      return this.currentMission
    }

    const missionId = this.missionList.find((id) => user.givenMissions.indexOf(id) === -1)
    if (missionId) {
      this.currentMission = this.missionsDB[missionId]
    }
    return this.currentMission
  }

  /**
   * Get the mission waiting to be given if it comes by telephone or by mail
   * @param {string} type '#Telephone' or '#Mail'
   * @return {Object|null}
   */
  getMission (type) {
    const mission = this.checkMissions()
    if (mission && mission.type === type && this.game.mulle.user.missionIsComing) {
      return mission
    }
    return null
  }

  /**
   * The current mission has been given to the user
   */
  missionGiven () {
    const user = this.game.mulle.user
    if (this.currentMission && user.givenMissions.indexOf(this.currentMission.MissionId) === -1) {
      user.givenMissions.push(this.currentMission.MissionId)
    }
    user.missionIsComing = false
    this.currentMission = null
    user.save()
  }
}

export default MulleMissions
