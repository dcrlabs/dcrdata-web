<template>
  <div>
    <nav class="navbar navbar-toggleable-md navbar-light bg-faded">
      <button class="navbar-toggler navbar-toggler-right" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <a class="navbar-brand" href="#">
        <img
          class="logo d-inline-block align-top"
          src="../assets/logo.svg"
        >
        <span class="logo-text">data</span>
      </a>
      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav mr-auto">
          <li class="nav-item">
            <router-link class="nav-link" to="/proof-of-stake">Proof of Stake</router-link>
          </li>
          <li class="nav-item">
            <router-link class="nav-link" to="/transactions">Transactions</router-link>
          </li>
        </ul>
        <span class="navbar-text" v-if="bestBlock">
          <small>best block</small> {{ bestBlock.height.toLocaleString() }}
        </span>
      </div>
    </nav>
    <div class="main-view">
      <div v-if='!bestBlock' class="root-loader">Loading data...</div>
      <transition>
        <router-view>
        </router-view>
      </transition>
    </div>
  </div>
</template>

<script>

import log from 'loglevel'

export default {
  data () {
    return {
      error: null
    }
  },
  components: {},
  created () {
    this.$store.dispatch('init')
    log.info('this.$store', this.$store)
  },
  computed: {
    bestBlock () {
      return this.$store.state.bestBlock
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.range-input {
  width: 100px;
}
.input-label {
  font-size: 12px;
}
a {
  color: #42b983;
}
</style>
