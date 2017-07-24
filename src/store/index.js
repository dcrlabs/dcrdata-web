import Vue from 'vue'
import Vuex from 'vuex'
import log from 'loglevel'
import axios from 'axios'
import helpers from '../helpers'
import Q from 'q'

Vue.use(Vuex)

var bestBlockPromise = axios.get(helpers.apiUrl + 'block/best')

export default new Vuex.Store({
  state: {
    bestBlock: null,
    bestBlockDeferred: Q.defer()
  },
  mutations: {
    setBestBlock (state, value) {
      state.bestBlock = value
    }
  },
  actions: {
    async init ({ commit, state }) {
      bestBlockPromise.then((response) => {
        state.bestBlockDeferred.resolve(response.data)
        log.info('bestBlock', response)
        commit('setBestBlock', response.data)
      })
    },
    async getBestBlock ({ dispatch, commit, state }) {
      return state.bestBlockDeferred.promise
    }
  }
})
