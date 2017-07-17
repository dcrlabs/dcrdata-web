<template>
  <div v-if="bestBlock"  class="container-fluid">

    <div class="row">
      <div class="col-6">
        <p>
          Last block height: {{ bestBlock.height.toLocaleString() }}
        </p>
        <p>
          Last block time: {{ bestBlock.time | formatUnixDate('MMMM Do YYYY, h:mm:ss a') }}
          <br>
          <small>{{ lastBlockTimeElapsed }}</small>
        </p>
        <p>
          Average block time: <span v-if="avgTimeBlockTimeInMinutes">{{ avgTimeBlockTimeInMinutes }}</span>
        </p>
      </div>
      <div class="col-6">
        <p>
          Current Ticket Price: <strong>{{ bestBlock.sdiff | currency('',1) }} DCR</strong>
        </p>
        <p v-if="stakeDiff">
          Estimated price next window: {{ stakeDiff.estimates.min | currency('',1) }} &mdash; {{ stakeDiff.estimates.max | currency('',1) }} DCR
        </p>
        <p>Tickets in Pool: {{ bestBlock.ticket_pool.size.toLocaleString() }}</p>
        <p>Total DCR in Pool: {{ Math.round(bestBlock.ticket_pool.value).toLocaleString() }}</p>
        <p>Avg Ticket Price: {{ bestBlock.ticket_pool.valavg | currency('',1) }} DCR</p>
      </div>
    </div>

    <div v-if="ticketPoolSizeRange">
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
  if (data.start > data.end) {
    data.stakeChartInputError = 'start cannot be greater than end'
    return
  }
  chartData.getStakeChartData(data.start, data.end)
    .then(function (response) {
      log.info('update getStakeChartData success', response)
      _.assign(data, response)
    }, function (error) {
      log.info('getStakeChartData', error)
    })
}

export default {
  data () {
    return {
      loading: false,
      start: null,
      end: null,
      bestBlock: null,
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
    // fetch the data when the view is created and the data is
    // already being observed
    this.fetchStarterData()
    log.info('this', this)
  },
  watch: {
    // call again the method if the route changes
    '$route': 'fetchStarterData'
  },
  filters: {
    formatUnixDate: helpers.formatUnixDate
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
      this.error = this.bestBlock = null
      var _this = this
      axios.get(helpers.apiUrl + 'block/best')
        .then(function (response) {
          log.info('bestBlock', response)
          _this.start = response.data.height - 5000
          _this.end = response.data.height
          _this.bestBlock = response.data
          setInterval(function () {
            var time = moment.utc(_this.bestBlock.time * 1000)
            _this.lastBlockTimeElapsed = time.fromNow()
          }, 1000)
          updateStakeChart(_this)
        })
        .catch(function (error) {
          log.info(error, this)
          log.info('this', this)
        })

      axios.get(helpers.apiUrl + 'stake/diff')
        .then(function (response) {
          log.info('bestBlock', response)
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
