<template>
  <div v-if="bestBlock" class="container-fluid">

    <div class="row">
      <div class="col-4">
        <dl>
          <dt>Current Ticket Price</dt>
          <dd>{{ bestBlock.sdiff | currency('',1) }} DCR</dd>

          <dt>Avg Ticket Price</dt>
          <dd>{{ bestBlock.ticket_pool.valavg | currency('',1) }} DCR</dd>
        </dl>
      </div>
      <div class="col-4">
        <dl>
          <dt>Tickets in Pool</dt>
          <dd>{{ bestBlock.ticket_pool.size.toLocaleString() }}</dd>

          <dt>Value of Tickets</dt>
          <dd>{{ Math.round(bestBlock.ticket_pool.value).toLocaleString() }} DCR</dd>
        </dl>
      </div>
      <div class="col-4">
        <dl>
          <dt>Last block mined at:</dt>
          <dd>
            {{ bestBlock.time | formatUnixDate('MMMM Do YYYY, h:mm:ss a') }} <small class="no-wrap">{{ lastBlockTimeElapsed }}</small>
          </dd>
        </dl>
      </div>
    </div>

  </div>
</template>

<script>
// import axios from 'axios'
import moment from 'moment'
import helpers from '../helpers'
// import chartData from '../chartData'
import LineChart from '@/components/LineChart.js'
// import _ from 'lodash'
import log from 'loglevel'

export default {
  data () {
    return {
      loading: false,
      error: null,
      lastBlockTimeElapsed: null
    }
  },
  components: {
    LineChart
  },
  created () {
    log.info('overview')
    this.$store.dispatch('getBestBlock').then((d) => {
      var _this = this
      setInterval(function () {
        var time = moment.utc(_this.bestBlock.time * 1000)
        _this.lastBlockTimeElapsed = time.fromNow()
      }, 1000)
    })
  },
  watch: {
  },
  filters: {
    formatUnixDate: helpers.formatUnixDate
  },
  computed: {
    bestBlock () {
      return this.$store.state.bestBlock
    }
  },
  methods: {
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
dt {
  font-weight: 700;
  font-size: 0.76em;
  color: #565656;
}
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
