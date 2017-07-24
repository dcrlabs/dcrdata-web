<template>
  <div v-if="bestBlock" class="container-fluid">

    <div class="row">
      <div class="col-4">
        <dl>
          <dt>Current Ticket Price</dt>
          <dd>{{ bestBlock.sdiff | currency('',1) }} DCR</dd>

          <dt>Next Ticket Price Estimate:</dt>
          <dd v-if="stakeDiff">{{ stakeDiff.estimates.min | currency('',1) }} &mdash; {{ stakeDiff.estimates.max | currency('',1) }} DCR</dd>
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
          <dt>Avg Ticket Price</dt>
          <dd>{{ bestBlock.ticket_pool.valavg | currency('',1) }} DCR</dd>
          <dt>Last block mined at:</dt>
          <dd>
            {{ bestBlock.time | formatUnixDate('MMMM Do YYYY, h:mm:ss a') }} <small class="no-wrap">{{ lastBlockTimeElapsed }}</small>
          </dd>
        </dl>
      </div>
    </div>

    <div class="pos-rel chart-wrapper">
      <div v-if="ticketPoolSizeRange && !loadingChart">
        <line-chart
          :height="300"
          :chart-data="{
            labels: ticketPoolSizeRangeLabels,
            datasets:[
              {
                label: '# Tickets in Pool',
                yAxisID: 'y-axis-0',
                fill: false,
                backgroundColor: '#2970ff',
                borderColor: '#2970ff',
                data: ticketPoolSizeRange
              },
              {
                label: 'Ticket Price',
                yAxisID: 'y-axis-1',
                backgroundColor: '#2ed8a3',
                borderColor: '#2ed8a3',
                fill: false,
                data: ticketPrices
              }
            ]
          }"
          :options="ticketPoolSizeRangeOptions"
        ></line-chart>
        <div class="text-center" style="margin-top: -5px;"><small>Block Height</small></div>
      </div>
      <div v-if="loadingChart" class="chart-loader">Loading chart...</div>
    </div>

    <div class="row mb-2" v-if="ticketPoolSizeRange">
      <form class="form-inline col-sm-12" >
        <span>
          <label class="input-label">Block Height Start</label>
          <input type="number" v-model="start" @keyup="keymonitor" class="range-input form-control mb-2 mr-sm-1 mb-sm-0" id="inlineFormInput" placeholder="Block height start">
        </span>
        <span class="mr-sm-1">
          <label class="input-label">Block Height End</label>
          <input type="number" v-model="end" @keyup="keymonitor" class="range-input form-control" id="inlineFormInputGroup" placeholder="Block height end">
        </span>
        <span style="padding-top: 18px;">
          <button type="submit" class="btn btn-primary" v-on:click="update('ok', $event)">Update Chart</button>
        </span>
      </form>
    </div>

  </div>
</template>

<script>
import axios from 'axios'
import moment from 'moment'
import helpers from '../helpers'
import chartData from '../chartData'
import LineChart from '@/components/LineChart.js'
import _ from 'lodash'
import log from 'loglevel'

function updateStakeChart (data) {
  data.loadingChart = true
  if (data.start > data.end) {
    data.stakeChartInputError = 'start cannot be greater than end'
    return
  }
  chartData.getStakeChartData(data.start, data.end, data.$store.state.bestBlock)
    .then(function (response) {
      log.info('update getStakeChartData success', response)
      _.assign(data, response)
      data.loadingChart = false
    }, function (error) {
      log.info('getStakeChartData', error)
      data.loadingChart = false
    })
}

export default {
  data () {
    return {
      loadingChart: false,
      start: null,
      end: null,
      avgTimeBlockTimeInMinutes: null,
      lastBlockTimeElapsed: null,
      blockSizeRange: null,
      blockSizeRangeLabels: null,
      blockSizeRangeOptions: null,
      stakeDiff: null,
      ticketPoolSizeRange: null,
      ticketPoolSizeRangeLabels: null,
      ticketPoolSizeRangeOptions: null,
      ticketPrices: null,
      error: null
    }
  },
  components: {
    LineChart
  },
  created () {
    this.$store.dispatch('getBestBlock').then((d) => {
      var _this = this
      _this.fetchStarterData()
      setInterval(function () {
        var time = moment.utc(_this.bestBlock.time * 1000)
        _this.lastBlockTimeElapsed = time.fromNow()
      }, 1000)
    })
  },
  watch: {
    // call again the method if the route changes
    // '$route': 'fetchStarterData'
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
    keymonitor (event) {
      if (event.key === 'Enter') {
        updateStakeChart(this)
      }
    },
    update () {
      updateStakeChart(this)
    },
    fetchStarterData () {
      var _this = this
      console.log('fetchStarterData', _this.$store)
      _this.start = _this.$store.state.bestBlock.height - 5000
      _this.end = _this.$store.state.bestBlock.height
      updateStakeChart(_this)
      axios.get(helpers.apiUrl + 'stake/diff')
        .then(function (response) {
          log.info('stake/diff response', response)
          _this.stakeDiff = response.data
        })
        .catch(function (error) {
          log.info(error, this)
          log.info('this', this)
        })
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.chart-wrapper {
  min-height: 300px;
}
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
